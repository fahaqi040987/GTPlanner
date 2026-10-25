"""
PRD Project model - matches PRD v1.0.0 spec
"""
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, String, Text, Integer, Boolean, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from .base import Base


class PRDProjectStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    GENERATING = "generating"
    ARCHIVED = "archived"


class PRDProject(Base):
    __tablename__ = "prd_projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    workspace_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("team_workspaces.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=PRDProjectStatus.DRAFT.value
    )
    current_version: Mapped[str] = mapped_column(String(32), nullable=False, default="v1.0.0")
    target_framework: Mapped[str | None] = mapped_column(
        String(64), nullable=True, default="Next.js + FastAPI"
    )
    llm_model_used: Mapped[str | None] = mapped_column(
        String(64), nullable=True, default="claude-3-5-sonnet"
    )
    total_token_usage: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    git_repo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    git_sync_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    git_last_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    doc_metadata: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    workspace = relationship("TeamWorkspace", back_populates="projects")
    creator = relationship("User", foreign_keys=[created_by])
    sections = relationship("PRDSection", back_populates="project", cascade="all, delete-orphan")
    embeddings = relationship("VectorSpecEmbedding", back_populates="project", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_prd_projects_workspace_status", "workspace_id", "status"),
        Index("idx_prd_projects_workspace_slug", "workspace_id", "slug", unique=True),
    )

    def __repr__(self) -> str:
        return f"<PRDProject(id={self.id}, title={self.title}, status={self.status})>"
