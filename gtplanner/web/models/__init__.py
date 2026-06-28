"""
Database models for GTPlanner Web Interface
Uses SQLModel (Pydantic + SQLAlchemy) for type-safe database operations
"""

from typing import Optional, List
from datetime import datetime, timedelta
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from enum import Enum


class UserRole(str, Enum):
    """User roles for system-wide access control"""
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class WorkspaceRole(str, Enum):
    """User roles within a workspace"""
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class PRDStatus(str, Enum):
    """PRD document status"""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class User(SQLModel, table=True):
    """User accounts with authentication and system-wide roles"""
    __tablename__ = "users"

    id: Optional[str] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    name: str = Field(max_length=255)
    password_hash: str = Field(max_length=255)
    role: UserRole = Field(default=UserRole.VIEWER)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    sessions: List["Session"] = Relationship(sa_relationship_kwargs={"back_populates": "user"})
    owned_workspaces: List["Workspace"] = Relationship(back_populates="owner")
    workspace_memberships: List["WorkspaceMember"] = Relationship(back_populates="user")
    created_prds: List["PRD"] = Relationship(
        back_populates="created_by_user",
        sa_relationship_kwargs={"foreign_keys": "[PRD.created_by]"}
    )
    updated_prds: List["PRD"] = Relationship(
        back_populates="updated_by_user",
        sa_relationship_kwargs={"foreign_keys": "[PRD.updated_by]"}
    )
    activity_logs: List["ActivityLog"] = Relationship(sa_relationship_kwargs={"back_populates": "user"})


class Session(SQLModel, table=True):
    """User sessions for JWT token management"""
    __tablename__ = "sessions"

    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id")
    token: str = Field(unique=True, max_length=255)
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(sa_relationship_kwargs={"back_populates": "sessions"})


class Workspace(SQLModel, table=True):
    """Workspaces/Projects for organizing PRDs"""
    __tablename__ = "workspaces"

    id: Optional[str] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255)
    description: Optional[str] = Field(default=None)
    owner_id: str = Field(foreign_key="users.id")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    owner: User = Relationship(back_populates="owned_workspaces")
    members: List["WorkspaceMember"] = Relationship(back_populates="workspace")
    prds: List["PRD"] = Relationship(back_populates="workspace")


class WorkspaceMember(SQLModel, table=True):
    """Workspace membership with role-based access control"""
    __tablename__ = "workspace_members"

    id: Optional[str] = Field(default=None, primary_key=True)
    workspace_id: str = Field(foreign_key="workspaces.id")
    user_id: str = Field(foreign_key="users.id")
    role: WorkspaceRole = Field(default=WorkspaceRole.VIEWER)

    joined_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    workspace: Workspace = Relationship(back_populates="members")
    user: User = Relationship(back_populates="workspace_memberships")


class PRD(SQLModel, table=True):
    """Product Requirements Documents with version history"""
    __tablename__ = "prds"

    id: Optional[str] = Field(default=None, primary_key=True)
    workspace_id: str = Field(foreign_key="workspaces.id")
    title: str = Field(max_length=255)
    content: dict = Field(sa_column=Column(JSON))
    version: str = Field(default="1.0", max_length=50)
    status: PRDStatus = Field(default=PRDStatus.DRAFT)

    created_by: str = Field(foreign_key="users.id")
    updated_by: Optional[str] = Field(default=None, foreign_key="users.id")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    workspace: Workspace = Relationship(back_populates="prds")
    created_by_user: User = Relationship(
        back_populates="created_prds",
        sa_relationship_kwargs={"foreign_keys": "[PRD.created_by]"}
    )
    updated_by_user: User = Relationship(
        back_populates="updated_prds",
        sa_relationship_kwargs={"foreign_keys": "[PRD.updated_by]"}
    )
    versions: List["PRDVersion"] = Relationship(back_populates="prd")


class PRDVersion(SQLModel, table=True):
    """PRD version history for rollback and audit trail"""
    __tablename__ = "prd_versions"

    id: Optional[str] = Field(default=None, primary_key=True)
    prd_id: str = Field(foreign_key="prds.id")
    version: str = Field(max_length=50)
    content: dict = Field(sa_column=Column(JSON))
    created_by: str = Field(foreign_key="users.id")
    change_description: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    prd: PRD = Relationship(back_populates="versions")


class ActivityLog(SQLModel, table=True):
    """Activity logging for audit trail and compliance"""
    __tablename__ = "activity_logs"

    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id")
    action: str = Field(max_length=100)  # created, updated, deleted, viewed, etc.
    resource_type: str = Field(max_length=50)  # prd, workspace, user
    resource_id: str = Field(max_length=255)
    details: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(sa_relationship_kwargs={"back_populates": "activity_logs"})