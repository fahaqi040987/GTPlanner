"""
Middleware for GTPlanner Web Interface
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from typing import Optional
from uuid import UUID

from gtplanner.web.database import get_session
from gtplanner.web.models import User, UserRole
from gtplanner.web.utils import verify_token


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """
    Validate JWT token and return current user
    Raises HTTPException if token is invalid or user not found
    """
    token = credentials.credentials
    user_id = verify_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def require_role(required_roles: list[UserRole]):
    """
    Role-based authorization decorator factory
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(
            current_user: User = Depends(require_role([UserRole.ADMIN]))
        ):
            return {"message": "Welcome admin!"}
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {required_roles}"
            )
        return current_user
    return role_checker


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    session: Session = Depends(get_session)
) -> Optional[User]:
    """
    Optional authentication - returns user if token provided, None otherwise
    Useful for endpoints that work both authenticated and unauthenticated
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(credentials, session)
    except HTTPException:
        return None