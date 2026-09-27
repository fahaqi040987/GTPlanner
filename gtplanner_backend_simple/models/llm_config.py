"""
LLM configuration models: admin-managed presets and per-user overrides

PRD v2.2.0:
- LLMPreset: named platform-wide LLM configuration; exactly one is active
  (the platform default)
- UserLLMConfig: optional personal BYO-key override, one per user
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class LLMPreset(Base):
    """Admin-managed LLM preset (platform-wide)"""
    __tablename__ = "llm_presets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    base_url: Mapped[str] = mapped_column(String(500))
    # Fernet-encrypted API key — never returned in full by any API
    api_key_encrypted: Mapped[str] = mapped_column(String(1000))
    model: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return (f"<LLMPreset(id={self.id}, name={self.name}, "
                f"model={self.model}, is_active={self.is_active})>")


class UserLLMConfig(Base):
    """Per-user personal LLM override (BYO key)"""
    __tablename__ = "user_llm_configs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True
    )
    base_url: Mapped[str] = mapped_column(String(500))
    api_key_encrypted: Mapped[str] = mapped_column(String(1000))
    model: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = relationship("User", back_populates="llm_config")

    def __repr__(self) -> str:
        return (f"<UserLLMConfig(id={self.id}, user_id={self.user_id}, "
                f"model={self.model})>")
