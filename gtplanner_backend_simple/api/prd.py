"""
PRD generation routes: one-shot generate and regenerate
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.schemas import (
    PRDGeneration,
    PRDRequest,
    PRDResponse,
    PRDUpdate,
)
from ..models.user import User
from ..services.document_service import DocumentService
from ..services.prd_generator import PRDGenerator
from .deps import get_current_user, provide_document_service, provide_prd_generator

router = APIRouter(prefix="/api/prd", tags=["prd"])


def _prd_markdown(prd: PRDGeneration) -> str:
    """Assemble the generated PRD as reviewable markdown for storage"""
    lines = [
        f"# {prd.title}",
        "## Summary",
        prd.summary,
        "## Requirements",
        *[f"- {item}" for item in prd.requirements],
        "## Implementation Plan",
        *[
            f"{i + 1}. {step}"
            for i, step in enumerate(prd.implementation_plan)
        ],
        "## Success Metrics",
        *[f"- {item}" for item in prd.success_metrics],
    ]
    return "\n\n".join(lines) + "\n"


@router.post("/generate", response_model=PRDResponse, status_code=status.HTTP_201_CREATED)
async def generate_prd(
    payload: PRDRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    document_service: DocumentService = Depends(provide_document_service),
    prd_generator: PRDGenerator = Depends(provide_prd_generator),
) -> PRDResponse:
    """Generate a PRD from a prompt and save it as the user's document"""
    try:
        prd = await prd_generator.generate_prd(
            payload.prompt, payload.tech_preferences or {}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"PRD generation failed: {exc}",
        ) from exc

    return await document_service.create_document(
        db=db,
        user_id=current_user.id,
        title=prd.title,
        content=_prd_markdown(prd),
        tech_stack=prd.tech_stack.model_dump(),
        recommendations=prd.infrastructure.model_dump(),
    )


@router.post("/regenerate/{document_id}", response_model=PRDResponse)
async def regenerate_prd(
    document_id: int,
    payload: PRDRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    document_service: DocumentService = Depends(provide_document_service),
    prd_generator: PRDGenerator = Depends(provide_prd_generator),
) -> PRDResponse:
    """Regenerate one of the user's documents from a new prompt"""
    document = await document_service.get_document(
        db, document_id, current_user.id
    )
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    try:
        prd = await prd_generator.generate_prd(
            payload.prompt,
            payload.tech_preferences if payload.tech_preferences else (document.tech_stack or {}),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"PRD generation failed: {exc}",
        ) from exc

    updated = await document_service.update_document(
        db,
        document_id,
        current_user.id,
        PRDUpdate(
            title=prd.title,
            content=_prd_markdown(prd),
            tech_stack=prd.tech_stack.model_dump(),
            recommendations=prd.infrastructure.model_dump(),
        ),
    )
    if updated is None:  # unreachable: existence checked above
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )
    return updated
