"""
Document (PRD) routes: list, search, read, update, delete
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.schemas import PRDListResponse, PRDResponse, PRDUpdate
from ..models.user import User
from ..services.document_service import DocumentService
from .deps import get_current_user, provide_document_service

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=list[PRDListResponse])
async def list_documents(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    document_service: DocumentService = Depends(provide_document_service),
) -> list[PRDListResponse]:
    """The authenticated user's documents, newest update first"""
    return await document_service.list_documents(
        db, current_user.id, skip=skip, limit=limit
    )


@router.get("/search", response_model=list[PRDListResponse])
async def search_documents(
    query: str,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    document_service: DocumentService = Depends(provide_document_service),
) -> list[PRDListResponse]:
    """Search the authenticated user's documents by title or content"""
    return await document_service.search_documents(
        db, current_user.id, query, skip=skip, limit=limit
    )


@router.get("/{document_id}", response_model=PRDResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    document_service: DocumentService = Depends(provide_document_service),
) -> PRDResponse:
    """Fetch one of the user's documents (others' documents look like 404s)"""
    document = await document_service.get_document(
        db, document_id, current_user.id
    )
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )
    return document


@router.put("/{document_id}", response_model=PRDResponse)
async def update_document(
    document_id: int,
    payload: PRDUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    document_service: DocumentService = Depends(provide_document_service),
) -> PRDResponse:
    """Update one of the user's documents"""
    document = await document_service.update_document(
        db, document_id, current_user.id, payload
    )
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    document_service: DocumentService = Depends(provide_document_service),
) -> None:
    """Delete one of the user's documents"""
    deleted = await document_service.delete_document(
        db, document_id, current_user.id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )
