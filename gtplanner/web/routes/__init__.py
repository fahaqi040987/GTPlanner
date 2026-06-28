"""
API Routes for GTPlanner Web Interface
"""

from fastapi import APIRouter
from gtplanner.web.routes import auth, users, prds, workspaces, prd_generation

# Create API router
api_router = APIRouter()

# Include route modules
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(prds.router, prefix="/prds", tags=["prds"])
api_router.include_router(prd_generation.router, prefix="/prd-generation", tags=["prd-generation"])

__all__ = ["api_router"]