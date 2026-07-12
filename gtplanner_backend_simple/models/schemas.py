"""
Pydantic schemas for API and data validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """User response schema"""
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Authentication token schema"""
    access_token: str
    token_type: str = "bearer"


# Tech Stack Schemas
class TechStackRecommendation(BaseModel):
    """Technology stack recommendation"""
    frontend: List[str] = []
    backend: List[str] = []
    database: List[str] = []
    devops: List[str] = []
    rationale: str = ""


class HardwareSpecs(BaseModel):
    """Hardware specifications"""
    cpu_cores: str = ""
    ram: str = ""
    disk_space: str = ""
    network: str = ""


class CloudProvider(BaseModel):
    """Cloud provider recommendation"""
    name: str = ""
    services: List[str] = []
    estimated_monthly_cost: str = ""
    rationale: str = ""


class InfrastructureRecommendation(BaseModel):
    """Infrastructure recommendations"""
    hardware_specs: HardwareSpecs
    cloud_providers: List[CloudProvider] = []
    architecture: str = ""
    data_stack: str = ""
    estimated_cost: str = ""


# PRD Schemas
class PRDRequest(BaseModel):
    """PRD generation request"""
    prompt: str = Field(..., min_length=10, description="Project description")
    tech_preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)


class PRDGeneration(BaseModel):
    """Complete PRD generation output"""
    title: str
    summary: str
    requirements: List[str]
    tech_stack: TechStackRecommendation
    infrastructure: InfrastructureRecommendation
    implementation_plan: List[str]
    success_metrics: List[str]


class PRDUpdate(BaseModel):
    """PRD update schema"""
    title: Optional[str] = None
    content: Optional[str] = None
    tech_stack: Optional[Dict[str, Any]] = None
    recommendations: Optional[Dict[str, Any]] = None


class PRDResponse(BaseModel):
    """PRD document response"""
    id: int
    user_id: int
    title: str
    content: str
    tech_stack: Optional[Dict[str, Any]] = None
    recommendations: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PRDListResponse(BaseModel):
    """PRD list response"""
    id: int
    title: str
    summary: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# API Response Schemas
class APIResponse(BaseModel):
    """Generic API response"""
    success: bool
    message: str
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: Optional[str] = None
