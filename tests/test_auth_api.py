"""
Authentication API tests for GTPlanner backend
Tests for login, token validation, and authentication flows
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from gtplanner_backend_simple.main import app
from gtplanner_backend_simple.core.database import get_db
from gtplanner_backend_simple.models.base import Base
from gtplanner_backend_simple.models.user import User
from gtplanner_backend_simple.models.document import Document

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    """Setup test database before each test"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user(db):
    """Create a test user"""
    user = User(
        email="test@example.com",
        password_hash="$2b$12$test_hash"  # Mock hash
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def db():
    """Get database session"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestAuthentication:
    """Test authentication functionality"""

    def test_valid_login_returns_token(self, test_user, db):
        """
        ✅ Testing Checklist: Valid login returns token

        Test that a user with valid credentials receives a JWT token
        """
        # Mock the authentication to bypass password verification
        from gtplanner_backend_simple.services.auth_service import auth_service

        # Override authenticate_user for testing
        async def mock_authenticate_user(db, email, password):
            return test_user

        auth_service.authenticate_user = mock_authenticate_user

        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword"
        })

        assert response.status_code == 200
        assert "access_token" in response.json()
        assert response.json()["access_token"]  # Token is not empty

    def test_invalid_credentials_return_401(self):
        """
        ✅ Testing Checklist: Invalid credentials return 401

        Test that invalid credentials return 401 Unauthorized
        """
        from gtplanner_backend_simple.services.auth_service import auth_service

        # Override authenticate_user to return None (invalid credentials)
        async def mock_authenticate_user(db, email, password):
            return None

        auth_service.authenticate_user = mock_authenticate_user

        response = client.post("/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })

        assert response.status_code == 401
        assert "detail" in response.json()

    def test_expired_token_returns_401(self, test_user):
        """
        ✅ Testing Checklist: Expired token returns 401

        Test that an expired token returns 401 Unauthorized
        """
        import jwt
        from gtplanner_backend_simple.core.config import settings
        from datetime import datetime, timedelta

        # Create an expired token (expired 1 hour ago)
        expired_data = {"sub": test_user.email}
        expire = datetime.utcnow() - timedelta(hours=1)
        expired_data.update({"exp": expire})
        expired_token = jwt.encode(expired_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

        response = client.get(
            "/api/documents",
            headers={"Authorization": f"Bearer {expired_token}"}
        )

        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]

    def test_malformed_token_returns_401(self):
        """
        ✅ Testing Checklist: Malformed token returns 401

        Test that a malformed token returns 401 Unauthorized
        """
        malformed_tokens = [
            "invalid.token.here",
            "Bearer invalid",
            "not-even-a-token",
            "",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid"
        ]

        for bad_token in malformed_tokens:
            response = client.get(
                "/api/documents",
                headers={"Authorization": f"Bearer {bad_token}"}
            )

            assert response.status_code == 401, f"Failed for token: {bad_token}"

    def test_missing_token_returns_401(self):
        """
        Test that requests without token return 401
        """
        response = client.get("/api/documents")
        assert response.status_code == 401


class TestCurrentUserEndpoint:
    """Test current user endpoint"""

    def test_get_current_user_with_valid_token(self, test_user):
        """Test getting current user with valid token"""
        import jwt
        from gtplanner_backend_simple.core.config import settings

        # Create a valid token
        token_data = {"sub": test_user.email}
        token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        assert response.json()["email"] == test_user.email

    def test_get_current_user_with_invalid_token(self):
        """Test getting current user with invalid token"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )

        assert response.status_code == 401


class TestTokenSecurity:
    """Test token security features"""

    def test_token_without_bearer_prefix(self):
        """Test that token without 'Bearer' prefix is rejected"""
        import jwt
        from gtplanner_backend_simple.core.config import settings

        token_data = {"sub": "test@example.com"}
        token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

        # Send without Bearer prefix
        response = client.get(
            "/api/documents",
            headers={"Authorization": token}
        )

        assert response.status_code == 401

    def test_token_with_wrong_algorithm(self):
        """Test that token with wrong algorithm is rejected"""
        import jwt
        from gtplanner_backend_simple.core.config import settings

        # Create token with wrong algorithm (HS512 instead of HS256)
        token_data = {"sub": "test@example.com"}
        token = jwt.encode(token_data, settings.SECRET_KEY, algorithm="HS512")

        response = client.get(
            "/api/documents",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])