from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import os
import httpx
from db import SessionLocal
from models.user import User, UserRole
from services.audit_log_service import log_action
from utils.jwt_auth import create_access_token
from datetime import timedelta

router = APIRouter(prefix="/vcs-auth", tags=["VCS Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "mock_id")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "mock_secret")
GITLAB_CLIENT_ID = os.getenv("GITLAB_CLIENT_ID", "mock_id")
GITLAB_CLIENT_SECRET = os.getenv("GITLAB_CLIENT_SECRET", "mock_secret")

RENDER_HOST = os.getenv("RENDER_EXTERNAL_URL", "https://pipeline-9ux3.onrender.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://pipe-line-five.vercel.app")

# ─── OAuth Login Redirect ──────────────────────────────────────────
@router.get("/{provider}/login")
def vcs_login(provider: str):
    """Redirects the user to the VCS OAuth page with all required scopes."""
    if provider == "github":
        # Include user:email so we can identify the user and repo scope for webhooks
        url = (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={GITHUB_CLIENT_ID}"
            f"&scope=repo,admin:repo_hook,user:email"
        )
    elif provider == "gitlab":
        redirect_uri = f"{RENDER_HOST}/api/v1/vcs-auth/gitlab/callback"
        url = (
            f"https://gitlab.com/oauth/authorize"
            f"?client_id={GITLAB_CLIENT_ID}"
            f"&response_type=code"
            f"&scope=api read_user"
            f"&redirect_uri={redirect_uri}"
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid provider. Use 'github' or 'gitlab'.")
    return {"url": url}


# ─── OAuth Callback ────────────────────────────────────────────────
@router.get("/{provider}/callback")
async def vcs_callback(provider: str, code: str, db: Session = Depends(get_db)):
    """
    Handles the OAuth callback. Exchanges code for token, identifies the user,
    creates/updates their PipelineAI account, and redirects to the frontend.
    """
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            # ── 1. Exchange code for access token ──
            if provider == "github":
                token_resp = await client.post(
                    "https://github.com/login/oauth/access_token",
                    data={
                        "client_id": GITHUB_CLIENT_ID,
                        "client_secret": GITHUB_CLIENT_SECRET,
                        "code": code,
                    },
                    headers={"Accept": "application/json"},
                )
            else:  # gitlab
                token_resp = await client.post(
                    "https://gitlab.com/oauth/token",
                    data={
                        "client_id": GITLAB_CLIENT_ID,
                        "client_secret": GITLAB_CLIENT_SECRET,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": f"{RENDER_HOST}/api/v1/vcs-auth/gitlab/callback",
                    },
                    headers={"Accept": "application/json"},
                )

            token_resp.raise_for_status()
            vcs_token = token_resp.json().get("access_token")
            if not vcs_token:
                raise ValueError(f"No access_token in response: {token_resp.text}")

            # ── 2. Identify the user from the VCS provider ──
            if provider == "github":
                user_resp = await client.get(
                    "https://api.github.com/user",
                    headers={"Authorization": f"token {vcs_token}", "Accept": "application/vnd.github.v3+json"},
                )
                user_resp.raise_for_status()
                gh_user = user_resp.json()
                vcs_login_name = gh_user.get("login", "github_user")
                vcs_name = gh_user.get("name") or vcs_login_name
                vcs_email = gh_user.get("email")

                # If public email is hidden, fetch it explicitly
                if not vcs_email:
                    emails_resp = await client.get(
                        "https://api.github.com/user/emails",
                        headers={"Authorization": f"token {vcs_token}", "Accept": "application/vnd.github.v3+json"},
                    )
                    if emails_resp.status_code == 200:
                        emails = emails_resp.json()
                        primary = next((e for e in emails if e.get("primary") and e.get("verified")), None)
                        vcs_email = primary["email"] if primary else (emails[0]["email"] if emails else None)
            else:  # gitlab
                user_resp = await client.get(
                    "https://gitlab.com/api/v4/user",
                    headers={"Authorization": f"Bearer {vcs_token}"},
                )
                user_resp.raise_for_status()
                gl_user = user_resp.json()
                vcs_login_name = gl_user.get("username", "gitlab_user")
                vcs_name = gl_user.get("name") or vcs_login_name
                vcs_email = gl_user.get("email")

            if not vcs_email:
                vcs_email = f"{vcs_login_name}@{provider}.local"

            # ── 3. Find or create PipelineAI user ──
            db_user = db.query(User).filter(User.email == vcs_email).first()

            if not db_user:
                # Auto-create a new Developer account for this OAuth user
                print(f"✅ VCS Auth: Creating new user for {vcs_email}")
                from utils.security import hash_password
                import secrets
                db_user = User(
                    name=vcs_name,
                    email=vcs_email,
                    hashed_password=hash_password(secrets.token_urlsafe(32)),
                    role=UserRole.developer,
                    is_active=True,
                    failed_login_attempts=0,
                    is_locked=False,
                )
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
            else:
                print(f"✅ VCS Auth: Existing user found: {vcs_email}")

            # ── 4. Persist the VCS token and login on the user ──
            db_user.vcs_token = vcs_token
            db_user.vcs_provider = provider
            db_user.vcs_github_login = vcs_login_name
            db.commit()

            # ── 5. Issue a PipelineAI JWT so the frontend session is real ──
            pipeline_jwt = create_access_token(
                {"user_id": db_user.id, "role": db_user.role.value},
                expires_delta=timedelta(hours=24)
            )

            log_action(db, db_user.id, f"vcs_login:{provider}", None, db_user.role.value, "success")

            # ── 6. Redirect to frontend with our own JWT (not the raw VCS token) ──
            return RedirectResponse(url=f"{FRONTEND_URL}/login?token={pipeline_jwt}")

        except Exception as e:
            print(f"🔥 VCS Callback Error: {e}")
            import traceback
            traceback.print_exc()
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=vcs_auth_failed&detail={str(e)[:120]}")


# ─── List Repositories for this user ──────────────────────────────
@router.get("/repositories")
async def list_repositories(request: Request, db: Session = Depends(get_db)):
    """
    Returns the authenticated user's list of repositories from their VCS provider.
    Requires a valid PipelineAI JWT in the Authorization header.
    """
    from utils.jwt_auth import decode_access_token
    from fastapi.security.utils import get_authorization_scheme_param

    auth_header = request.headers.get("Authorization", "")
    scheme, token = get_authorization_scheme_param(auth_header)
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        token_data = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    db_user = db.query(User).filter(User.id == token_data.user_id).first()
    if not db_user or not db_user.vcs_token:
        return {"repos": [], "error": "No VCS token found. Please connect GitHub/GitLab first."}

    provider = db_user.vcs_provider or "github"
    vcs_token = db_user.vcs_token

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if provider == "github":
                repos_resp = await client.get(
                    "https://api.github.com/user/repos?sort=updated&per_page=30&type=owner",
                    headers={"Authorization": f"token {vcs_token}", "Accept": "application/vnd.github.v3+json"},
                )
                repos_resp.raise_for_status()
                repos = [
                    {
                        "id": str(r["id"]),
                        "name": r["full_name"],
                        "description": r.get("description") or "",
                        "is_private": r["private"],
                        "hooks_url": r["hooks_url"],
                        "updated_at": r.get("updated_at", ""),
                    }
                    for r in repos_resp.json()
                ]
            else:  # gitlab
                repos_resp = await client.get(
                    "https://gitlab.com/api/v4/projects?membership=true&order_by=updated_at&per_page=30",
                    headers={"Authorization": f"Bearer {vcs_token}"},
                )
                repos_resp.raise_for_status()
                repos = [
                    {
                        "id": str(r["id"]),
                        "name": r["path_with_namespace"],
                        "description": r.get("description") or "",
                        "is_private": r.get("visibility") != "public",
                        "hooks_url": None,
                        "updated_at": r.get("last_activity_at", ""),
                    }
                    for r in repos_resp.json()
                ]
        return {"repos": repos, "provider": provider, "connected_as": db_user.vcs_github_login}
    except Exception as e:
        print(f"🔥 List Repos Error: {e}")
        return {"repos": [], "error": f"Failed to fetch repositories: {str(e)}"}


# ─── Register webhook for a specific repo ─────────────────────────
@router.post("/hook")
async def register_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Registers a webhook on the selected repository. 
    Body: { "repo_id": "123456", "repo_name": "user/reponame", "hooks_url": "..." }
    """
    from utils.jwt_auth import decode_access_token
    from fastapi.security.utils import get_authorization_scheme_param

    auth_header = request.headers.get("Authorization", "")
    scheme, token = get_authorization_scheme_param(auth_header)
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        token_data = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    db_user = db.query(User).filter(User.id == token_data.user_id).first()
    if not db_user or not db_user.vcs_token:
        raise HTTPException(status_code=400, detail="No VCS token found. Please connect GitHub/GitLab first.")

    body = await request.json()
    repo_id = body.get("repo_id")
    repo_name = body.get("repo_name")
    hooks_url = body.get("hooks_url")

    if not repo_id or not repo_name:
        raise HTTPException(status_code=400, detail="repo_id and repo_name are required.")

    provider = db_user.vcs_provider or "github"
    vcs_token = db_user.vcs_token
    webhook_url = f"{RENDER_HOST}/api/v1/vcs/webhook"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if provider == "github":
                if not hooks_url:
                    # Derive hooks_url from repo_name
                    hooks_url = f"https://api.github.com/repos/{repo_name}/hooks"

                # Check if webhook already exists to avoid duplicates
                existing_resp = await client.get(
                    hooks_url,
                    headers={"Authorization": f"token {vcs_token}", "Accept": "application/vnd.github.v3+json"},
                )
                existing_hooks = existing_resp.json() if existing_resp.status_code == 200 else []
                for h in (existing_hooks if isinstance(existing_hooks, list) else []):
                    if h.get("config", {}).get("url") == webhook_url:
                        # Already hooked — just update the DB
                        db_user.vcs_repo_id = repo_id
                        db_user.vcs_repo_name = repo_name
                        db_user.vcs_webhook_id = str(h["id"])
                        db.commit()
                        return {"status": "already_exists", "repo": repo_name, "webhook_url": webhook_url}

                hook_resp = await client.post(
                    hooks_url,
                    json={
                        "name": "web",
                        "active": True,
                        "events": ["push", "pull_request"],
                        "config": {
                            "url": webhook_url,
                            "content_type": "json",
                            "insecure_ssl": "0",
                        },
                    },
                    headers={"Authorization": f"token {vcs_token}", "Accept": "application/vnd.github.v3+json"},
                )
                if hook_resp.status_code not in (200, 201):
                    raise ValueError(f"GitHub webhook creation failed: {hook_resp.status_code} {hook_resp.text}")
                hook_id = hook_resp.json().get("id")

            else:  # gitlab
                project_id = repo_id
                hook_resp = await client.post(
                    f"https://gitlab.com/api/v4/projects/{project_id}/hooks",
                    json={
                        "url": webhook_url,
                        "push_events": True,
                        "merge_requests_events": True,
                        "enable_ssl_verification": True,
                    },
                    headers={"Authorization": f"Bearer {vcs_token}"},
                )
                if hook_resp.status_code not in (200, 201):
                    raise ValueError(f"GitLab webhook creation failed: {hook_resp.status_code} {hook_resp.text}")
                hook_id = hook_resp.json().get("id")

        # Persist the selected repo and webhook ID
        db_user.vcs_repo_id = repo_id
        db_user.vcs_repo_name = repo_name
        db_user.vcs_webhook_id = str(hook_id) if hook_id else None
        db.commit()

        log_action(db, db_user.id, f"vcs_webhook_registered:{repo_name}", None, db_user.role.value, "success")
        return {
            "status": "success",
            "repo": repo_name,
            "webhook_url": webhook_url,
            "webhook_id": hook_id,
        }

    except Exception as e:
        print(f"🔥 Register Webhook Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Get current VCS connection status for the logged-in user ─────
@router.get("/status")
async def vcs_status(request: Request, db: Session = Depends(get_db)):
    """Returns parsed VCS connection status for the current user."""
    from utils.jwt_auth import decode_access_token
    from fastapi.security.utils import get_authorization_scheme_param

    auth_header = request.headers.get("Authorization", "")
    scheme, token = get_authorization_scheme_param(auth_header)
    if scheme.lower() != "bearer" or not token:
        return {"connected": False}

    try:
        token_data = decode_access_token(token)
    except Exception:
        return {"connected": False}

    db_user = db.query(User).filter(User.id == token_data.user_id).first()
    if not db_user:
        return {"connected": False}

    return {
        "connected": bool(db_user.vcs_token),
        "provider": db_user.vcs_provider,
        "connected_as": db_user.vcs_github_login,
        "repo_name": db_user.vcs_repo_name,
        "repo_id": db_user.vcs_repo_id,
        "webhook_id": db_user.vcs_webhook_id,
        "webhook_active": bool(db_user.vcs_webhook_id),
    }
