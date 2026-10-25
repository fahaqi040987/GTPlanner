"""
Compatibility shim — PRDGenerator owns PRD generation now.

PRD generation and refinement live in gtplanner_backend_simple.services.
prd_generator; this module only re-exports the old names so straggler
imports keep working. New code should import PRDGenerator / prd_generator
from services.prd_generator directly.
"""
from .prd_generator import (
    PRDGenerationError,
    PRDGenerator,
    prd_generator,
)

# Historical names kept importable: the old OpenAIService class and its
# module-level instance map 1:1 onto the new deep module.
OpenAIService = PRDGenerator
openai_service = prd_generator

__all__ = [
    "OpenAIService",
    "PRDGenerationError",
    "PRDGenerator",
    "openai_service",
    "prd_generator",
]
