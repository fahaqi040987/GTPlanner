"""
Authentication API tests for GTPlanner backend
Tests for login, token validation, and authentication flows

Uses the shared conftest bootstrap (in-memory DB, jose auth headers).
Service mocks are applied with monkeypatch so they always restore.
"""
import time

import pytest
from jose import jwt

from gtplanner_backend_simple.core.config import settings
from gtplanner_backend_simple.models.user import User
from gtplanner_backend_simple.services.auth_service import auth_service


def make_token(payload: dict) -> str:
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


class TestAuthentication:
    """Test authentication functionality"""

    def test_valid_login_returns_token(self, client, db, monkeypatch):
        """
        ✅ Testing Checklist: Valid login returns token

        Test that a user with valid credentials receives a JWT token
        """
        user = User(email="test@example.com", password_hash="$2b$12$test_hash")
        db.add(user)
        db.commit()

        async def mock_authenticate_user(db, email, password):
            return user

        monkeypatch.setattr(auth_service, "authenticate_user", mock_authenticate_user)

        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword"
        })

        assert response.status_code == 200
        assert "access_token" in response.json()
        assert response.json()["access_token"]  # Token is not empty

    def test_invalid_credentials_return_401(self, client, monkeypatch):
        """
        ✅ Testing Checklist: Invalid credentials return 401

        Test that invalid credentials return 401 Unauthorized
        """
        async def mock_authenticate_user(db, email, password):
            return None

        monkeypatch.setattr(auth_service, "authenticate_user", mock_authenticate_user)

        response = client.post("/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })

        assert response.status_code == 401
        assert "detail" in response.json()

    def test_expired_token_returns_401(self, client, db):
        """
        ✅ Testing Checklist: Expired token returns 401

        Test that an expired token returns 401 Unauthorized
        """
        user = User(email="expired@example.com", password_hash="x")
        db.add(user)
        db.commit()

        # Expired one hour ago (epoch seconds — jose validates exp)
        expired_token = make_token({
            "sub": user.email,
            "exp": int(time.time()) - 3600,
        })

        response = client.get(
            "/api/documents",
            headers={"Authorization": f"Bearer {expired_token}"}
        )

        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]

    def test_malformed_token_returns_401(self, client):
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

    def test_missing_token_returns_401(self, client):
        """
        Test that requests without token return 401
        """
        response = client.get("/api/documents")
        assert response.status_code == 401


class TestCurrentUserEndpoint:
    """Test current user endpoint"""

    def test_get_current_user_with_valid_token(self, client, db):
        """Test getting current user with valid token"""
        user = User(email="me@example.com", password_hash="x", role="user")
        db.add(user)
        db.commit()

        token = make_token({"sub": user.email})

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        assert response.json()["email"] == user.email

    def test_get_current_user_with_invalid_token(self, client):
        """Test getting current user with invalid token"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )

        assert response.status_code == 401


class TestTokenSecurity:
    """Test token security features"""

    def test_token_without_bearer_prefix(self, client, db):
        """Test that token without 'Bearer' prefix is rejected"""
        db.add(User(email="prefix@example.com", password_hash="x"))
        db.commit()

        token = make_token({"sub": "prefix@example.com"})

        # Send without Bearer prefix
        response = client.get(
            "/api/documents",
            headers={"Authorization": token}
        )

        assert response.status_code == 401

    def test_token_with_wrong_algorithm(self, client, db):
        """Test that token with wrong algorithm is rejected"""
        db.add(User(email="alg@example.com", password_hash="x"))
        db.commit()

        # Create token with wrong algorithm (HS512 instead of HS256)
        token = jwt.encode(
            {"sub": "alg@example.com"},
            settings.SECRET_KEY,
            algorithm="HS512"
        )

        response = client.get(
            "/api/documents",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
