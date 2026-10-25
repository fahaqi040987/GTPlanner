"""
Authentication routes: register, login, current user
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.schemas import Token, UserCreate, UserLogin, UserResponse
from ..models.user import User
from ..services.auth_service import AuthService
from .deps import get_current_user, provide_auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(provide_auth_service),
) -> UserResponse:
    """Register a user; the first registered user becomes platform admin"""
    try:
        return await auth_service.register_user(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.post("/login", response_model=Token)
async def login(
    payload: UserLogin,
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(provide_auth_service),
) -> Token:
    """Exchange credentials for a JWT access token"""
    try:
        return await auth_service.login(db, payload.email, payload.password)
    except ValueError as exc:
        # Generic message on purpose: no user enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """The authenticated user's own profile (includes role)"""
    return UserResponse.model_validate(current_user)
