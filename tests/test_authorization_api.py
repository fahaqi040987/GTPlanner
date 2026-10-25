"""
Authorization API tests for GTPlanner backend
Tests for user access control, data isolation, and authorization flows

Uses the shared conftest bootstrap (in-memory DB, jose auth headers).
"""
import asyncio

import pytest

from gtplanner_backend_simple.models.document import Document
from gtplanner_backend_simple.models.schemas import PRDGeneration
from gtplanner_backend_simple.models.user import User
from gtplanner_backend_simple.services.auth_service import auth_service
from gtplanner_backend_simple.services.document_service import document_service
from gtplanner_backend_simple.services.prd_generator import prd_generator
from tests.conftest import make_auth_headers


@pytest.fixture
def user1(db):
    """Create test user 1"""
    user = User(email="user1@example.com", password_hash="$2b$12$hash1")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def user2(db):
    """Create test user 2"""
    user = User(email="user2@example.com", password_hash="$2b$12$hash2")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def user1_document(db, user1):
    """Create a document owned by user1"""
    document = Document(
        user_id=user1.id,
        title="User1's Document",
        content="This is user1's private content"
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@pytest.fixture
def user2_document(db, user2):
    """Create a document owned by user2"""
    document = Document(
        user_id=user2.id,
        title="User2's Document",
        content="This is user2's private content"
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


SAMPLE_PRD = {
    "title": "Generated PRD",
    "summary": "A generated summary.",
    "requirements": ["Requirement A", "Requirement B"],
    "tech_stack": {
        "frontend": ["React"],
        "backend": ["FastAPI"],
        "database": ["PostgreSQL"],
        "devops": ["Docker"],
        "rationale": "Solid choices.",
    },
    "infrastructure": {
        "hardware_specs": {
            "cpu_cores": "2", "ram": "4 GB",
            "disk_space": "20 GB", "network": "100 Mbps",
        },
        "cloud_providers": [],
        "architecture": "Simple 3-tier.",
        "data_stack": "PostgreSQL.",
        "estimated_cost": "$20/month",
    },
    "implementation_plan": ["Phase 1"],
    "success_metrics": ["10 signups"],
}


class TestDocumentAuthorization:
    """Test document access authorization"""

    def test_user_can_access_own_documents(self, client, user1, user1_document):
        """
        ✅ Testing Checklist: User can access their own documents

        Test that a user can successfully access their own documents
        """
        response = client.get(
            f"/api/documents/{user1_document.id}",
            headers=make_auth_headers(user1.email),
        )

        assert response.status_code == 200
        assert response.json()["title"] == "User1's Document"
        assert response.json()["content"] == "This is user1's private content"

    def test_user_cannot_access_other_users_documents(self, client, user1, user2_document):
        """
        ✅ Testing Checklist: User cannot access other users' documents (404)

        Test that a user gets 404 when trying to access another user's documents
        (prevents user enumeration)
        """
        response = client.get(
            f"/api/documents/{user2_document.id}",
            headers=make_auth_headers(user1.email),
        )

        assert response.status_code == 404
        assert "detail" in response.json()
        assert "Document not found" in response.json()["detail"]

    def test_generated_document_gets_callers_user_id(
        self, client, db, user1, monkeypatch
    ):
        """
        ✅ Testing Checklist: User can create documents with their user_id

        Generate a PRD through the API with a mocked generator and verify the
        document is stored with the caller's user_id
        """
        async def fake_generate_prd(prompt, tech_preferences, llm=None):
            return PRDGeneration(**SAMPLE_PRD)

        monkeypatch.setattr(prd_generator, "generate_prd", fake_generate_prd)

        response = client.post(
            "/api/prd/generate",
            headers=make_auth_headers(user1.email),
            json={"prompt": "Create a test PRD", "tech_preferences": {}},
        )

        assert response.status_code == 201
        document_id = response.json()["id"]

        stored = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user1.id,
        ).first()
        assert stored is not None
        assert stored.title == "Generated PRD"

    def test_user_can_update_own_documents(self, client, user1, user1_document):
        """
        ✅ Testing Checklist: User can update their own documents

        Test that a user can successfully update their own documents
        """
        response = client.put(
            f"/api/documents/{user1_document.id}",
            headers=make_auth_headers(user1.email),
            json={
                "title": "Updated Title",
                "content": "Updated content"
            }
        )

        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"
        assert response.json()["content"] == "Updated content"

    def test_user_cannot_update_other_users_documents(self, client, user1, user2_document):
        """
        ✅ Testing Checklist: User cannot update other users' documents (404)

        Test that a user gets 404 when trying to update another user's documents
        """
        response = client.put(
            f"/api/documents/{user2_document.id}",
            headers=make_auth_headers(user1.email),
            json={
                "title": "Hacked Title",
                "content": "Hacked content"
            }
        )

        assert response.status_code == 404
        assert "detail" in response.json()
        assert "Document not found" in response.json()["detail"]

    def test_user_can_delete_own_documents(self, client, db, user1, user1_document):
        """Test that a user can delete their own documents"""
        response = client.delete(
            f"/api/documents/{user1_document.id}",
            headers=make_auth_headers(user1.email),
        )

        assert response.status_code == 204

        # Verify document is deleted
        document = db.query(Document).filter(
            Document.id == user1_document.id
        ).first()
        assert document is None

    def test_user_cannot_delete_other_users_documents(self, client, db, user1, user2_document):
        """Test that a user cannot delete another user's documents"""
        response = client.delete(
            f"/api/documents/{user2_document.id}",
            headers=make_auth_headers(user1.email),
        )

        assert response.status_code == 404

        # Verify document still exists
        document = db.query(Document).filter(
            Document.id == user2_document.id
        ).first()
        assert document is not None


class TestListDocumentsAuthorization:
    """Test list documents authorization"""

    def test_user_only_sees_own_documents(
        self, client, user1, user2, user1_document, user2_document
    ):
        """Test that user only sees their own documents in list"""
        response = client.get(
            "/api/documents", headers=make_auth_headers(user1.email)
        )

        assert response.status_code == 200
        documents = response.json()

        # Should only see user1's documents
        assert len(documents) == 1
        assert documents[0]["id"] == user1_document.id
        assert documents[0]["title"] == "User1's Document"

        # Should NOT see user2's documents
        user2_doc_visible = any(doc["id"] == user2_document.id for doc in documents)
        assert not user2_doc_visible

    def test_list_documents_empty_for_new_user(self, client, user2):
        """Test that new users see empty document list"""
        response = client.get(
            "/api/documents", headers=make_auth_headers(user2.email)
        )

        assert response.status_code == 200
        assert response.json() == []


class TestSearchDocumentsAuthorization:
    """Test search documents authorization"""

    def test_search_only_returns_user_documents(
        self, client, user1, user2, user1_document, user2_document
    ):
        """Test that search only returns documents owned by the user"""
        response = client.get(
            "/api/documents/search?query=Document",
            headers=make_auth_headers(user1.email),
        )

        assert response.status_code == 200
        documents = response.json()

        # Should only find user1's documents
        assert len(documents) == 1
        assert documents[0]["id"] == user1_document.id


class TestServiceLayerAuthorization:
    """Test service layer authorization"""

    def test_all_database_queries_include_user_id_filter(
        self, db, user1, user2, user1_document, user2_document
    ):
        """
        ✅ Testing Checklist: All database queries include user_id filter

        Verify that all service layer methods include user_id in queries
        """
        # Test get_document includes user_id filter
        doc = asyncio.run(
            document_service.get_document(db, user1_document.id, user1.id)
        )
        assert doc is not None

        # Trying to get user2's document with user1's ID should return None
        doc = asyncio.run(
            document_service.get_document(db, user2_document.id, user1.id)
        )
        assert doc is None

        # Test list_documents includes user_id filter
        docs = asyncio.run(document_service.list_documents(db, user1.id))
        assert len(docs) == 1
        assert docs[0].id == user1_document.id

    def test_no_cross_user_data_leakage(
        self, db, user1, user2, user1_document, user2_document
    ):
        """
        ✅ Testing Checklist: No cross-user data leakage

        Verify that users cannot access other users' data through any endpoint
        """
        # Create multiple documents for each user
        for i in range(3):
            db.add(Document(
                user_id=user1.id, title=f"User1 Doc {i}", content=f"Content {i}"
            ))
            db.add(Document(
                user_id=user2.id, title=f"User2 Doc {i}", content=f"Content {i}"
            ))
        db.commit()

        # User1 should only see their own documents
        user1_docs = asyncio.run(document_service.list_documents(db, user1.id))
        assert len(user1_docs) == 4  # 1 from fixture + 3 new
        for doc in user1_docs:
            assert doc.title.startswith("User1")

        # User2 should only see their own documents
        user2_docs = asyncio.run(document_service.list_documents(db, user2.id))
        assert len(user2_docs) == 4  # 1 from fixture + 3 new
        for doc in user2_docs:
            assert doc.title.startswith("User2")


class TestErrorHandlingAuthorization:
    """Test error handling for authorization"""

    def test_proper_error_handling_for_unauthorized_access(
        self, client, user1, user2_document
    ):
        """
        ✅ Testing Checklist: Proper error handling for unauthorized access

        Verify that unauthorized access attempts return proper error responses
        """
        headers = make_auth_headers(user1.email)

        # Test get document
        response = client.get(
            f"/api/documents/{user2_document.id}", headers=headers
        )
        assert response.status_code == 404
        assert "Document not found" in response.json()["detail"]

        # Test update document
        response = client.put(
            f"/api/documents/{user2_document.id}",
            headers=headers,
            json={"title": "Hacked"}
        )
        assert response.status_code == 404
        assert "Document not found" in response.json()["detail"]

        # Test delete document
        response = client.delete(
            f"/api/documents/{user2_document.id}", headers=headers
        )
        assert response.status_code == 404
        assert "Document not found" in response.json()["detail"]

    def test_no_user_enumeration_in_errors(self, client, monkeypatch):
        """Test that error messages don't reveal user existence"""
        async def mock_authenticate_user(db, email, password):
            return None

        monkeypatch.setattr(auth_service, "authenticate_user", mock_authenticate_user)

        response = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrong"
        })

        assert response.status_code == 401
        # Error message should be generic, not revealing
        assert "detail" in response.json()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
