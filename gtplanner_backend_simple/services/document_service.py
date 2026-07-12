"""
Document service for PRD management
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.document import Document
from ..models.schemas import PRDUpdate, PRDResponse, PRDListResponse
import json


class DocumentService:
    """Service for PRD document operations"""

    async def create_document(
        self,
        db: Session,
        user_id: int,
        title: str,
        content: str,
        tech_stack: dict = None,
        recommendations: dict = None
    ) -> PRDResponse:
        """Create a new PRD document"""
        db_document = Document(
            user_id=user_id,
            title=title,
            content=content,
            tech_stack=tech_stack,
            recommendations=recommendations
        )

        db.add(db_document)
        db.commit()
        db.refresh(db_document)

        return PRDResponse.model_validate(db_document)

    async def get_document(self, db: Session, document_id: int, user_id: int) -> Optional[PRDResponse]:
        """Get a specific document by ID"""
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()

        if not document:
            return None

        return PRDResponse.model_validate(document)

    async def list_documents(
        self,
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[PRDListResponse]:
        """List all documents for a user"""
        documents = db.query(Document).filter(
            Document.user_id == user_id
        ).order_by(Document.updated_at.desc()).offset(skip).limit(limit).all()

        return [
            PRDListResponse(
                id=doc.id,
                title=doc.title,
                summary=doc.content[:200] + "..." if len(doc.content) > 200 else doc.content,
                created_at=doc.created_at,
                updated_at=doc.updated_at
            )
            for doc in documents
        ]

    async def update_document(
        self,
        db: Session,
        document_id: int,
        user_id: int,
        update_data: PRDUpdate
    ) -> Optional[PRDResponse]:
        """Update a document"""
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()

        if not document:
            return None

        # Update fields if provided
        if update_data.title is not None:
            document.title = update_data.title
        if update_data.content is not None:
            document.content = update_data.content
        if update_data.tech_stack is not None:
            document.tech_stack = update_data.tech_stack
        if update_data.recommendations is not None:
            document.recommendations = update_data.recommendations

        document.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(document)

        return PRDResponse.model_validate(document)

    async def delete_document(self, db: Session, document_id: int, user_id: int) -> bool:
        """Delete a document"""
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()

        if not document:
            return False

        db.delete(document)
        db.commit()

        return True

    async def search_documents(
        self,
        db: Session,
        user_id: int,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[PRDListResponse]:
        """Search documents by title or content"""
        documents = db.query(Document).filter(
            Document.user_id == user_id,
            (Document.title.ilike(f"%{query}%") | Document.content.ilike(f"%{query}%"))
        ).order_by(Document.updated_at.desc()).offset(skip).limit(limit).all()

        return [
            PRDListResponse(
                id=doc.id,
                title=doc.title,
                summary=doc.content[:200] + "..." if len(doc.content) > 200 else doc.content,
                created_at=doc.created_at,
                updated_at=doc.updated_at
            )
            for doc in documents
        ]


# Global instance
document_service = DocumentService()
