"""
LLM configuration API tests (PRD v2.2.0, implementation step 2)

Covers:
- Admin-only access to preset management (401/403)
- Preset CRUD with masked keys and encrypted storage
- Activation switching (exactly one active preset)
- Personal BYO-key override (upsert, masked, delete)
- Resolution order: explicit choice -> active preset -> error
"""
import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from gtplanner_backend_simple.main import app
from gtplanner_backend_simple.core.config import settings
from gtplanner_backend_simple.core.database import get_db
from gtplanner_backend_simple.core.encryption import secret_encryption
from gtplanner_backend_simple.models.base import Base
from gtplanner_backend_simple.models.llm_config import LLMPreset, UserLLMConfig
from gtplanner_backend_simple.models.schemas import (
    LLMPresetCreate,
    LLMTestResult,
    UserLLMConfigData,
)
from gtplanner_backend_simple.models.user import User
from gtplanner_backend_simple.services.llm_config_service import (
    LLMConfigError,
    LLMConfigService,
    llm_config_service,
)

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_llm_config.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

PRESET_URL = "/api/admin/llm/presets"
PRESET_PAYLOAD = {
    "name": "Strong",
    "base_url": "https://api.example.com/v1",
    "api_key": "sk-test-secret-key-123456",
    "model": "test-model",
}

CONFIG_PAYLOAD = {
    "base_url": "https://personal.example.com/v1",
    "api_key": "sk-personal-key-abcdef",
    "model": "personal-model",
}


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
    """Fresh database before each test"""
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
def admin_user(db):
    user = User(email="admin@example.com", password_hash="x", role="admin")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def member_user(db):
    user = User(email="member@example.com", password_hash="x", role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_headers(user_email):
    token = jwt.encode(
        {"sub": user_email},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return {"Authorization": f"Bearer {token}"}


class TestAdminOnlyAccess:
    """Preset management requires the admin role"""

    def test_unauthenticated_gets_401(self, db):
        response = client.get(PRESET_URL)
        assert response.status_code == 401

    def test_regular_user_gets_403(self, db, member_user):
        response = client.get(PRESET_URL, headers=auth_headers(member_user.email))
        assert response.status_code == 403
        assert response.json()["detail"] == "Admin privileges required"

    def test_admin_can_list(self, db, admin_user):
        response = client.get(PRESET_URL, headers=auth_headers(admin_user.email))
        assert response.status_code == 200
        assert response.json() == []

    def test_regular_user_sees_public_preset_list(self, db, member_user):
        """Wizard picker: names/models only — no URLs, no keys"""
        llm_config_service.create_preset(db, LLMPresetCreate(**PRESET_PAYLOAD))

        response = client.get(
            "/api/llm/presets", headers=auth_headers(member_user.email)
        )

        assert response.status_code == 200
        presets = response.json()
        assert len(presets) == 1
        preset = presets[0]
        assert set(preset.keys()) == {"id", "name", "model", "is_active"}
        assert preset["name"] == "Strong"
        assert preset["is_active"] is True
        assert "base_url" not in preset
        assert "api_key_masked" not in preset


class TestPresetCRUD:
    """Create/update/delete presets with masked, encrypted keys"""

    def test_create_preset_masks_key_and_encrypts_at_rest(self, db, admin_user):
        response = client.post(
            PRESET_URL,
            json=PRESET_PAYLOAD,
            headers=auth_headers(admin_user.email)
        )

        assert response.status_code == 201
        body = response.json()
        # Masked, never the full key
        assert body["api_key_masked"] == "sk-t****3456"
        assert PRESET_PAYLOAD["api_key"] not in body.values()

        # Encrypted at rest, decryptable with the app key
        stored = db.query(LLMPreset).filter_by(id=body["id"]).first()
        assert stored.api_key_encrypted != PRESET_PAYLOAD["api_key"]
        assert secret_encryption.decrypt(stored.api_key_encrypted) == PRESET_PAYLOAD["api_key"]

        # First preset becomes active automatically
        assert body["is_active"] is True

    def test_duplicate_preset_name_rejected(self, db, admin_user):
        headers = auth_headers(admin_user.email)
        client.post(PRESET_URL, json=PRESET_PAYLOAD, headers=headers)
        response = client.post(
            PRESET_URL,
            json={**PRESET_PAYLOAD, "model": "other-model"},
            headers=headers
        )

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_update_preset_reencrypts_new_key(self, db, admin_user):
        headers = auth_headers(admin_user.email)
        created = client.post(PRESET_URL, json=PRESET_PAYLOAD, headers=headers).json()

        response = client.put(
            f"{PRESET_URL}/{created['id']}",
            json={"api_key": "sk-brand-new-key-9999", "model": "better-model"},
            headers=headers
        )

        assert response.status_code == 200
        assert response.json()["model"] == "better-model"
        assert response.json()["api_key_masked"] == "sk-b****9999"

    def test_delete_preset(self, db, admin_user):
        headers = auth_headers(admin_user.email)
        created = client.post(PRESET_URL, json=PRESET_PAYLOAD, headers=headers).json()

        response = client.delete(f"{PRESET_URL}/{created['id']}", headers=headers)
        assert response.status_code == 204
        assert client.get(PRESET_URL, headers=headers).json() == []

    def test_delete_missing_preset_404(self, db, admin_user):
        response = client.delete(f"{PRESET_URL}/999", headers=auth_headers(admin_user.email))
        assert response.status_code == 404


class TestActivation:
    """Exactly one active preset (the platform default)"""

    def _create(self, headers, name):
        return client.post(
            PRESET_URL,
            json={**PRESET_PAYLOAD, "name": name},
            headers=headers
        ).json()

    def test_activate_switches_active_preset(self, db, admin_user):
        headers = auth_headers(admin_user.email)
        first = self._create(headers, "Fast")      # active (first created)
        second = self._create(headers, "Strong")   # inactive
        assert first["is_active"] is True
        assert second["is_active"] is False

        response = client.post(
            f"{PRESET_URL}/{second['id']}/activate", headers=headers
        )

        assert response.status_code == 200
        assert response.json()["is_active"] is True
        listing = client.get(PRESET_URL, headers=headers).json()
        by_id = {p["id"]: p["is_active"] for p in listing}
        assert by_id[first["id"]] is False
        assert by_id[second["id"]] is True


class TestPersonalOverride:
    """User's own BYO-key config under /api/me/llm-config"""

    def test_requires_authentication(self, db):
        assert client.get("/api/me/llm-config").status_code == 401
        assert client.put(
            "/api/me/llm-config", json=CONFIG_PAYLOAD
        ).status_code == 401

    def test_get_before_config_returns_404(self, db, member_user):
        response = client.get(
            "/api/me/llm-config", headers=auth_headers(member_user.email)
        )
        assert response.status_code == 404

    def test_upsert_and_get_masks_key(self, db, member_user):
        headers = auth_headers(member_user.email)

        put_response = client.put(
            "/api/me/llm-config", json=CONFIG_PAYLOAD, headers=headers
        )
        assert put_response.status_code == 200
        assert put_response.json()["api_key_masked"] == "sk-p****cdef"
        assert CONFIG_PAYLOAD["api_key"] not in put_response.json().values()

        get_response = client.get("/api/me/llm-config", headers=headers)
        assert get_response.status_code == 200
        assert get_response.json()["base_url"] == CONFIG_PAYLOAD["base_url"]

    def test_upsert_replaces_existing(self, db, member_user):
        headers = auth_headers(member_user.email)
        client.put("/api/me/llm-config", json=CONFIG_PAYLOAD, headers=headers)

        updated = {**CONFIG_PAYLOAD, "model": "upgraded-model"}
        response = client.put("/api/me/llm-config", json=updated, headers=headers)

        assert response.status_code == 200
        assert response.json()["model"] == "upgraded-model"
        # Still a single row for this user
        count = (
            db.query(UserLLMConfig)
            .filter_by(user_id=member_user.id)
            .count()
        )
        assert count == 1

    def test_delete_override(self, db, member_user):
        headers = auth_headers(member_user.email)
        client.put("/api/me/llm-config", json=CONFIG_PAYLOAD, headers=headers)

        response = client.delete("/api/me/llm-config", headers=headers)
        assert response.status_code == 204
        assert client.get(
            "/api/me/llm-config", headers=headers
        ).status_code == 404


class TestResolutionOrder:
    """PRD v2.2.0: explicit choice -> active preset -> actionable error"""

    def test_resolves_active_preset_by_default(self, db, member_user):
        preset = llm_config_service.create_preset(
            db, LLMPresetCreate(**PRESET_PAYLOAD)
        )

        base_url, api_key, model = llm_config_service.resolve_llm_config(
            db, member_user
        )

        assert (base_url, api_key, model) == (
            preset.base_url, PRESET_PAYLOAD["api_key"], preset.model
        )

    def test_explicit_preset_choice_wins(self, db, member_user):
        llm_config_service.create_preset(db, LLMPresetCreate(**PRESET_PAYLOAD))
        other = llm_config_service.create_preset(db, LLMPresetCreate(
            **{**PRESET_PAYLOAD, "name": "Other", "model": "other-model"}
        ))

        _, _, model = llm_config_service.resolve_llm_config(
            db, member_user, preset_id=other.id
        )

        assert model == "other-model"

    def test_personal_choice_when_selected(self, db, member_user):
        llm_config_service.upsert_user_config(
            db, member_user.id, UserLLMConfigData(**CONFIG_PAYLOAD)
        )

        base_url, api_key, model = llm_config_service.resolve_llm_config(
            db, member_user, use_personal=True
        )

        assert (base_url, api_key, model) == (
            CONFIG_PAYLOAD["base_url"],
            CONFIG_PAYLOAD["api_key"],
            CONFIG_PAYLOAD["model"],
        )

    def test_personal_selected_but_not_configured(self, db, member_user):
        with pytest.raises(LLMConfigError, match="No personal LLM configured"):
            llm_config_service.resolve_llm_config(db, member_user, use_personal=True)

    def test_nothing_configured_gives_actionable_error(self, db, member_user):
        with pytest.raises(LLMConfigError, match="No LLM configured yet"):
            llm_config_service.resolve_llm_config(db, member_user)


class TestConnectionTestEndpoint:
    """POST /api/llm/test (and preset test) use the live-call helper"""

    def test_test_endpoint_reports_failure_without_network(self, db, member_user):
        # Point at an unroutable local port: fails fast, no external network
        response = client.post(
            "/api/llm/test",
            json={
                "base_url": "http://127.0.0.1:9/v1",
                "api_key": "sk-whatever",
                "model": "any-model",
            },
            headers=auth_headers(member_user.email)
        )

        assert response.status_code == 200
        assert response.json()["success"] is False
        assert "Connection failed" in response.json()["message"]

    def test_preset_test_uses_stored_key(self, db, admin_user, monkeypatch):
        headers = auth_headers(admin_user.email)
        created = client.post(
            PRESET_URL, json=PRESET_PAYLOAD, headers=headers
        ).json()

        calls = {}

        def fake_test_connection(self, base_url, api_key, model):
            calls.update(base_url=base_url, api_key=api_key, model=model)
            return LLMTestResult(success=True, message="ok", model=model)

        monkeypatch.setattr(LLMConfigService, "test_connection", fake_test_connection)

        response = client.post(
            f"{PRESET_URL}/{created['id']}/test", headers=headers
        )

        assert response.status_code == 200
        assert response.json()["success"] is True
        # The stored plaintext key was decrypted and used, never exposed
        assert calls["api_key"] == PRESET_PAYLOAD["api_key"]
        assert calls["model"] == PRESET_PAYLOAD["model"]
