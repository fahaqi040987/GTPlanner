"""
Shared pytest bootstrap for the backend API test suite.

One in-memory database, one dependency override, jose-based auth helpers.
Test files must NOT create their own engines, overrides, or clients — use
the fixtures from here (client, db, auth headers) so database state and the
app under test stay consistent across files.

OPENAI_API_KEY is defaulted before importing the app because service
singletons construct at import time and config fails fast without it.
"""
import os

os.environ.setdefault("OPENAI_API_KEY", "test-key-not-real")

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from gtplanner_backend_simple.core.config import settings
from gtplanner_backend_simple.core.database import get_db
from gtplanner_backend_simple.main import app
from gtplanner_backend_simple.models.base import Base
from gtplanner_backend_simple.models.user import User

# Shared in-memory database: StaticPool keeps one connection so every
# session (fixture and request handler) sees the same data.
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Fresh tables for every test"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def make_auth_headers(email: str) -> dict:
    """Authorization headers for a user (tokens carry no exp by default)"""
    token = jwt.encode(
        {"sub": email}, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return {"Authorization": f"Bearer {token}"}


def create_user(email: str, role: str = "user") -> User:
    """Insert a user directly into the shared test database"""
    user = User(email=email, password_hash="x", role=role)
    db = TestingSessionLocal()
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()
