"""
PRD generator: the single deep module owning PRD generation and refinement

Everything about turning an idea (+ feedback) into a structured
PRDGeneration lives here: the prompt templates (module-level constants —
data, not methods), the one I/O seam (_call_llm_json), and JSON parsing.

`llm=None` falls back to the platform default configured in settings
(OPENAI_BASE_URL / OPENAI_API_KEY / OPENAI_MODEL). The blocking OpenAI call
runs in a worker thread via asyncio.to_thread, so callers stay async.
"""
import asyncio
import json
from collections.abc import Callable

from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam

from ..core.config import settings
from ..core.json_utils import LLMJSONParseError, parse_llm_json
from ..models.schemas import PRDGeneration

_LLM_TIMEOUT_SECONDS = 120.0


class PRDGenerationError(ValueError):
    """PRD generation/refinement failure with a user-actionable message"""


# --- Prompt templates (data, not methods) ---

PRD_SYSTEM_PROMPT = """You are an expert technical architect specializing in Product Requirements Documents (PRDs).

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

PRD_USER_PROMPT_TEMPLATE = """I want to build: {prompt}

{tech_preferences_block}Please generate a comprehensive PRD with:
1. Clear title and summary
2. Detailed requirements breakdown
3. Recommended technology stack with rationale
4. Infrastructure recommendations (hardware, cloud providers, architecture, costs)
5. Implementation roadmap
6. Success metrics

Ensure all recommendations are specific, actionable, and consider scalability and performance."""

REFINE_SYSTEM_PROMPT = """You are an expert technical architect refining a Product Requirements Document.
Review the original PRD and user feedback, then provide an improved version that addresses the feedback while maintaining technical excellence."""

REFINE_USER_PROMPT_TEMPLATE = """Original PRD:
{original_prd_json}

User Feedback:
{feedback}

Technology Changes Requested:
{tech_changes_json}

Please provide a refined PRD that addresses the user's feedback while maintaining best practices."""


class PRDGenerator:
    """Generates and refines structured PRDs via an OpenAI-compatible API"""

    def __init__(
        self,
        client_factory: Callable[[str, str], OpenAI] | None = None,
    ) -> None:
        """
        Args:
            client_factory: callable(base_url, api_key) returning an
                OpenAI-compatible client. Defaults to building a fresh
                client per call; inject a fake to test without network.
        """
        self._client_factory = client_factory or (
            lambda base_url, api_key: OpenAI(
                api_key=api_key,
                base_url=base_url,
                timeout=_LLM_TIMEOUT_SECONDS,
            )
        )

    async def generate_prd(
        self,
        prompt: str,
        tech_preferences: dict,
        llm: tuple[str, str, str] | None = None,
    ) -> PRDGeneration:
        """
        Generate a PRD from a project description.

        Args:
            prompt: User's project description
            tech_preferences: User's technology preferences
            llm: (base_url, api_key, model) override; None uses settings

        Returns:
            PRDGeneration: Structured PRD document

        Raises:
            PRDGenerationError: On API, parsing, or schema failures
        """
        base_url, api_key, model = self._resolve_llm(llm)
        user_prompt = PRD_USER_PROMPT_TEMPLATE.format(
            prompt=prompt,
            tech_preferences_block=(
                "My Technology Preferences:\n"
                f"{json.dumps(tech_preferences, indent=2)}\n\n"
                if tech_preferences
                else ""
            ),
        )
        prd_data = await asyncio.to_thread(
            self._call_llm_json,
            base_url,
            api_key,
            model,
            PRD_SYSTEM_PROMPT,
            user_prompt,
        )
        return self._to_prd(prd_data)

    async def refine_prd(
        self,
        original_prd: PRDGeneration,
        feedback: str,
        tech_changes: dict,
        llm: tuple[str, str, str] | None = None,
    ) -> PRDGeneration:
        """
        Refine a PRD based on user feedback.

        Args:
            original_prd: Original generated PRD
            feedback: User's feedback and requirements
            tech_changes: User's suggested tech stack changes
            llm: (base_url, api_key, model) override; None uses settings

        Returns:
            PRDGeneration: Refined PRD document

        Raises:
            PRDGenerationError: On API, parsing, or schema failures
        """
        base_url, api_key, model = self._resolve_llm(llm)
        user_prompt = REFINE_USER_PROMPT_TEMPLATE.format(
            original_prd_json=json.dumps(original_prd.model_dump(), indent=2),
            feedback=feedback,
            tech_changes_json=json.dumps(tech_changes, indent=2),
        )
        prd_data = await asyncio.to_thread(
            self._call_llm_json,
            base_url,
            api_key,
            model,
            REFINE_SYSTEM_PROMPT,
            user_prompt,
        )
        return self._to_prd(prd_data)

    def _call_llm_json(
        self,
        base_url: str,
        api_key: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
    ) -> dict:
        """The single I/O seam: one synchronous chat completion, parsed to a
        JSON object. Blocking — callers must run it via asyncio.to_thread."""
        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        try:
            client = self._client_factory(base_url, api_key)
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=4000,
            )
        except Exception as e:
            raise PRDGenerationError(
                f"LLM API error: {str(e)[:300]}"
            ) from e

        # parse_llm_json tolerates fences/trailing prose from providers that
        # ignore response_format json_object
        content = response.choices[0].message.content or ""
        try:
            return parse_llm_json(content)
        except LLMJSONParseError as e:
            raise PRDGenerationError(
                "LLM returned invalid JSON — please retry"
            ) from e

    def _to_prd(self, prd_data: dict) -> PRDGeneration:
        """Validate the parsed payload against the PRDGeneration schema"""
        try:
            return PRDGeneration(**prd_data)
        except Exception as e:
            raise PRDGenerationError(
                f"LLM returned a PRD that does not match the required "
                f"schema: {e}"
            ) from e

    @staticmethod
    def _resolve_llm(
        llm: tuple[str, str, str] | None,
    ) -> tuple[str, str, str]:
        """Explicit (base_url, api_key, model) or the settings default"""
        if llm is None:
            return (
                settings.OPENAI_BASE_URL,
                settings.OPENAI_API_KEY,
                settings.OPENAI_MODEL,
            )
        return llm


# Global instance
prd_generator = PRDGenerator()
