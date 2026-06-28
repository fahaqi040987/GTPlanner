"""
PRD service for business logic
"""

from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
from uuid import uuid4
from datetime import datetime
import json

from gtplanner.web.models import (
    PRD, PRDVersion, Workspace, WorkspaceMember, WorkspaceRole,
    User, ActivityLog
)


class PRDService:
    """Service for PRD business logic"""

    @staticmethod
    def get_workspace_prds(session: Session, workspace_id: str, user_id: str) -> List[PRD]:
        """Get all PRDs in a workspace where user has access"""
        # Check if user has access to workspace
        if not PRDService._check_workspace_access(session, user_id, workspace_id):
            return []

        # Get all PRDs in workspace
        prds = session.exec(
            select(PRD)
            .where(PRD.workspace_id == workspace_id)
            .order_by(PRD.updated_at.desc())
        ).all()

        return prds

    @staticmethod
    def get_prd_by_id(session: Session, prd_id: str, user_id: str) -> Optional[PRD]:
        """Get PRD by ID if user has access to its workspace"""
        prd = session.get(PRD, prd_id)
        if not prd:
            return None

        # Check workspace access
        if not PRDService._check_workspace_access(session, user_id, prd.workspace_id):
            return None

        return prd

    @staticmethod
    def create_prd(
        session: Session,
        workspace_id: str,
        title: str,
        content: Dict[str, Any],
        created_by: str
    ) -> PRD:
        """Create a new PRD in workspace"""
        prd = PRD(
            id=str(uuid4()),
            workspace_id=workspace_id,
            title=title,
            content=content,
            version="1.0",
            status="draft",
            created_by=created_by,
            updated_by=created_by,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        session.add(prd)

        # Create initial version
        version = PRDVersion(
            id=str(uuid4()),
            prd_id=prd.id,
            version="1.0",
            content=content,
            created_by=created_by,
            created_at=datetime.utcnow(),
            change_description="Initial version"
        )
        session.add(version)

        # Log activity
        PRDService._log_activity(
            session, created_by, "created", "prd", prd.id,
            {"title": title, "workspace_id": workspace_id}
        )

        # Commit the transaction
        session.commit()
        session.refresh(prd)

        return prd

    @staticmethod
    def update_prd(
        session: Session,
        prd_id: str,
        user_id: str,
        title: Optional[str] = None,
        content: Optional[Dict[str, Any]] = None,
        status: Optional[str] = None,
        change_description: Optional[str] = None
    ) -> Optional[PRD]:
        """Update an existing PRD"""
        prd = session.get(PRD, prd_id)
        if not prd:
            return None

        # Check modify permission
        if not PRDService._can_modify_prd(session, user_id, prd.workspace_id):
            return None

        # Store old content for version history
        old_content = prd.content
        old_version = prd.version

        # Update fields
        if title is not None:
            prd.title = title
        if content is not None:
            prd.content = content
        if status is not None:
            prd.status = status

        prd.updated_by = user_id
        prd.updated_at = datetime.utcnow()

        # Create new version if content changed
        if content is not None and content != old_content:
            # Increment version
            version_parts = old_version.split('.')
            version_parts[0] = str(int(version_parts[0]) + 1)
            new_version = '.'.join(version_parts)

            prd.version = new_version

            version = PRDVersion(
                id=str(uuid4()),
                prd_id=prd.id,
                version=new_version,
                content=content,
                created_by=user_id,
                created_at=datetime.utcnow(),
                change_description=change_description or "Content updated"
            )
            session.add(version)

        # Log activity
        PRDService._log_activity(
            session, user_id, "updated", "prd", prd.id,
            {"title": prd.title, "changes": change_description}
        )

        # Commit the transaction
        session.commit()
        session.refresh(prd)

        return prd

    @staticmethod
    def delete_prd(session: Session, prd_id: str, user_id: str) -> bool:
        """Delete a PRD"""
        prd = session.get(PRD, prd_id)
        if not prd:
            return False

        # Check modify permission
        if not PRDService._can_modify_prd(session, user_id, prd.workspace_id):
            return False

        # Delete all versions first
        versions = session.exec(
            select(PRDVersion).where(PRDVersion.prd_id == prd_id)
        ).all()
        for version in versions:
            session.delete(version)

        # Log activity before deletion
        PRDService._log_activity(
            session, user_id, "deleted", "prd", prd.id,
            {"title": prd.title, "workspace_id": prd.workspace_id}
        )

        session.delete(prd)
        session.commit()
        return True

    @staticmethod
    def get_prd_versions(session: Session, prd_id: str, user_id: str) -> List[PRDVersion]:
        """Get version history of a PRD"""
        prd = session.get(PRD, prd_id)
        if not prd:
            return []

        # Check workspace access
        if not PRDService._check_workspace_access(session, user_id, prd.workspace_id):
            return []

        versions = session.exec(
            select(PRDVersion)
            .where(PRDVersion.prd_id == prd_id)
            .order_by(PRDVersion.created_at.desc())
        ).all()

        return versions

    @staticmethod
    def restore_prd_version(session: Session, prd_id: str, version_id: str, user_id: str) -> Optional[PRD]:
        """Restore a PRD to a specific version"""
        prd = session.get(PRD, prd_id)
        if not prd:
            return None

        # Check modify permission
        if not PRDService._can_modify_prd(session, user_id, prd.workspace_id):
            return None

        # Get the version to restore
        version = session.get(PRDVersion, version_id)
        if not version or version.prd_id != prd_id:
            return None

        # Update PRD with version content
        old_content = prd.content
        prd.content = version.content
        prd.updated_by = user_id
        prd.updated_at = datetime.utcnow()

        # Create new version for the restoration
        new_version_number = f"{int(prd.version.split('.')[0]) + 1}.0"
        prd.version = new_version_number

        new_version = PRDVersion(
            id=str(uuid4()),
            prd_id=prd.id,
            version=new_version_number,
            content=version.content,
            created_by=user_id,
            created_at=datetime.utcnow(),
            change_description=f"Restored from version {version.version}"
        )
        session.add(new_version)

        # Log activity
        PRDService._log_activity(
            session, user_id, "updated", "prd", prd.id,
            {"title": prd.title, "action": "restored", "from_version": version.version}
        )

        # Commit the transaction
        session.commit()
        session.refresh(prd)

        return prd

    @staticmethod
    def _check_workspace_access(session: Session, user_id: str, workspace_id: str) -> bool:
        """Check if user has access to workspace"""
        member = session.exec(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        ).first()

        return member is not None

    @staticmethod
    def _can_modify_prd(session: Session, user_id: str, workspace_id: str) -> bool:
        """Check if user can modify PRDs in workspace (admin or editor role)"""
        member = session.exec(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        ).first()

        if not member:
            return False

        # Admin and Editor can modify, Viewer cannot
        return member.role in [WorkspaceRole.ADMIN, WorkspaceRole.MEMBER]

    @staticmethod
    def _log_activity(
        session: Session,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log user activity"""
        activity = ActivityLog(
            id=str(uuid4()),
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            timestamp=datetime.utcnow()
        )
        session.add(activity)


# Create singleton instance
prd_service = PRDService()