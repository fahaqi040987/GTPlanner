"""
Generation workflow routes (PRD v2.1.0): the guided, resumable PRD flow
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.schemas import (
    WorkflowAnswersRequest,
    WorkflowCreateRequest,
    WorkflowDiagramRegenerateRequest,
    WorkflowDiagramUpdateRequest,
    WorkflowDraftUpdateRequest,
    WorkflowQuestionsRegenerateRequest,
    WorkflowResponse,
    WorkflowSectionRegenerateRequest,
    WorkflowSkipRequest,
)
from ..models.user import User
from ..models.workflow import GenerationWorkflow
from ..services.workflow_service import (
    WorkflowError,
    WorkflowLLMError,
    WorkflowService,
)
from .deps import get_current_user, provide_workflow_service

router = APIRouter(prefix="/api/prd-workflow", tags=["workflow"])


def _current_workflow(
    db: Session,
    user_id: int,
    workflow_service: WorkflowService,
) -> GenerationWorkflow:
    """The caller's active workflow, or a 404"""
    workflow = workflow_service.get_current_workflow(db, user_id)
    if workflow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active workflow",
        )
    return workflow


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    payload: WorkflowCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workflow_service: WorkflowService = Depends(provide_workflow_service),
) -> WorkflowResponse:
    """Step 1 — intake: start a workflow and generate clarifying questions"""
    try:
        workflow = workflow_service.create_workflow(
            db,
            current_user,
            payload.idea,
            payload.tech_preferences,
            payload.llm_choice.model_dump() if payload.llm_choice else None,
        )
    except WorkflowLLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    except WorkflowError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return workflow_service.to_response(workflow)


@router.get("/current", response_model=WorkflowResponse)
async def get_current_workflow(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workflow_service: WorkflowService = Depends(provide_workflow_service),
) -> WorkflowResponse:
    """The caller's active workflow"""
    workflow = _current_workflow(db, current_user.id, workflow_service)
    return workflow_service.to_response(workflow)


@router.delete("/current", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_workflow(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workflow_service: WorkflowService = Depends(provide_workflow_service),
) -> None:
    """Discard the active workflow"""
    deleted = workflow_service.delete_current_workflow(db, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active workflow",
        )


@router.post("/current/answers", response_model=WorkflowResponse)
async def submit_answers(
    payload: WorkflowAnswersRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workflow_service: WorkflowService = Depends(provide_workflow_service),
) -> WorkflowResponse:
    """Step 2 — store clarifying answers, then generate all section drafts"""
    workflow = _current_workflow(db, current_user.id, workflow_service)
    try:
        workflow = workflow_service.save_answers(
            db, current_user, workflow, payload.answers
        )
    except WorkflowLLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    except WorkflowError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return workflow_service.to_response(workflow)


@router.post("/current/skip", response_model=WorkflowResponse)
async def skip_step(
    payload: WorkflowSkipRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workflow_service: WorkflowService = Depends(provide_workflow_service),
) -> WorkflowResponse:
    """Skip an optional step ('clarify' in the MVP)"""
    workflow = _current_workflow(db, current_user.id, workflow_service)
    try:
        workflow = workflow_service.skip_step(
            db, current_user, workflow, payload.step
        )
    except WorkflowLLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    except WorkflowError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return workflow_service.to_response(workflow)


@router.post("/current/regenerate-questions", response_model=WorkflowResponse)
async def regenerate_questions(
    payload: WorkflowQuestionsRegenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workflow_service: WorkflowService = Depends(provide_workflow_service),
) -> WorkflowResponse:
    """Fresh clarifying questions, optionally guided by feedback"""
    workflow = _current_workflow(db, current_user.id, workflow_service)
    try:
        workflow = workflow_service.regenerate_questions(
            db, current_user, workflow, payload.feedback
        )
    except WorkflowLLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    except WorkflowError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return workflow_service.to_response(workflow)


@router.post("/current/drafts", response_model=WorkflowResponse)
async def update_draft(
    payload: WorkflowDraftUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workflow_service: WorkflowService = Depends(provide_workflow_service),
) -> WorkflowResponse:
    """Manually edit one section draft (no LLM call)"""
    workflow = _current_workflow(db, current_user.id, workflow_service)
    try:
        workflow = workflow_service.update_draft(
            db, workflow, payload.section, payload.content
        )
    except WorkflowLLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    except WorkflowError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return workflow_service.to_response(workflow)


@router.post("/current/regenerate-section", response_model=WorkflowResponse)
async def regenerate_section(
    payload: WorkflowSectionRegenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workflow_service: WorkflowService = Depends(provide_workflow_service),
) -> WorkflowResponse:
    """Regenerate one section draft with optional user feedback"""
    workflow = _current_workflow(db, current_user.id, workflow_service)
    try:
        workflow = workflow_service.regenerate_section(
            db, current_user, workflow, payload.section, payload.feedback
        )
    except WorkflowLLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    except WorkflowError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return workflow_service.to_response(workflow)


@router.post("/current/diagrams", response_model=WorkflowResponse)
async def update_diagram(
    payload: WorkflowDiagramUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workflow_service: WorkflowService = Depends(provide_workflow_service),
) -> WorkflowResponse:
    """Manually edit one mermaid diagram (validated, no LLM call)"""
    workflow = _current_workflow(db, current_user.id, workflow_service)
    try:
        workflow = workflow_service.update_diagram(
            db, workflow, payload.diagram, payload.content
        )
    except WorkflowLLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    except WorkflowError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return workflow_service.to_response(workflow)


@router.post("/current/regenerate-diagram", response_model=WorkflowResponse)
async def regenerate_diagram(
    payload: WorkflowDiagramRegenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workflow_service: WorkflowService = Depends(provide_workflow_service),
) -> WorkflowResponse:
    """Regenerate one mermaid diagram with optional feedback (validated)"""
    workflow = _current_workflow(db, current_user.id, workflow_service)
    try:
        workflow = workflow_service.regenerate_diagram(
            db, current_user, workflow, payload.diagram, payload.feedback
        )
    except WorkflowLLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    except WorkflowError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return workflow_service.to_response(workflow)


@router.post("/current/finalize", response_model=WorkflowResponse)
async def finalize_workflow(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workflow_service: WorkflowService = Depends(provide_workflow_service),
) -> WorkflowResponse:
    """Step 4 — assemble the final markdown and save it as a document"""
    workflow = _current_workflow(db, current_user.id, workflow_service)
    try:
        workflow = await workflow_service.finalize_workflow(
            db, current_user, workflow
        )
    except WorkflowLLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    except WorkflowError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return workflow_service.to_response(workflow)
