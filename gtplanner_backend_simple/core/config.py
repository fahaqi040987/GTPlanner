"""
Core configuration for simplified GTPlanner backend
"""

import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Anchor env-file lookup to this file's path instead of the current working
# directory, so the backend finds its configuration no matter where it is
# launched from (repo root, IDE, container workdir).
BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent

# docker-compose and the Makefile expect .env.dev at the repo root.
# pydantic-settings reads every existing file in order; later entries win,
# so .env.dev is the override and the shared .env is the fallback.
_DEFAULT_ENV_FILES = (
    BACKEND_DIR / ".env",
    REPO_ROOT / ".env",
    BACKEND_DIR / ".env.dev",
    REPO_ROOT / ".env.dev",
)
_SIMPLE_ENV_FILES = (
    BACKEND_DIR / ".env.dev",
    REPO_ROOT / ".env.dev",
)


def _env_file_candidates() -> tuple[Path, ...]:
    """Env files to consult, selected by GTPLANNER_ENV."""
    if os.getenv("GTPLANNER_ENV", "") == "simple":
        return _SIMPLE_ENV_FILES
    return _DEFAULT_ENV_FILES


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "GTPlanner"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://gtplanner:gtplanner_dev_pass@localhost:5432/gtplanner_db"

    # OpenAI
    # Required at runtime; a default keeps Settings() constructible (and the
    # type checker happy) while get_settings() reports a missing key with an
    # actionable message instead of a bare ValidationError.
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4"

    # Authentication
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Field-level encryption for stored LLM API keys (Fernet key material).
    # If unset, a key is derived from SECRET_KEY (fine for dev; set a
    # dedicated ENCRYPTION_KEY in production — see docs/PRD.md v2.2.0)
    ENCRYPTION_KEY: str | None = None

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:8080"]

    model_config = SettingsConfigDict(
        env_file=_env_file_candidates(),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  # Ignore extra fields from main GTPlanner's .env
    )


def get_settings() -> Settings:
    """Get settings, failing fast with an actionable message when unconfigured"""
    settings = Settings()
    if not settings.OPENAI_API_KEY:
        searched = "\n  - ".join(str(path) for path in _env_file_candidates())
        raise RuntimeError(
            "OPENAI_API_KEY is not configured.\n"
            "Create one of the following env files (or export OPENAI_API_KEY):\n"
            f"  - {searched}\n"
            "Set GTPLANNER_ENV=simple to load only .env.dev."
        )
    return settings


settings = get_settings()
