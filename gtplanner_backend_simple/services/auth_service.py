"""
Authentication service for user management
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session
from ..core.config import settings
from ..models.user import User
from ..models.schemas import UserCreate, Token, UserResponse


class AuthService:
    """Service for authentication operations"""

    def __init__(self):
        """Initialize authentication service"""
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash"""
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False

    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        # Generate salt and hash password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[str]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            email: str = payload.get("sub")
            if email is None:
                return None
            return email
        except JWTError:
            return None

    async def register_user(self, db: Session, user_data: UserCreate) -> UserResponse:
        """Register a new user"""
        # Check if user exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise ValueError("User with this email already exists")

        # Create new user
        hashed_password = self.get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            password_hash=hashed_password
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return UserResponse.model_validate(db_user)

    async def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate a user"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        return user

    async def login(self, db: Session, email: str, password: str) -> Token:
        """Login a user and return access token"""
        user = await self.authenticate_user(db, email, password)
        if not user:
            raise ValueError("Incorrect email or password")

        access_token = self.create_access_token(data={"sub": user.email})
        return Token(access_token=access_token)

    async def get_current_user(self, db: Session, token: str) -> UserResponse:
        """Get current user from token"""
        email = self.verify_token(token)
        if email is None:
            raise ValueError("Could not validate credentials")

        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise ValueError("User not found")

        return UserResponse.model_validate(user)


# Global instance
auth_service = AuthService()
