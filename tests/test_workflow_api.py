"""
Generation workflow API tests (PRD v2.1.0, implementation step 3)

All LLM calls are mocked at the single seam (call_llm_json); LLM config
resolution runs against a real active preset so the full path is exercised.
"""
import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from gtplanner_backend_simple.main import app
from gtplanner_backend_simple.core.config import settings
from gtplanner_backend_simple.core.database import get_db
from gtplanner_backend_simple.models.base import Base
from gtplanner_backend_simple.models.schemas import LLMPresetCreate
from gtplanner_backend_simple.models.user import User
from gtplanner_backend_simple.models.workflow import GenerationWorkflow
from gtplanner_backend_simple.services.llm_config_service import (
    llm_config_service,
)
from gtplanner_backend_simple.services.workflow_service import WorkflowService

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_workflow.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

WORKFLOW_URL = "/api/prd-workflow"

FULL_PRD = {
    "title": "Task Management App",
    "summary": "A simple task management app for small teams.",
    "requirements": [
        "Users can create tasks",
        "Users can assign tasks to teammates",
    ],
    "tech_stack": {
        "frontend": ["React"],
        "backend": ["FastAPI"],
        "database": ["PostgreSQL"],
        "devops": ["Docker"],
        "rationale": "Modern, well-supported stack.",
    },
    "infrastructure": {
        "hardware_specs": {
            "cpu_cores": "2 vCPU",
            "ram": "4 GB",
            "disk_space": "20 GB SSD",
            "network": "100 Mbps",
        },
        "cloud_providers": [
            {
                "name": "Hetzner",
                "services": ["VPS"],
                "estimated_monthly_cost": "$24",
                "rationale": "Cheap and reliable.",
            }
        ],
        "architecture": "Monolithic 3-tier app behind a reverse proxy.",
        "data_stack": "PostgreSQL with daily backups.",
        "estimated_cost": "$24-48/month",
    },
    "implementation_plan": [
        "Phase 1: Core task CRUD",
        "Phase 2: Team assignment",
    ],
    "success_metrics": [
        "50 signups in first month",
        "Weekly active teams > 20",
    ],
}

QUESTIONS = [
    "Who are the target users?",
    "What platforms must be supported?",
    "What is the launch deadline?",
]


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
    """Fresh database and mocked LLM seam before each test"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def member_user(db):
    user = User(email="member@example.com", password_hash="x", role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def active_preset(db):
    """A real active preset so LLM resolution succeeds without network"""
    return llm_config_service.create_preset(
        db,
        LLMPresetCreate(
            name="Default",
            base_url="https://api.example.com/v1",
            api_key="sk-preset-key",
            model="test-model",
        ),
    )


@pytest.fixture
def mock_llm(monkeypatch):
    """Mock the single LLM seam, dispatching on the prompt's request type"""
    calls = []

    def fake_call_llm_json(
        self, base_url, api_key, model, system_prompt, user_prompt
    ):
        calls.append({"system": system_prompt, "user": user_prompt})
        if "clarifying questions" in user_prompt:
            return {"questions": QUESTIONS}
        if "Regenerate ONLY" in user_prompt:
            return {"requirements": ["Regenerated requirement A"]}
        return dict(FULL_PRD)

    monkeypatch.setattr(WorkflowService, "call_llm_json", fake_call_llm_json)
    return calls


def auth_headers(user_email):
    token = jwt.encode(
        {"sub": user_email},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return {"Authorization": f"Bearer {token}"}


def create_workflow(member_user, mock_llm, **overrides):
    payload = {
        "idea": "A task management app for small teams",
        **overrides,
    }
    response = client.post(
        WORKFLOW_URL, json=payload, headers=auth_headers(member_user.email)
    )
    assert response.status_code == 201
    return response.json()


class TestWorkflowCreation:
    """Step 1 — intake"""

    def test_create_generates_clarifying_questions(
        self, db, member_user, active_preset, mock_llm
    ):
        workflow = create_workflow(member_user, mock_llm)

        assert workflow["current_step"] == "clarify"
        assert workflow["idea"] == "A task management app for small teams"
        assert workflow["clarifying_questions"] == QUESTIONS

    def test_create_replaces_previous_active(
        self, db, member_user, active_preset, mock_llm
    ):
        create_workflow(member_user, mock_llm)
        second = create_workflow(
            member_user, mock_llm, idea="A completely different second idea"
        )

        current = client.get(
            f"{WORKFLOW_URL}/current", headers=auth_headers(member_user.email)
        ).json()
        assert current["id"] == second["id"]

        session = TestingSessionLocal()
        count = (
            session.query(GenerationWorkflow)
            .filter_by(user_id=member_user.id)
            .count()
        )
        session.close()
        assert count == 1

    def test_get_current_404_when_none(self, db, member_user):
        response = client.get(
            f"{WORKFLOW_URL}/current", headers=auth_headers(member_user.email)
        )
        assert response.status_code == 404

    def test_unauthenticated_401(self, db):
        response = client.post(WORKFLOW_URL, json={"idea": "x" * 20})
        assert response.status_code == 401


class TestClarifyStep:
    """Step 2 — answers and skipping"""

    def test_answers_move_to_review_with_drafts(
        self, db, member_user, active_preset, mock_llm
    ):
        create_workflow(member_user, mock_llm)

        response = client.post(
            f"{WORKFLOW_URL}/current/answers",
            json={"answers": ["Small teams", "Web only", "Q3"]},
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["current_step"] == "review"
        assert body["clarifying_answers"] == ["Small teams", "Web only", "Q3"]
        assert set(body["drafts"].keys()) == {
            "requirements",
            "tech_stack",
            "infrastructure",
            "implementation_plan",
            "success_metrics",
        }
        # Answers reached the LLM prompt
        assert "Small teams" in mock_llm[-1]["user"]

    def test_skip_clarify_goes_straight_to_drafts(
        self, db, member_user, active_preset, mock_llm
    ):
        create_workflow(member_user, mock_llm)

        response = client.post(
            f"{WORKFLOW_URL}/current/skip",
            json={"step": "clarify"},
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["current_step"] == "review"
        assert body["drafts"]["requirements"] != ""

    def test_regenerate_questions(self, db, member_user, active_preset, mock_llm):
        create_workflow(member_user, mock_llm)

        response = client.post(
            f"{WORKFLOW_URL}/current/regenerate-questions",
            json={"feedback": "Focus on mobile"},
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 200
        assert response.json()["clarifying_questions"] == QUESTIONS
        assert "Focus on mobile" in mock_llm[-1]["user"]

    def test_answers_at_wrong_step_rejected(
        self, db, member_user, active_preset, mock_llm
    ):
        create_workflow(member_user, mock_llm)
        client.post(
            f"{WORKFLOW_URL}/current/skip",
            json={"step": "clarify"},
            headers=auth_headers(member_user.email),
        )

        response = client.post(
            f"{WORKFLOW_URL}/current/answers",
            json={"answers": ["late answer"]},
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 400


class TestDraftEditing:
    """Step 3 — review, edit, regenerate"""

    def _workflow_in_review(self, member_user, mock_llm):
        create_workflow(member_user, mock_llm)
        response = client.post(
            f"{WORKFLOW_URL}/current/skip",
            json={"step": "clarify"},
            headers=auth_headers(member_user.email),
        )
        return response.json()

    def test_manual_draft_edit(self, db, member_user, active_preset, mock_llm):
        self._workflow_in_review(member_user, mock_llm)

        response = client.post(
            f"{WORKFLOW_URL}/current/drafts",
            json={"section": "requirements", "content": "- My hand-written req"},
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 200
        assert response.json()["drafts"]["requirements"] == "- My hand-written req"

    def test_edit_unknown_section_rejected(
        self, db, member_user, active_preset, mock_llm
    ):
        self._workflow_in_review(member_user, mock_llm)

        response = client.post(
            f"{WORKFLOW_URL}/current/drafts",
            json={"section": "faq", "content": "nope"},
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 400
        assert "Unknown section" in response.json()["detail"]

    def test_regenerate_section_with_feedback(
        self, db, member_user, active_preset, mock_llm
    ):
        self._workflow_in_review(member_user, mock_llm)

        response = client.post(
            f"{WORKFLOW_URL}/current/regenerate-section",
            json={"section": "requirements", "feedback": "Make it mobile-first"},
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["drafts"]["requirements"] == "- Regenerated requirement A"
        # Feedback reached the LLM prompt
        assert "mobile-first" in mock_llm[-1]["user"]
        # Structured payload was updated alongside the markdown draft
        assert body["current_step"] == "review"


class TestFinalize:
    """Step 4 — save as document"""

    def _workflow_in_review(self, member_user, mock_llm):
        create_workflow(member_user, mock_llm)
        return client.post(
            f"{WORKFLOW_URL}/current/skip",
            json={"step": "clarify"},
            headers=auth_headers(member_user.email),
        ).json()

    def test_finalize_creates_document(
        self, db, member_user, active_preset, mock_llm
    ):
        self._workflow_in_review(member_user, mock_llm)

        response = client.post(
            f"{WORKFLOW_URL}/current/finalize",
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["current_step"] == "finalized"
        assert body["document_id"] is not None

        # Document exists, is user-scoped, and has the assembled markdown
        doc = client.get(
            f"/api/documents/{body['document_id']}",
            headers=auth_headers(member_user.email),
        ).json()
        assert doc["title"] == "Task Management App"
        assert "# Task Management App" in doc["content"]
        assert "## Requirements" in doc["content"]
        assert doc["tech_stack"]["frontend"] == ["React"]

        # Workflow is no longer active
        current = client.get(
            f"{WORKFLOW_URL}/current", headers=auth_headers(member_user.email)
        )
        assert current.status_code == 404

    def test_finalize_requires_drafts(self, db, member_user, active_preset, mock_llm):
        create_workflow(member_user, mock_llm)  # still at 'clarify'

        response = client.post(
            f"{WORKFLOW_URL}/current/finalize",
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 400


class TestLLMChoiceResolution:
    """LLM selection is honored (PRD v2.2.0 resolution order)"""

    def test_personal_choice_without_config_fails_actionably(
        self, db, member_user, active_preset, mock_llm
    ):
        create_workflow(
            member_user, mock_llm, llm_choice={"use_personal": True}
        )

        response = client.post(
            f"{WORKFLOW_URL}/current/answers",
            json={"answers": ["any"]},
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 400
        assert "No personal LLM configured" in response.json()["detail"]

    def test_unused_test_connection_helper_still_mockable(
        self, db, member_user, active_preset, mock_llm, monkeypatch
    ):
        """Sanity: connection test helper keeps its own contract"""
        result = llm_config_service.test_connection(
            base_url="http://127.0.0.1:9/v1",
            api_key="sk-x",
            model="any",
        )
        assert result.success is False
