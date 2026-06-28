"""
Database connection and utilities for GTPlanner Web Interface
"""

import os
from typing import Generator
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.orm import sessionmaker


def get_database_url() -> str:
    """Get database URL from environment or config"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        # Fallback to SQLite for development if no PostgreSQL configured
        database_url = "sqlite:///./gtplanner_web.db"
        print("⚠️  No DATABASE_URL set, using SQLite for development")
    return database_url


# Create database engine
engine = create_engine(get_database_url(), echo=True)


def get_session() -> Generator[Session, None, None]:
    """
    Dependency function to get database session
    Usage in FastAPI:
        db: Session = Depends(get_session)
    """
    with Session(engine) as session:
        yield session


def init_database():
    """Initialize database tables"""
    from gtplanner.web.models import (
        User, Session, Workspace, WorkspaceMember,
        PRD, PRDVersion, ActivityLog
    )

    SQLModel.metadata.create_all(engine)
    print("Database tables created successfully")


def drop_database():
    """Drop all database tables (use with caution!)"""
    SQLModel.metadata.drop_all(engine)
    print("Database tables dropped")


def reset_database():
    """Reset database (drop and recreate)"""
    drop_database()
    init_database()
    print("Database reset completed")