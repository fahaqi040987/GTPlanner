"""
Workspace service for business logic
"""

from typing import List, Optional
from sqlmodel import Session, select
from uuid import uuid4
from datetime import datetime

from gtplanner.web.models import (
    Workspace, WorkspaceMember, User, WorkspaceRole, PRD
)


class WorkspaceService:
    """Service for workspace business logic"""

    @staticmethod
    def create_workspace(
        session: Session,
        name: str,
        owner_id: str,
        description: Optional[str] = None
    ) -> Workspace:
        """Create a new workspace with owner as admin"""
        workspace = Workspace(
            id=str(uuid4()),
            name=name,
            description=description,
            owner_id=owner_id
        )
        session.add(workspace)
        session.flush()  # Get the workspace ID

        # Add owner as admin member
        member = WorkspaceMember(
            id=str(uuid4()),
            workspace_id=workspace.id,
            user_id=owner_id,
            role=WorkspaceRole.ADMIN
        )
        session.add(member)
        session.commit()
        session.refresh(workspace)

        return workspace

    @staticmethod
    def get_user_workspaces(session: Session, user_id: str) -> List[Workspace]:
        """Get all workspaces where user is a member"""
        # Simple approach: get members and extract workspace IDs
        members = session.exec(
            select(WorkspaceMember)
            .where(WorkspaceMember.user_id == user_id)
        ).all()

        if not members:
            return []

        workspace_ids = [member.workspace_id for member in members]

        # Get full workspace details
        workspaces = session.exec(
            select(Workspace)
            .where(Workspace.id.in_(workspace_ids))
        ).all()

        return workspaces

    @staticmethod
    def get_workspace_by_id(session: Session, workspace_id: str) -> Optional[Workspace]:
        """Get workspace by ID"""
        return session.get(Workspace, workspace_id)

    @staticmethod
    def check_workspace_access(session: Session, user_id: str, workspace_id: str) -> bool:
        """Check if user has access to workspace"""
        member = session.exec(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        ).first()

        return member is not None

    @staticmethod
    def get_workspace_role(session: Session, user_id: str, workspace_id: str) -> Optional[WorkspaceRole]:
        """Get user's role in workspace"""
        member = session.exec(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        ).first()

        return member.role if member else None

    @staticmethod
    def can_modify_workspace(session: Session, user_id: str, workspace_id: str) -> bool:
        """Check if user can modify workspace (admin or owner)"""
        workspace = session.get(Workspace, workspace_id)
        if not workspace:
            return False

        # Owner can always modify
        if workspace.owner_id == user_id:
            return True

        # Admin members can modify
        role = WorkspaceService.get_workspace_role(session, user_id, workspace_id)
        return role == WorkspaceRole.ADMIN

    @staticmethod
    def update_workspace(
        session: Session,
        workspace_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> Optional[Workspace]:
        """Update workspace details"""
        workspace = session.get(Workspace, workspace_id)
        if not workspace:
            return None

        if name is not None:
            workspace.name = name
        if description is not None:
            workspace.description = description

        workspace.updated_at = datetime.utcnow()
        session.commit()
        session.refresh(workspace)

        return workspace

    @staticmethod
    def delete_workspace(session: Session, workspace_id: str) -> bool:
        """Delete a workspace (cascades to members and PRDs)"""
        workspace = session.get(Workspace, workspace_id)
        if not workspace:
            return False

        session.delete(workspace)
        session.commit()
        return True

    @staticmethod
    def add_workspace_member(
        session: Session,
        workspace_id: str,
        user_id: str,
        role: WorkspaceRole = WorkspaceRole.VIEWER
    ) -> Optional[WorkspaceMember]:
        """Add a member to workspace"""
        # Check if already a member
        existing = session.exec(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        ).first()

        if existing:
            return None  # Already a member

        member = WorkspaceMember(
            id=str(uuid4()),
            workspace_id=workspace_id,
            user_id=user_id,
            role=role
        )
        session.add(member)
        session.commit()
        session.refresh(member)

        return member

    @staticmethod
    def remove_workspace_member(session: Session, workspace_id: str, user_id: str) -> bool:
        """Remove a member from workspace"""
        member = session.exec(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        ).first()

        if not member:
            return False

        session.delete(member)
        session.commit()
        return True

    @staticmethod
    def get_workspace_members(session: Session, workspace_id: str) -> List[dict]:
        """Get all members of a workspace with user details"""
        members = session.exec(
            select(WorkspaceMember, User)
            .join(User, WorkspaceMember.user_id == User.id)
            .where(WorkspaceMember.workspace_id == workspace_id)
        ).all()

        result = []
        for member, user in members:
            result.append({
                "id": member.id,
                "user_id": member.user_id,
                "name": user.name,
                "email": user.email,
                "role": member.role,
                "joined_at": member.joined_at.isoformat()
            })

        return result

    @staticmethod
    def get_workspace_prds(session: Session, workspace_id: str) -> List[PRD]:
        """Get all PRDs in a workspace"""
        prds = session.exec(
            select(PRD)
            .where(PRD.workspace_id == workspace_id)
            .order_by(PRD.updated_at.desc())
        ).all()

        return prds


workspace_service = WorkspaceService()