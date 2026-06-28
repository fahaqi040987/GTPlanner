"""
Authentication routes for user registration, login, logout
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta, datetime
from uuid import uuid4
from pydantic import BaseModel, EmailStr, Field

from gtplanner.web.database import get_session
from gtplanner.web.models import User, Session as UserSession, UserRole
from gtplanner.web.utils import (
    verify_password, get_password_hash, create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from gtplanner.web.middleware import get_current_user


router = APIRouter()


# Pydantic models for request/response
class UserRegister(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)


class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response"""
    id: str
    email: str
    name: str
    role: UserRole
    created_at: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    token_type: str
    user: UserResponse


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, session: Session = Depends(get_session)):
    """
    Register a new user account
    - Validates email uniqueness
    - Hashes password securely
    - Creates user with default VIEWER role
    """
    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Create new user
    user = User(
        id=str(uuid4()),
        email=user_data.email,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password),
        role=UserRole.VIEWER  # Default role
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        created_at=user.created_at.isoformat()
    )


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, session: Session = Depends(get_session)):
    """
    Authenticate user and return JWT token
    - Validates credentials
    - Returns access token
    - Creates session record
    """
    # Find user by email
    user = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()

    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # Create session record
    expires_at = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    user_session = UserSession(
        id=str(uuid4()),
        user_id=user.id,
        token=access_token,
        expires_at=expires_at
    )

    session.add(user_session)
    session.commit()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            created_at=user.created_at.isoformat()
        )
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Logout current user
    - Invalidates current session
    - Client should discard token
    """
    # Delete all sessions for this user (or just current session)
    # For simplicity, we're deleting all sessions
    sessions = session.exec(
        select(UserSession).where(UserSession.user_id == current_user.id)
    ).all()

    for session_obj in sessions:
        session.delete(session_obj)

    session.commit()

    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        created_at=current_user.created_at.isoformat()
    )


@router.post("/token", response_model=TokenResponse)
async def login_oauth2(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    """
    OAuth2 compatible token endpoint for FastAPI's OAuth2PasswordBearer
    This enables using FastAPI's built-in security utilities
    """
    return await login(UserLogin(email=form_data.username, password=form_data.password), session)