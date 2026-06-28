"""
User management routes (to be implemented in Phase 3)
"""

from fastapi import APIRouter

router = APIRouter()

# User routes will be implemented in Phase 3
@router.get("/")
async def list_users():
    """List users (to be implemented)"""
    return {"message": "User management routes - Coming in Phase 3"}