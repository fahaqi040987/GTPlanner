"""
Document model for PRDs
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Document(Base, TimestampMixin):
    """Document model for storing PRDs"""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    tech_stack = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="documents")
    sessions = relationship("Session", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, title={self.title}, user_id={self.user_id})>"
