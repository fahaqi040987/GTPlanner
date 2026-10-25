"""
Shared exception types for the services layer.

Kept in a leaf module to avoid circular imports between
prd_generator and llm_orchestrator.
"""


class PRDGenerationError(ValueError):
    """PRD generation/refinement failure with a user-actionable message"""
