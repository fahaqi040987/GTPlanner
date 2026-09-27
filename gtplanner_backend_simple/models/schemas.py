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
    role: str = "user"
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


# LLM Configuration Schemas (PRD v2.2.0)
class LLMPresetCreate(BaseModel):
    """Admin: create an LLM preset"""
    name: str = Field(..., min_length=1, max_length=100)
    base_url: str = Field(..., min_length=1, max_length=500)
    api_key: str = Field(..., min_length=1, max_length=500)
    model: str = Field(..., min_length=1, max_length=100)


class LLMPresetUpdate(BaseModel):
    """Admin: partial update of an LLM preset"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    base_url: Optional[str] = Field(None, min_length=1, max_length=500)
    api_key: Optional[str] = Field(None, min_length=1, max_length=500)
    model: Optional[str] = Field(None, min_length=1, max_length=100)


class LLMPresetResponse(BaseModel):
    """LLM preset as returned by the API — key is masked, never full"""
    id: int
    name: str
    base_url: str
    model: str
    is_active: bool
    api_key_masked: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLLMConfigData(BaseModel):
    """User: personal LLM override (BYO key)"""
    base_url: str = Field(..., min_length=1, max_length=500)
    api_key: str = Field(..., min_length=1, max_length=500)
    model: str = Field(..., min_length=1, max_length=100)


class UserLLMConfigResponse(BaseModel):
    """Personal LLM override as returned by the API — key is masked"""
    base_url: str
    model: str
    api_key_masked: str
    updated_at: datetime

    class Config:
        from_attributes = True


class LLMTestRequest(BaseModel):
    """Connection test for an arbitrary (usually unsaved) LLM config"""
    base_url: str = Field(..., min_length=1, max_length=500)
    api_key: str = Field(..., min_length=1, max_length=500)
    model: str = Field(..., min_length=1, max_length=100)


class LLMTestResult(BaseModel):
    """Result of an LLM connection test"""
    success: bool
    message: str
    model: Optional[str] = None


# Generation Workflow Schemas (PRD v2.1.0)
class LLMChoice(BaseModel):
    """Per-generation LLM selection (resolution order in PRD v2.2.0)"""
    preset_id: Optional[int] = None
    use_personal: bool = False


class WorkflowCreateRequest(BaseModel):
    """Step 1 — idea intake"""
    idea: str = Field(..., min_length=10, description="Project description")
    tech_preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)
    llm_choice: Optional[LLMChoice] = None


class WorkflowAnswersRequest(BaseModel):
    """Step 2 answers (index-aligned with the clarifying questions)"""
    answers: List[str] = Field(..., min_length=1)


class WorkflowSkipRequest(BaseModel):
    """Skip an optional workflow step"""
    step: str = Field(..., description="Step to skip, e.g. 'clarify'")


class WorkflowDraftUpdateRequest(BaseModel):
    """Manually edit one section draft (no LLM call)"""
    section: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)


class WorkflowSectionRegenerateRequest(BaseModel):
    """Regenerate one section draft with optional user feedback"""
    section: str = Field(..., min_length=1)
    feedback: Optional[str] = None


class WorkflowQuestionsRegenerateRequest(BaseModel):
    """Regenerate the clarifying questions, optionally with guidance"""
    feedback: Optional[str] = None


class WorkflowResponse(BaseModel):
    """Current state of the user's generation workflow"""
    id: int
    current_step: str
    idea: str
    tech_preferences: Optional[Dict[str, Any]] = None
    llm_choice: Optional[Dict[str, Any]] = None
    clarifying_questions: Optional[List[str]] = None
    clarifying_answers: Optional[List[str]] = None
    drafts: Optional[Dict[str, str]] = None
    document_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
