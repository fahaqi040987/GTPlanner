"""
OpenAI service for PRD generation
"""
import json
from openai import OpenAI
from typing import Dict, Any
from ..core.config import settings
from ..models.schemas import PRDGeneration


class OpenAIService:
    """Service for interacting with OpenAI API"""

    def __init__(self):
        """Initialize OpenAI client"""
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )
        self.model = settings.OPENAI_MODEL

    async def generate_prd(
        self,
        prompt: str,
        tech_preferences: Dict[str, Any]
    ) -> PRDGeneration:
        """
        Generate PRD using OpenAI with structured outputs

        Args:
            prompt: User's project description
            tech_preferences: User's technology preferences

        Returns:
            PRDGeneration: Structured PRD document
        """
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(prompt, tech_preferences)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=4000
            )

            # Parse structured response
            content = response.choices[0].message.content
            prd_data = json.loads(content)

            return PRDGeneration(**prd_data)

        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    async def refine_prd(
        self,
        original_prd: PRDGeneration,
        feedback: str,
        tech_changes: Dict[str, Any]
    ) -> PRDGeneration:
        """
        Refine PRD based on user feedback

        Args:
            original_prd: Original generated PRD
            feedback: User's feedback and requirements
            tech_changes: User's suggested tech stack changes

        Returns:
            PRDGeneration: Refined PRD document
        """
        system_prompt = """You are an expert technical architect refining a Product Requirements Document.
Review the original PRD and user feedback, then provide an improved version that addresses the feedback while maintaining technical excellence."""

        user_prompt = f"""Original PRD:
{json.dumps(original_prd.model_dump(), indent=2)}

User Feedback:
{feedback}

Technology Changes Requested:
{json.dumps(tech_changes, indent=2)}

Please provide a refined PRD that addresses the user's feedback while maintaining best practices."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=4000
            )

            content = response.choices[0].message.content
            prd_data = json.loads(content)

            return PRDGeneration(**prd_data)

        except Exception as e:
            raise Exception(f"OpenAI API error during refinement: {str(e)}")

    def _build_system_prompt(self) -> str:
        """Build system prompt for PRD generation"""
        return """You are an expert technical architect specializing in Product Requirements Documents (PRDs).

Your task is to transform user ideas into comprehensive, actionable PRDs in JSON format.

**IMPORTANT**: You must respond with valid JSON that exactly follows this schema:

```json
{
  "title": "string - project title",
  "summary": "string - project overview",
  "requirements": ["string - requirement 1", "string - requirement 2", "..."],
  "tech_stack": {
    "frontend": ["string - framework1", "string - framework2"],
    "backend": ["string - framework1", "string - framework2"],
    "database": ["string - database1", "string - database2"],
    "devops": ["string - tool1", "string - tool2"],
    "rationale": "string - explanation of choices"
  },
  "infrastructure": {
    "hardware_specs": {
      "cpu_cores": "string - CPU specification",
      "ram": "string - RAM specification",
      "disk_space": "string - disk specification",
      "network": "string - network specification"
    },
    "cloud_providers": [
      {
        "name": "string - provider name",
        "services": ["string - service1", "string - service2"],
        "estimated_monthly_cost": "string - cost estimate",
        "rationale": "string - explanation"
      }
    ],
    "architecture": "string - architecture description",
    "data_stack": "string - data stack recommendations",
    "estimated_cost": "string - total cost estimate"
  },
  "implementation_plan": ["string - phase 1", "string - phase 2", "..."],
  "success_metrics": ["string - metric 1", "string - metric 2", "..."]
}
```

Be specific, practical, and consider scalability, performance, maintainability, and cost.
Always provide concrete examples and avoid vague recommendations."""

    def _build_user_prompt(self, prompt: str, tech_preferences: Dict[str, Any]) -> str:
        """Build user prompt from input and preferences"""
        user_message = f"""I want to build: {prompt}

"""

        if tech_preferences:
            user_message += f"My Technology Preferences:\n{json.dumps(tech_preferences, indent=2)}\n\n"

        user_message += """Please generate a comprehensive PRD with:
1. Clear title and summary
2. Detailed requirements breakdown
3. Recommended technology stack with rationale
4. Infrastructure recommendations (hardware, cloud providers, architecture, costs)
5. Implementation roadmap
6. Success metrics

Ensure all recommendations are specific, actionable, and consider scalability and performance."""

        return user_message


# Global instance
openai_service = OpenAIService()
