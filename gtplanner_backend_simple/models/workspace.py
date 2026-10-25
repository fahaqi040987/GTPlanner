"""
Team workspace model
"""
from datetime import datetime, timezone
from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class TeamWorkspace(Base):
    __tablename__ = "team_workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    plan_tier: Mapped[str] = mapped_column(String(32), nullable=False, default="enterprise")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    users = relationship("User", back_populates="workspace")
    projects = relationship("PRDProject", back_populates="workspace", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<TeamWorkspace(id={self.id}, name={self.name}, slug={self.slug})>"
