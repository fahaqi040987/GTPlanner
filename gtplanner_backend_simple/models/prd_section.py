"""
PRD Section model - partitioned sections of a PRD document
"""
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, String, Text, Integer, Boolean, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from .base import Base


class PRDSectionType(str, enum.Enum):
    EXECUTIVE_SUMMARY = "executive_summary"
    USER_STORIES = "user_stories"
    SYSTEM_ARCHITECTURE = "system_architecture"
    DATABASE_ERD = "database_erd"
    SEQUENCE_FLOW = "sequence_flow"
    TECH_STACK = "tech_stack"
    MILESTONES = "milestones"
    SECURITY_COMPLIANCE = "security_compliance"
    CUSTOM_SECTION = "custom_section"


class PRDSection(Base):
    __tablename__ = "prd_sections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("prd_projects.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    section_key: Mapped[str] = mapped_column(String(64), nullable=False)
    section_type: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False, default="")
    content_structured: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_locked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_edited_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    project = relationship("PRDProject", back_populates="sections")
    editor = relationship("User", foreign_keys=[last_edited_by])
    embeddings = relationship("VectorSpecEmbedding", back_populates="section", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_prd_sections_project_order", "project_id", "order_index"),
        Index("idx_prd_sections_project_key", "project_id", "section_key", unique=True),
    )

    def __repr__(self) -> str:
        return f"<PRDSection(id={self.id}, title={self.title}, type={self.section_type})>"
