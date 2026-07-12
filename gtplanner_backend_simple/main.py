"""
Main FastAPI application for simplified GTPlanner
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import init_db
from .api import auth, prd, documents


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered PRD generation tool",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "GTPlanner API - Simplified Architecture",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


# Include routers
app.include_router(auth.router)
app.include_router(prd.router)
app.include_router(documents.router)


# Startup event
@app.on_event("startup")
async def startup_event():
    """Run startup tasks"""
    # Initialize database
    init_db()
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} started successfully!")
    print(f"📚 API Documentation: http://0.0.0.0:11211/docs")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run shutdown tasks"""
    print(f"👋 {settings.APP_NAME} shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=11211,
        reload=settings.DEBUG,
        log_level="info"
    )
