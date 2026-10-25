"""
Role & authorization foundation tests for GTPlanner backend (PRD v2.2.0)

Covers:
- First registered user becomes admin, subsequent users are regular users
- /api/auth/me exposes the role field
- get_current_admin_user dependency guards routes (401/403/200)

Uses the shared conftest bootstrap (in-memory DB, jose auth headers).
"""
from fastapi import Depends

from gtplanner_backend_simple.api.deps import get_current_admin_user
from gtplanner_backend_simple.main import app
from gtplanner_backend_simple.models.user import User
from tests.conftest import make_auth_headers


# Test-only route to exercise the admin guard
@app.get("/test/admin-only", include_in_schema=False)
async def test_admin_only_route(user: User = Depends(get_current_admin_user)):
    return {"email": user.email, "role": user.role}


class TestFirstUserBecomesAdmin:
    """Registration role assignment"""

    def test_first_registered_user_is_admin(self, client, db):
        """First user to register gets the admin role"""
        response = client.post("/api/auth/register", json={
            "email": "first@example.com",
            "password": "supersecret1"
        })

        assert response.status_code == 201
        assert response.json()["role"] == "admin"

    def test_subsequent_users_are_regular(self, client, db):
        """Users registering after the first one are regular users"""
        client.post("/api/auth/register", json={
            "email": "first@example.com",
            "password": "supersecret1"
        })
        response = client.post("/api/auth/register", json={
            "email": "second@example.com",
            "password": "supersecret2"
        })

        assert response.status_code == 201
        assert response.json()["role"] == "user"

    def test_me_endpoint_exposes_role(self, client, db):
        """/api/auth/me returns the caller's role"""
        client.post("/api/auth/register", json={
            "email": "first@example.com",
            "password": "supersecret1"
        })
        response = client.get(
            "/api/auth/me",
            headers=make_auth_headers("first@example.com")
        )

        assert response.status_code == 200
        assert response.json()["role"] == "admin"


class TestAdminGuardDependency:
    """get_current_admin_user dependency behavior"""

    def test_admin_can_access_admin_route(self, client, db):
        """Users with the admin role pass the guard"""
        db.add(User(email="admin@example.com", password_hash="x", role="admin"))
        db.commit()

        response = client.get(
            "/test/admin-only",
            headers=make_auth_headers("admin@example.com")
        )

        assert response.status_code == 200
        assert response.json() == {
            "email": "admin@example.com",
            "role": "admin"
        }

    def test_regular_user_gets_403(self, client, db):
        """Users without the admin role are rejected with 403"""
        db.add(User(email="member@example.com", password_hash="x", role="user"))
        db.commit()

        response = client.get(
            "/test/admin-only",
            headers=make_auth_headers("member@example.com")
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "Admin privileges required"

    def test_missing_token_gets_401(self, client, db):
        """Unauthenticated requests are rejected with 401"""
        response = client.get("/test/admin-only")

        assert response.status_code == 401
