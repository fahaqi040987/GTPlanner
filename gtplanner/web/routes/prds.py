"""
PRD management routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import uuid4
from datetime import datetime

from gtplanner.web.database import get_session
from gtplanner.web.models import PRD, PRDVersion, User, Workspace
from gtplanner.web.services.prd_service import prd_service
from gtplanner.web.middleware import get_current_user
from gtplanner.web.models import UserRole


router = APIRouter()


# Pydantic models for request/response
class PRDCreate(BaseModel):
    """PRD creation request"""
    title: str = Field(..., min_length=1, max_length=255)
    content: Dict[str, Any] = Field(default_factory=dict)


class PRDUpdate(BaseModel):
    """PRD update request"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[Dict[str, Any]] = None
    status: Optional[str] = Field(None, pattern="^(draft|active|archived)$")
    change_description: Optional[str] = Field(None, max_length=500)


class PRDResponse(BaseModel):
    """PRD response"""
    id: str
    workspace_id: str
    title: str
    content: Dict[str, Any]
    version: str
    status: str
    created_by: str
    updated_by: Optional[str]
    created_at: str
    updated_at: str


class PRDVersionResponse(BaseModel):
    """PRD version response"""
    id: str
    prd_id: str
    version: str
    content: Dict[str, Any]
    created_by: str
    created_at: str
    change_description: Optional[str]


@router.get("/workspaces/{workspace_id}/prds", response_model=List[PRDResponse])
async def list_workspace_prds(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all PRDs in a workspace
    - User must be a member of the workspace
    """
    prds = prd_service.get_workspace_prds(session, workspace_id, current_user.id)

    return [
        PRDResponse(
            id=prd.id,
            workspace_id=prd.workspace_id,
            title=prd.title,
            content=prd.content,
            version=prd.version,
            status=prd.status,
            created_by=prd.created_by,
            updated_by=prd.updated_by,
            created_at=prd.created_at.isoformat(),
            updated_at=prd.updated_at.isoformat()
        )
        for prd in prds
    ]


@router.post("/workspaces/{workspace_id}/prds", response_model=PRDResponse, status_code=status.HTTP_201_CREATED)
async def create_prd(
    workspace_id: str,
    prd_data: PRDCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create a new PRD in workspace
    - User must be admin or member of workspace
    """
    prd = prd_service.create_prd(
        session=session,
        workspace_id=workspace_id,
        title=prd_data.title,
        content=prd_data.content,
        created_by=current_user.id
    )

    return PRDResponse(
        id=prd.id,
        workspace_id=prd.workspace_id,
        title=prd.title,
        content=prd.content,
        version=prd.version,
        status=prd.status,
        created_by=prd.created_by,
        updated_by=prd.updated_by,
        created_at=prd.created_at.isoformat(),
        updated_at=prd.updated_at.isoformat()
    )


@router.get("/{prd_id}", response_model=PRDResponse)
async def get_prd(
    prd_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get PRD details by ID
    - User must be a member of the workspace
    """
    prd = prd_service.get_prd_by_id(session, prd_id, current_user.id)
    if not prd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PRD not found or no access"
        )

    return PRDResponse(
        id=prd.id,
        workspace_id=prd.workspace_id,
        title=prd.title,
        content=prd.content,
        version=prd.version,
        status=prd.status,
        created_by=prd.created_by,
        updated_by=prd.updated_by,
        created_at=prd.created_at.isoformat(),
        updated_at=prd.updated_at.isoformat()
    )


@router.put("/{prd_id}", response_model=PRDResponse)
async def update_prd(
    prd_id: str,
    prd_data: PRDUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update PRD
    - User must be admin or member of workspace
    """
    prd = prd_service.update_prd(
        session=session,
        prd_id=prd_id,
        user_id=current_user.id,
        title=prd_data.title,
        content=prd_data.content,
        status=prd_data.status,
        change_description=prd_data.change_description
    )

    if not prd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PRD not found or no permission to modify"
        )

    return PRDResponse(
        id=prd.id,
        workspace_id=prd.workspace_id,
        title=prd.title,
        content=prd.content,
        version=prd.version,
        status=prd.status,
        created_by=prd.created_by,
        updated_by=prd.updated_by,
        created_at=prd.created_at.isoformat(),
        updated_at=prd.updated_at.isoformat()
    )


@router.delete("/{prd_id}")
async def delete_prd(
    prd_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a PRD
    - User must be admin or member of workspace
    """
    success = prd_service.delete_prd(session, prd_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PRD not found or no permission to delete"
        )

    return {"message": "PRD deleted successfully"}


@router.get("/{prd_id}/versions", response_model=List[PRDVersionResponse])
async def list_prd_versions(
    prd_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get version history of a PRD
    - User must be a member of the workspace
    """
    versions = prd_service.get_prd_versions(session, prd_id, current_user.id)

    return [
        PRDVersionResponse(
            id=version.id,
            prd_id=version.prd_id,
            version=version.version,
            content=version.content,
            created_by=version.created_by,
            created_at=version.created_at.isoformat(),
            change_description=version.change_description
        )
        for version in versions
    ]


@router.post("/{prd_id}/versions/{version_id}/restore", response_model=PRDResponse)
async def restore_prd_version(
    prd_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Restore a PRD to a specific version
    - User must be admin or member of workspace
    """
    prd = prd_service.restore_prd_version(session, prd_id, version_id, current_user.id)
    if not prd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PRD version not found or no permission to restore"
        )

    return PRDResponse(
        id=prd.id,
        workspace_id=prd.workspace_id,
        title=prd.title,
        content=prd.content,
        version=prd.version,
        status=prd.status,
        created_by=prd.created_by,
        updated_by=prd.updated_by,
        created_at=prd.created_at.isoformat(),
        updated_at=prd.updated_at.isoformat()
    )