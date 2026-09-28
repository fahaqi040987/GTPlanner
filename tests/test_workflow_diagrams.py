"""
Workflow diagram tests (PRD v2.3.0, implementation step 4)

Covers:
- Diagrams generated during the drafts step (validated, fail-soft)
- Finalized documents embed diagrams inline next to related sections
- Per-diagram regenerate (with feedback) and manual edit (validated)
- Invalid mermaid after auto-retry surfaces a 502
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
from gtplanner_backend_simple.services.llm_config_service import (
    llm_config_service,
)
from gtplanner_backend_simple.services.workflow_service import WorkflowService

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_workflow_diagrams.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

WORKFLOW_URL = "/api/prd-workflow"

QUESTIONS = ["Who are the target users?", "What platforms?", "Deadline?"]

FULL_PRD = {
    "title": "Task Management App",
    "summary": "A simple task management app.",
    "requirements": ["Users can create tasks"],
    "tech_stack": {
        "frontend": ["React"], "backend": ["FastAPI"],
        "database": ["PostgreSQL"], "devops": ["Docker"],
        "rationale": "Modern stack.",
    },
    "infrastructure": {
        "hardware_specs": {"cpu_cores": "2", "ram": "4GB", "disk_space": "20GB", "network": "-"},
        "cloud_providers": [],
        "architecture": "3-tier monolith.",
        "data_stack": "PostgreSQL.",
        "estimated_cost": "$24/mo",
    },
    "implementation_plan": ["Phase 1: CRUD"],
    "success_metrics": ["50 signups"],
}

VALID_DIAGRAMS = {
    "workflow": "flowchart TD\n    A[Start] --> B{Task created?}\n    B --> C[Assign]",
    "architecture": "flowchart LR\n    U[User] --> N[Nginx] --> API[FastAPI] --> DB[(PostgreSQL)]",
    "data_model": "erDiagram\n    USER ||--o{ DOCUMENT : owns\n    USER {\n        int id\n        string email\n    }",
    "api_sequence": "sequenceDiagram\n    participant U as User\n    participant API\n    U->>API: POST /tasks\n    API-->>U: 201 Created",
}


def override_get_db():
    try:
        session = TestingSessionLocal()
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
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
    return llm_config_service.create_preset(
        db,
        LLMPresetCreate(
            name="Default",
            base_url="https://api.example.com/v1",
            api_key="sk-preset-key",
            model="test-model",
        ),
    )


def make_llm_fake(invalid_diagrams=False, regen_returns=None):
    """
    Fake for the single LLM seam. Dispatches on the prompt:
    - 'clarifying questions'          -> question list
    - mermaid + 'Regenerate ONLY'     -> regen_returns (or garbage if invalid)
    - mermaid                         -> all four diagrams (garbage if invalid)
    - 'Regenerate ONLY'               -> section JSON
    - otherwise                       -> full PRD
    """
    calls = []

    def fake_call_llm_json(
        self, base_url, api_key, model, system_prompt, user_prompt
    ):
        calls.append(user_prompt)
        if "clarifying questions" in user_prompt:
            return {"questions": QUESTIONS}
        if "mermaid" in user_prompt:
            if invalid_diagrams:
                return {k: "this is definitely not mermaid" for k in VALID_DIAGRAMS}
            if "Regenerate ONLY" in user_prompt and regen_returns is not None:
                return regen_returns
            return dict(VALID_DIAGRAMS)
        if "Regenerate ONLY" in user_prompt:
            return {"requirements": ["Regenerated requirement A"]}
        return dict(FULL_PRD)

    return fake_call_llm_json, calls


@pytest.fixture
def mock_llm(monkeypatch):
    fake, calls = make_llm_fake()
    monkeypatch.setattr(WorkflowService, "call_llm_json", fake)
    return calls


def auth_headers(user_email):
    token = jwt.encode(
        {"sub": user_email},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return {"Authorization": f"Bearer {token}"}


def workflow_in_review(member_user):
    """Create a workflow and skip clarify -> straight to review"""
    response = client.post(
        WORKFLOW_URL,
        json={"idea": "A task management app for small teams"},
        headers=auth_headers(member_user.email),
    )
    assert response.status_code == 201
    response = client.post(
        f"{WORKFLOW_URL}/current/skip",
        json={"step": "clarify"},
        headers=auth_headers(member_user.email),
    )
    assert response.status_code == 200
    return response.json()


class TestDiagramGeneration:
    """Diagrams are produced during the drafts step (PRD v2.3.0)"""

    def test_drafts_step_generates_all_four_diagrams(
        self, db, member_user, active_preset, mock_llm
    ):
        body = workflow_in_review(member_user)

        diagrams = body["diagrams"]
        assert set(diagrams.keys()) == {
            "workflow", "architecture", "data_model", "api_sequence"
        }
        assert diagrams["workflow"].startswith("flowchart")
        assert diagrams["data_model"].startswith("erDiagram")
        assert diagrams["api_sequence"].startswith("sequenceDiagram")

    def test_diagram_failure_is_fail_soft(
        self, db, member_user, active_preset, monkeypatch
    ):
        """Invalid diagrams never break the drafts themselves"""
        fake, calls = make_llm_fake(invalid_diagrams=True)
        monkeypatch.setattr(WorkflowService, "call_llm_json", fake)

        body = workflow_in_review(member_user)

        assert body["current_step"] == "review"
        assert body["drafts"]["requirements"] != ""
        # Diagrams were retried once and then dropped, not fatal
        assert not body["diagrams"]
        mermaid_calls = [c for c in calls if "mermaid" in c]
        assert len(mermaid_calls) == 2  # initial + one retry


class TestFinalizeEmbedding:
    """Diagrams are embedded inline in the final document markdown"""

    def test_finalize_embeds_diagrams_next_to_sections(
        self, db, member_user, active_preset, mock_llm
    ):
        workflow = workflow_in_review(member_user)

        response = client.post(
            f"{WORKFLOW_URL}/current/finalize",
            headers=auth_headers(member_user.email),
        )
        assert response.status_code == 200
        document_id = response.json()["document_id"]

        doc = client.get(
            f"/api/documents/{document_id}",
            headers=auth_headers(member_user.email),
        ).json()
        content = doc["content"]

        assert "```mermaid" in content
        # Lean-inline placement (PRD Open Question #9 assumption)
        assert content.index("## Summary") < content.index("### Workflow")
        assert content.index("## Requirements") < content.index("### API Sequence")
        assert content.index("## Technology Stack") < content.index("### Data Model")
        assert (
            content.index("## Infrastructure Recommendations")
            < content.index("### System Architecture")
        )
        # The workflow object carried the diagrams
        assert workflow["diagrams"]["workflow"].startswith("flowchart")

    def test_finalize_without_diagrams_still_works(
        self, db, member_user, active_preset, monkeypatch
    ):
        fake, _ = make_llm_fake(invalid_diagrams=True)
        monkeypatch.setattr(WorkflowService, "call_llm_json", fake)
        workflow_in_review(member_user)

        response = client.post(
            f"{WORKFLOW_URL}/current/finalize",
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 200
        document_id = response.json()["document_id"]
        doc = client.get(
            f"/api/documents/{document_id}",
            headers=auth_headers(member_user.email),
        ).json()
        assert "```mermaid" not in doc["content"]


class TestDiagramRegenerateAndEdit:
    """Per-diagram regenerate + validated manual edit"""

    def test_regenerate_diagram_with_feedback(
        self, db, member_user, active_preset, monkeypatch
    ):
        fake, calls = make_llm_fake()
        monkeypatch.setattr(WorkflowService, "call_llm_json", fake)
        workflow_in_review(member_user)

        response = client.post(
            f"{WORKFLOW_URL}/current/regenerate-diagram",
            json={
                "diagram": "workflow",
                "feedback": "Simpler flow",
            },
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 200
        # With regen_returns unset the fake returns the standard diagrams,
        # so verify the request shape reached the LLM instead:
        assert "Regenerate ONLY the 'workflow' diagram" in calls[-1]
        assert "Simpler flow" in calls[-1]

    def test_regenerate_diagram_returns_new_source(
        self, db, member_user, active_preset, monkeypatch
    ):
        fake, _ = make_llm_fake(
            regen_returns={"workflow": "flowchart TD\n    X[New] --> Y[Diagram]"}
        )
        monkeypatch.setattr(WorkflowService, "call_llm_json", fake)
        workflow_in_review(member_user)

        response = client.post(
            f"{WORKFLOW_URL}/current/regenerate-diagram",
            json={"diagram": "workflow"},
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 200
        assert response.json()["diagrams"]["workflow"] == (
            "flowchart TD\n    X[New] --> Y[Diagram]"
        )

    def test_regenerate_diagram_invalid_after_retry_502(
        self, db, member_user, active_preset, monkeypatch
    ):
        fake, calls = make_llm_fake(invalid_diagrams=True)
        monkeypatch.setattr(WorkflowService, "call_llm_json", fake)
        workflow_in_review(member_user)

        response = client.post(
            f"{WORKFLOW_URL}/current/regenerate-diagram",
            json={"diagram": "workflow"},
            headers=auth_headers(member_user.email),
        )

        # Invalid after the one auto-retry -> upstream failure
        assert response.status_code == 502
        assert "invalid mermaid" in response.json()["detail"]
        mermaid_regen_calls = [
            c for c in calls
            if "mermaid" in c and "Regenerate ONLY" in c
        ]
        assert len(mermaid_regen_calls) == 2  # exactly one auto-retry

    def test_manual_diagram_update_valid(
        self, db, member_user, active_preset, mock_llm
    ):
        workflow_in_review(member_user)

        response = client.post(
            f"{WORKFLOW_URL}/current/diagrams",
            json={
                "diagram": "architecture",
                "content": "flowchart LR\n    A[Client] --> B[Server]",
            },
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 200
        assert response.json()["diagrams"]["architecture"].startswith("flowchart")

    def test_manual_diagram_update_invalid_rejected(
        self, db, member_user, active_preset, mock_llm
    ):
        workflow_in_review(member_user)

        response = client.post(
            f"{WORKFLOW_URL}/current/diagrams",
            json={"diagram": "architecture", "content": "just some text"},
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 400
        assert "valid mermaid" in response.json()["detail"]

    def test_unknown_diagram_rejected(
        self, db, member_user, active_preset, mock_llm
    ):
        workflow_in_review(member_user)

        response = client.post(
            f"{WORKFLOW_URL}/current/regenerate-diagram",
            json={"diagram": "org_chart"},
            headers=auth_headers(member_user.email),
        )

        assert response.status_code == 400
        assert "Unknown diagram" in response.json()["detail"]
