"""
Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from .config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for getting database sessions
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database tables
    """
    from ..models import user, document, session, llm_config  # noqa: F401
    from ..models.base import Base

    Base.metadata.create_all(bind=engine)
    _ensure_user_role_column()


def _ensure_user_role_column() -> None:
    """
    Bootstrap migration for databases created before roles existed (PRD v2.2.0).

    - Adds users.role if the column is missing.
    - Promotes the lowest-id user to admin when no admin exists yet, so
      deployments that predate roles keep an administrator.

    Idempotent: safe to run on every startup.
    """
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    columns = [column["name"] for column in inspector.get_columns("users")]

    if "role" not in columns:
        with engine.begin() as connection:
            connection.execute(text(
                "ALTER TABLE users ADD COLUMN role VARCHAR(20) "
                "NOT NULL DEFAULT 'user'"
            ))
            connection.execute(text(
                "UPDATE users SET role = 'admin' "
                "WHERE id = (SELECT MIN(id) FROM users)"
            ))
