"""
Vector embedding model for pgvector semantic search
"""
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, String, Text, Integer, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class VectorSpecEmbedding(Base):
    __tablename__ = "vector_spec_embeddings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("prd_projects.id", ondelete="CASCADE"),
        nullable=False
    )
    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("prd_sections.id", ondelete="CASCADE"),
        nullable=False
    )
    section_key: Mapped[str] = mapped_column(String(64), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    content_chunk: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    model_used: Mapped[str] = mapped_column(
        String(64), nullable=False, default="text-embedding-3-small"
    )
    embedding_metadata: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    project = relationship("PRDProject", back_populates="embeddings")
    section = relationship("PRDSection", back_populates="embeddings")

    __table_args__ = (
        Index("idx_embeddings_doc_composite", "project_id", "document_id", "section_key"),
    )

    def __repr__(self) -> str:
        return f"<VectorSpecEmbedding(id={self.id}, section_key={self.section_key}, chunk={self.chunk_index})>"
