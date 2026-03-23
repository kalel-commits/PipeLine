from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import os

SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

class TokenData(BaseModel):
    user_id: int
    role: str
    exp: int = 9999999999

# Default token data used when auth is bypassed in dev mode
_DEV_TOKEN = TokenData(user_id=1, role="Admin", exp=9999999999)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return TokenData(user_id=payload["user_id"], role=payload["role"], exp=payload["exp"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

def require_role(*roles):
    def role_dependency(token: str = Depends(oauth2_scheme)):
        # DEV MODE: skip auth entirely, return a default Admin token
        if DEV_MODE:
            return _DEV_TOKEN
        if token is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        token_data = decode_access_token(token)
        if token_data.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return token_data
    return role_dependency
