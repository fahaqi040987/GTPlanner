"""
Generation workflow model (PRD v2.1.0)

Server-persisted, resumable PRD generation workflow:
intake -> clarify -> drafts -> review -> (finalize)

One active workflow per user; starting a new one replaces the previous
active workflow. Finalization links the produced document.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class GenerationWorkflow(Base):
    """State of a user's guided PRD generation workflow"""
    __tablename__ = "generation_workflows"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Steps: intake -> clarify -> drafts -> review -> finalized
    current_step: Mapped[str] = mapped_column(String(20), default="intake")

    # Step 1 — idea intake
    idea: Mapped[str] = mapped_column(Text)
    tech_preferences: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Per-generation LLM selection (PRD v2.2.0):
    # {"preset_id": int} | {"use_personal": true} | null (active preset)
    llm_choice: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Step 2 — clarifying questions (aligned index-to-index with answers)
    clarifying_questions: Mapped[list | None] = mapped_column(JSON, nullable=True)
    clarifying_answers: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Step 3 — reviewable section drafts (markdown per section)
    drafts: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Visual PRD artifacts (PRD v2.3.0): mermaid sources per diagram key
    # (workflow, architecture, data_model, api_sequence)
    diagrams: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Structured payload kept alongside drafts so sections can be
    # regenerated without re-parsing markdown (PRD v2.1.0)
    structured_prd: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Step 4 — set when the workflow is finalized
    document_id: Mapped[int | None] = mapped_column(
        ForeignKey("documents.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = relationship("User")

    @property
    def is_finalized(self) -> bool:
        return self.document_id is not None

    def __repr__(self) -> str:
        return (f"<GenerationWorkflow(id={self.id}, user_id={self.user_id}, "
                f"step={self.current_step})>")
