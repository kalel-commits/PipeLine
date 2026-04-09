from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import os
import httpx
from db import SessionLocal
from models.user import User
from services.audit_log_service import log_action

router = APIRouter(prefix="/vcs-auth", tags=["VCS Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# These would typically be environment variables
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "mock_id")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "mock_secret")
GITLAB_CLIENT_ID = os.getenv("GITLAB_CLIENT_ID", "mock_id")
GITLAB_CLIENT_SECRET = os.getenv("GITLAB_CLIENT_SECRET", "mock_secret")

# The root URL of this Render deployment
RENDER_HOST = os.getenv("RENDER_EXTERNAL_URL", "https://pipeline-9ux3.onrender.com")

@router.get("/{provider}/login")
def vcs_login(provider: str):
    """Redirects the user to the VCS OAuth page."""
    if provider == "github":
        url = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=admin:repo_hook,repo"
    elif provider == "gitlab":
        url = f"https://gitlab.com/oauth/authorize?client_id={GITLAB_CLIENT_ID}&response_type=code&scope=api&redirect_uri={RENDER_HOST}/api/v1/vcs-auth/gitlab/callback"
    else:
        raise HTTPException(status_code=400, detail="Invalid provider")
    return {"url": url}

@router.get("/{provider}/callback")
async def vcs_callback(provider: str, code: str, db: Session = Depends(get_db)):
    """Handles the OAuth callback, exchanges token, and registers webhooks."""
    async with httpx.AsyncClient() as client:
        try:
            # 1. Token Exchange
            if provider == "github":
                token_url = "https://github.com/login/oauth/access_token"
                token_data = {
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code
                }
            else: # gitlab
                token_url = "https://gitlab.com/oauth/token"
                token_data = {
                    "client_id": GITLAB_CLIENT_ID,
                    "client_secret": GITLAB_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": f"{RENDER_HOST}/api/v1/vcs-auth/gitlab/callback"
                }

            token_resp = await client.post(token_url, data=token_data, headers={"Accept": "application/json"})
            token_resp.raise_for_status()
            token = token_resp.json().get("access_token")

            if not token:
                raise HTTPException(status_code=400, detail="Failed to retrieve access token")

            # 2. Automation: Discover & Register Webhook
            # For this "Real Flow", we dynamically find the user's repos
            if provider == "github":
                repo_info = await discover_and_hook_github(client, token)
            else:
                repo_info = await discover_and_hook_gitlab(client, token)

            log_action(db, 0, f"vcs_automation:{provider}:success", None, "System", "success")
            
            # The "One-Click" redirection: Send the user back to the Vercel Dashboard with their token
            # Note: For production, we'd use an environmental variable for the FRONTEND_URL
            frontend_url = os.getenv("FRONTEND_URL", "https://pipe-line-five.vercel.app")
            return RedirectResponse(url=f"{frontend_url}/login?token={token}")

        except Exception as e:
            log_action(db, 0, f"vcs_automation:{provider}:failed", None, "System", "failure")
            return {"status": "error", "message": f"Integration failed: {str(e)}"}

async def discover_and_hook_github(client: httpx.AsyncClient, token: str):
    """Discovers the user's most recent repo and registers a webhook."""
    headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"}
    
    # Get user's repos
    repos_resp = await client.get("https://api.github.com/user/repos?sort=updated&per_page=1", headers=headers)
    repos_resp.raise_for_status()
    repos = repos_resp.json()
    
    if not repos:
        return {"id": None, "name": "No repositories found"}
    
    repo = repos[0]
    repo_full_name = repo["full_name"]
    hooks_url = repo["hooks_url"]
    
    # Register Webhook
    webhook_url = f"{RENDER_HOST}/api/v1/vcs/webhook"
    hook_payload = {
        "name": "web",
        "active": True,
        "events": ["push", "pull_request"],
        "config": {
            "url": webhook_url,
            "content_type": "json",
            "insecure_ssl": "0"
        }
    }
    
    # We ignore failures here if the hook already exists
    await client.post(hooks_url, json=hook_payload, headers=headers)
    
    return {"id": repo["id"], "name": repo_full_name, "webhook": "registered"}

async def discover_and_hook_gitlab(client: httpx.AsyncClient, token: str):
    """Discovers the user's most recent GitLab project and registers a webhook."""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get projects
    projects_resp = await client.get("https://gitlab.com/api/v4/projects?membership=true&order_by=updated_at&per_page=1", headers=headers)
    projects_resp.raise_for_status()
    projects = projects_resp.json()
    
    if not projects:
        return {"id": None, "name": "No projects found"}
    
    project = projects[0]
    project_id = project["id"]
    hooks_url = f"https://gitlab.com/api/v4/projects/{project_id}/hooks"
    
    # Register Webhook
    webhook_url = f"{RENDER_HOST}/api/v1/vcs/webhook"
    hook_payload = {
        "url": webhook_url,
        "push_events": True,
        "merge_requests_events": True,
        "enable_ssl_verification": True
    }
    
    await client.post(hooks_url, json=hook_payload, headers=headers)
    
    return {"id": project_id, "name": project["name_with_namespace"], "webhook": "registered"}
