"""
Workspace management routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import uuid4

from gtplanner.web.database import get_session
from gtplanner.web.models import (
    Workspace, WorkspaceMember, WorkspaceRole, User
)
from gtplanner.web.services import workspace_service
from gtplanner.web.middleware import get_current_user, require_role
from gtplanner.web.models import UserRole


router = APIRouter()


# Pydantic models for request/response
class WorkspaceCreate(BaseModel):
    """Workspace creation request"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class WorkspaceUpdate(BaseModel):
    """Workspace update request"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class WorkspaceResponse(BaseModel):
    """Workspace response"""
    id: str
    name: str
    description: Optional[str]
    owner_id: str
    created_at: str
    updated_at: str
    member_count: int = 0


class WorkspaceMemberAdd(BaseModel):
    """Add workspace member request"""
    user_id: str
    role: WorkspaceRole = WorkspaceRole.VIEWER


class WorkspaceMemberResponse(BaseModel):
    """Workspace member response"""
    id: str
    user_id: str
    name: str
    email: str
    role: WorkspaceRole
    joined_at: str


@router.get("/", response_model=List[WorkspaceResponse])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all workspaces where current user is a member
    """
    workspaces = workspace_service.get_user_workspaces(session, current_user.id)

    result = []
    for workspace in workspaces:
        # Get member count
        members = session.exec(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace.id)
        ).all()

        result.append(WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            description=workspace.description,
            owner_id=workspace.owner_id,
            created_at=workspace.created_at.isoformat(),
            updated_at=workspace.updated_at.isoformat(),
            member_count=len(members)
        ))

    return result


@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create a new workspace
    - User becomes owner and admin
    - Workspace is created with user as first member
    """
    workspace = workspace_service.create_workspace(
        session=session,
        name=workspace_data.name,
        owner_id=current_user.id,
        description=workspace_data.description
    )

    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        description=workspace.description,
        owner_id=workspace.owner_id,
        created_at=workspace.created_at.isoformat(),
        updated_at=workspace.updated_at.isoformat(),
        member_count=1  # Owner is first member
    )


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get workspace details by ID
    - User must be a member of the workspace
    """
    # Check access
    if not workspace_service.check_workspace_access(session, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this workspace"
        )

    workspace = workspace_service.get_workspace_by_id(session, workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Get member count
    members = session.exec(
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == workspace_id)
    ).all()

    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        description=workspace.description,
        owner_id=workspace.owner_id,
        created_at=workspace.created_at.isoformat(),
        updated_at=workspace.updated_at.isoformat(),
        member_count=len(members)
    )


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    workspace_data: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update workspace details
    - User must be workspace owner or admin
    """
    # Check permissions
    if not workspace_service.can_modify_workspace(session, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this workspace"
        )

    workspace = workspace_service.update_workspace(
        session=session,
        workspace_id=workspace_id,
        name=workspace_data.name,
        description=workspace_data.description
    )

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Get member count
    members = session.exec(
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == workspace_id)
    ).all()

    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        description=workspace.description,
        owner_id=workspace.owner_id,
        created_at=workspace.created_at.isoformat(),
        updated_at=workspace.updated_at.isoformat(),
        member_count=len(members)
    )


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a workspace
    - Only workspace owner can delete
    - Cascades to members and PRDs
    """
    workspace = workspace_service.get_workspace_by_id(session, workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Only owner can delete
    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owner can delete the workspace"
        )

    success = workspace_service.delete_workspace(session, workspace_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete workspace"
        )

    return {"message": "Workspace deleted successfully"}


@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberResponse])
async def list_workspace_members(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all members of a workspace
    - User must be a member of the workspace
    """
    # Check access
    if not workspace_service.check_workspace_access(session, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this workspace"
        )

    members = workspace_service.get_workspace_members(session, workspace_id)
    return members


@router.post("/{workspace_id}/members", response_model=WorkspaceMemberResponse)
async def add_workspace_member(
    workspace_id: str,
    member_data: WorkspaceMemberAdd,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Add a member to workspace
    - User must be workspace owner or admin
    - User to add must exist in the system
    """
    # Check permissions
    if not workspace_service.can_modify_workspace(session, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to add members to this workspace"
        )

    # Check if user to add exists
    user_to_add = session.get(User, member_data.user_id)
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Add member
    member = workspace_service.add_workspace_member(
        session=session,
        workspace_id=workspace_id,
        user_id=member_data.user_id,
        role=member_data.role
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this workspace"
        )

    return WorkspaceMemberResponse(
        id=member.id,
        user_id=member.user_id,
        name=user_to_add.name,
        email=user_to_add.email,
        role=member.role,
        joined_at=member.joined_at.isoformat()
    )


@router.delete("/{workspace_id}/members/{user_id}")
async def remove_workspace_member(
    workspace_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Remove a member from workspace
    - User must be workspace owner or admin
    - Cannot remove the workspace owner
    """
    # Check permissions
    if not workspace_service.can_modify_workspace(session, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to remove members from this workspace"
        )

    workspace = workspace_service.get_workspace_by_id(session, workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Cannot remove owner
    if workspace.owner_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove workspace owner"
        )

    success = workspace_service.remove_workspace_member(session, workspace_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )

    return {"message": "Member removed successfully"}