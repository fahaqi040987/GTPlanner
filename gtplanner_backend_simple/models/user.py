"""
User model for authentication with multi-workspace support
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class User(Base):
    """User model"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("team_workspaces.id", ondelete="CASCADE"),
        nullable=True, index=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pm", server_default="pm", index=True
    )
    is_active: Mapped[bool] = mapped_column(default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    workspace = relationship("TeamWorkspace", back_populates="users")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    llm_config = relationship(
        "UserLLMConfig", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    projects_created = relationship("PRDProject", foreign_keys="PRDProject.created_by", back_populates="creator")

    __table_args__ = (
        Index("idx_users_workspace_active", "workspace_id", "is_active"),
    )

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role}, workspace_id={self.workspace_id})>"
