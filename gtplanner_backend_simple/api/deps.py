"""
Shared FastAPI dependencies — the provider seam for the API layer.

Routes depend on these providers instead of importing service singletons
directly, so tests can swap adapters via `app.dependency_overrides`.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.user import User
from ..services.auth_service import AuthService, auth_service
from ..services.document_service import DocumentService, document_service
from ..services.llm_config_service import LLMConfigService, llm_config_service
from ..services.prd_generator import PRDGenerator, prd_generator
from ..services.workflow_service import WorkflowService, workflow_service

# auto_error=False so a missing/invalid Authorization header becomes our 401
# (HTTPBearer's default would be 403)
_bearer = HTTPBearer(auto_error=False)


def provide_auth_service() -> AuthService:
    return auth_service


def provide_document_service() -> DocumentService:
    return document_service


def provide_llm_config_service() -> LLMConfigService:
    return llm_config_service


def provide_prd_generator() -> PRDGenerator:
    return prd_generator


def provide_workflow_service() -> WorkflowService:
    return workflow_service


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
    auth: AuthService = Depends(provide_auth_service),
) -> User:
    """Resolve the Bearer token to the User ORM row (401 on any failure)"""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    email = auth.verify_token(credentials.credentials)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return user


def get_current_admin_user(user: User = Depends(get_current_user)) -> User:
    """Guard for admin-only routes"""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user
