"""
Generation workflow service (PRD v2.1.0)

Server-persisted, resumable PRD generation:
  Step 1 intake (idea + tech preferences + LLM choice)
  Step 2 clarify (LLM-generated questions, skippable)
  Step 3 section drafts (reviewable, editable, per-section regenerable)
  Step 4 review & finalize (assembled markdown saved as a document)

All LLM calls go through call_llm_json (single seam, easy to mock/test) and
resolve their config via llm_config_service.resolve_llm_config (PRD v2.2.0
resolution order).
"""
import json

from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam
from sqlalchemy.orm import Session

from ..models.schemas import (
    PRDGeneration,
    WorkflowResponse,
)
from ..models.user import User
from ..models.workflow import GenerationWorkflow
from .document_service import document_service
from .llm_config_service import LLMConfigError, llm_config_service

# The reviewable sections of a PRD (PRD v2.1.0 step 3)
SECTIONS = [
    "requirements",
    "tech_stack",
    "infrastructure",
    "implementation_plan",
    "success_metrics",
]

_LLM_TIMEOUT_SECONDS = 120.0


class WorkflowError(Exception):
    """LLM/workflow failure with a user-actionable message"""


class WorkflowService:
    """Guided, resumable PRD generation workflow"""

    # --- Workflow state management ---

    def get_current_workflow(
        self, db: Session, user_id: int
    ) -> GenerationWorkflow | None:
        """The user's active (not yet finalized) workflow, newest first"""
        return (
            db.query(GenerationWorkflow)
            .filter(
                GenerationWorkflow.user_id == user_id,
                GenerationWorkflow.document_id.is_(None),
            )
            .order_by(GenerationWorkflow.id.desc())
            .first()
        )

    def to_response(self, workflow: GenerationWorkflow) -> WorkflowResponse:
        return WorkflowResponse.model_validate(workflow)

    def create_workflow(
        self,
        db: Session,
        user: User,
        idea: str,
        tech_preferences: dict | None,
        llm_choice: dict | None,
    ) -> GenerationWorkflow:
        """Step 1 — start a workflow and generate clarifying questions.

        Replaces any previous active workflow (one active per user).
        """
        previous = self.get_current_workflow(db, user.id)
        if previous:
            db.delete(previous)
            db.commit()

        workflow = GenerationWorkflow(
            user_id=user.id,
            current_step="clarify",
            idea=idea,
            tech_preferences=tech_preferences or {},
            llm_choice=llm_choice,
        )
        db.add(workflow)
        db.commit()
        db.refresh(workflow)

        questions = self.generate_clarifying_questions(
            self._resolve_llm(db, user, llm_choice),
            idea,
            tech_preferences or {},
        )
        workflow.clarifying_questions = questions
        db.commit()
        db.refresh(workflow)
        return workflow

    def delete_current_workflow(self, db: Session, user_id: int) -> bool:
        workflow = self.get_current_workflow(db, user_id)
        if not workflow:
            return False
        db.delete(workflow)
        db.commit()
        return True

    # --- Step 2: clarify ---

    def save_answers(
        self,
        db: Session,
        user: User,
        workflow: GenerationWorkflow,
        answers: list[str],
    ) -> GenerationWorkflow:
        """Store clarifying answers, then generate all section drafts"""
        if workflow.current_step != "clarify":
            raise WorkflowError(
                f"Cannot save answers at step '{workflow.current_step}'"
            )

        questions = workflow.clarifying_questions or []
        # Align index-to-index; pad missing answers with empty strings
        aligned = [
            answers[i] if i < len(answers) else ""
            for i in range(len(questions))
        ]

        workflow.clarifying_answers = aligned
        self._generate_and_store_drafts(db, user, workflow)
        return workflow

    def skip_step(
        self, db: Session, user: User, workflow: GenerationWorkflow, step: str
    ) -> GenerationWorkflow:
        """Skip an optional step ('clarify' is the skippable one in MVP)"""
        if step != "clarify":
            raise WorkflowError(f"Step '{step}' cannot be skipped")
        if workflow.current_step != "clarify":
            raise WorkflowError(
                f"Cannot skip step 'clarify' at step '{workflow.current_step}'"
            )

        workflow.clarifying_questions = []
        workflow.clarifying_answers = []
        self._generate_and_store_drafts(db, user, workflow)
        return workflow

    def regenerate_questions(
        self,
        db: Session,
        user: User,
        workflow: GenerationWorkflow,
        feedback: str | None,
    ) -> GenerationWorkflow:
        """Fresh set of clarifying questions, optionally guided by feedback"""
        if workflow.current_step != "clarify":
            raise WorkflowError(
                f"Cannot regenerate questions at step '{workflow.current_step}'"
            )

        workflow.clarifying_questions = self.generate_clarifying_questions(
            self._resolve_llm(db, user, workflow.llm_choice),
            workflow.idea,
            workflow.tech_preferences or {},
            feedback=feedback,
        )
        workflow.clarifying_answers = None
        db.commit()
        db.refresh(workflow)
        return workflow

    # --- Step 3: drafts ---

    def update_draft(
        self,
        db: Session,
        workflow: GenerationWorkflow,
        section: str,
        content: str,
    ) -> GenerationWorkflow:
        """Manual edit of one section draft (no LLM call)"""
        self._require_review_step(workflow)
        if section not in SECTIONS:
            raise WorkflowError(
                f"Unknown section '{section}'. Valid: {', '.join(SECTIONS)}"
            )

        drafts = dict(workflow.drafts or {})
        drafts[section] = content
        workflow.drafts = drafts
        db.commit()
        db.refresh(workflow)
        return workflow

    def regenerate_section(
        self,
        db: Session,
        user: User,
        workflow: GenerationWorkflow,
        section: str,
        feedback: str | None,
    ) -> GenerationWorkflow:
        """Regenerate one section from the structured context + feedback"""
        self._require_review_step(workflow)
        if section not in SECTIONS:
            raise WorkflowError(
                f"Unknown section '{section}'. Valid: {', '.join(SECTIONS)}"
            )
        if not workflow.structured_prd:
            raise WorkflowError("No drafts to regenerate — generate them first")

        base_url, api_key, model = self._resolve_llm(
            db, user, workflow.llm_choice
        )
        try:
            result = self.call_llm_json(
                base_url=base_url,
                api_key=api_key,
                model=model,
                system_prompt=(
                    "You are an expert technical architect refining one "
                    "section of a Product Requirements Document. Respond "
                    "with JSON only."
                ),
                user_prompt=(
                    f"Project idea: {workflow.idea}\n\n"
                    f"Current PRD (JSON):\n"
                    f"{json.dumps(workflow.structured_prd, indent=2)}\n\n"
                    f"Regenerate ONLY the '{section}' section, improving it "
                    f"for quality and specificity.\n"
                    + (f"User feedback: {feedback}\n" if feedback else "")
                    + f'Return JSON exactly like: {{"{section}": <value in '
                    f"the same shape as in the current PRD>}}"
                ),
            )
        except WorkflowError:
            raise
        except Exception as e:
            raise WorkflowError(f"LLM error: {e}") from e

        if section not in result:
            raise WorkflowError(
                f"LLM response did not include a '{section}' section"
            )

        # Update both the structured payload and the reviewable markdown
        updated_prd = dict(workflow.structured_prd)
        updated_prd[section] = result[section]
        workflow.structured_prd = updated_prd

        drafts = dict(workflow.drafts or {})
        drafts[section] = self._render_section(section, result[section])
        workflow.drafts = drafts
        db.commit()
        db.refresh(workflow)
        return workflow

    # --- Step 4: finalize ---

    async def finalize_workflow(
        self, db: Session, user: User, workflow: GenerationWorkflow
    ) -> GenerationWorkflow:
        """Assemble the final markdown and save it as a document"""
        self._require_review_step(workflow)
        if not workflow.drafts:
            raise WorkflowError("No drafts to finalize")

        prd = workflow.structured_prd or {}
        title = prd.get("title") or "Untitled Project"
        summary = prd.get("summary") or ""

        content = self._assemble_markdown(title, summary, workflow.drafts or {})

        document = await document_service.create_document(
            db=db,
            user_id=user.id,
            title=title,
            content=content,
            tech_stack=prd.get("tech_stack"),
            recommendations=prd.get("infrastructure"),
        )

        workflow.document_id = document.id
        workflow.current_step = "finalized"
        db.commit()
        db.refresh(workflow)
        return workflow

    # --- Internals ---

    def _require_review_step(self, workflow: GenerationWorkflow) -> None:
        if workflow.current_step != "review":
            raise WorkflowError(
                f"Drafts are only editable at step 'review' "
                f"(current: '{workflow.current_step}')"
            )

    def _resolve_llm(
        self, db: Session, user: User, llm_choice: dict | None
    ) -> tuple[str, str, str]:
        """Resolve (base_url, api_key, model) per PRD v2.2.0 order"""
        choice = llm_choice or {}
        try:
            return llm_config_service.resolve_llm_config(
                db,
                user,
                preset_id=choice.get("preset_id"),
                use_personal=bool(choice.get("use_personal")),
            )
        except LLMConfigError as e:
            raise WorkflowError(str(e)) from e

    def _generate_and_store_drafts(
        self, db: Session, user: User, workflow: GenerationWorkflow
    ) -> None:
        """Generate all sections (single structured LLM call) and store both
        the structured payload and per-section reviewable markdown"""
        base_url, api_key, model = self._resolve_llm(
            db, user, workflow.llm_choice
        )

        qa_block = ""
        questions = workflow.clarifying_questions or []
        answers = workflow.clarifying_answers or []
        if questions:
            pairs = "\n".join(
                f"Q: {q}\nA: {answers[i] if i < len(answers) else '(skipped)'}"
                for i, q in enumerate(questions)
            )
            qa_block = f"Clarifying questions and the user's answers:\n{pairs}\n\n"

        try:
            prd_data = self.call_llm_json(
                base_url=base_url,
                api_key=api_key,
                model=model,
                system_prompt=(
                    "You are an expert technical architect specializing in "
                    "Product Requirements Documents. Transform the user's "
                    "idea into a comprehensive, actionable PRD. Respond with "
                    "JSON only, exactly following this schema: "
                    '{"title": str, "summary": str, "requirements": [str], '
                    '"tech_stack": {"frontend": [str], "backend": [str], '
                    '"database": [str], "devops": [str], "rationale": str}, '
                    '"infrastructure": {"hardware_specs": {"cpu_cores": str, '
                    '"ram": str, "disk_space": str, "network": str}, '
                    '"cloud_providers": [{"name": str, "services": [str], '
                    '"estimated_monthly_cost": str, "rationale": str}], '
                    '"architecture": str, "data_stack": str, '
                    '"estimated_cost": str}, "implementation_plan": [str], '
                    '"success_metrics": [str]}'
                ),
                user_prompt=(
                    f"Project idea: {workflow.idea}\n\n"
                    + (
                        f"Technology preferences: "
                        f"{json.dumps(workflow.tech_preferences or {})}\n\n"
                        if workflow.tech_preferences
                        else ""
                    )
                    + qa_block
                    + "Generate the complete PRD as JSON."
                ),
            )
            prd = PRDGeneration(**prd_data)
        except WorkflowError:
            raise
        except Exception as e:
            raise WorkflowError(f"Invalid PRD from LLM: {e}") from e

        workflow.structured_prd = prd.model_dump()
        workflow.drafts = {
            section: self._render_section(section, getattr(prd, section))
            for section in SECTIONS
        }
        workflow.current_step = "review"
        db.commit()
        db.refresh(workflow)

    def generate_clarifying_questions(
        self,
        llm: tuple[str, str, str],
        idea: str,
        tech_preferences: dict,
        feedback: str | None = None,
    ) -> list[str]:
        """Step 2 — targeted questions about the idea (LLM call)"""
        base_url, api_key, model = llm
        try:
            result = self.call_llm_json(
                base_url=base_url,
                api_key=api_key,
                model=model,
                system_prompt=(
                    "You are a senior product manager helping refine a "
                    "product idea before writing a PRD. Respond with JSON "
                    "only."
                ),
                user_prompt=(
                    f"Project idea: {idea}\n\n"
                    f"Technology preferences: "
                    f"{json.dumps(tech_preferences)}\n\n"
                    "Generate 3 to 5 targeted clarifying questions whose "
                    "answers would most improve a PRD for this idea.\n"
                    + (f"User guidance: {feedback}\n" if feedback else "")
                    + 'Return JSON exactly like: {"questions": [str]}'
                ),
            )
        except WorkflowError:
            raise
        except Exception as e:
            raise WorkflowError(f"LLM error: {e}") from e

        questions = result.get("questions")
        if not isinstance(questions, list) or not questions:
            raise WorkflowError("LLM returned no clarifying questions")
        return [str(q) for q in questions]

    def call_llm_json(
        self,
        base_url: str,
        api_key: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
    ) -> dict:
        """Single seam for all workflow LLM calls: returns parsed JSON"""
        client = OpenAI(
            api_key=api_key, base_url=base_url, timeout=_LLM_TIMEOUT_SECONDS
        )
        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7,
            )
        except Exception as e:
            raise WorkflowError(f"LLM error: {str(e)[:300]}") from e

        content = response.choices[0].message.content or ""
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            raise WorkflowError(
                "LLM returned invalid JSON — please retry"
            ) from e

    def _render_section(self, section: str, value) -> str:
        """Render one structured section value as reviewable markdown"""
        if section == "requirements" or section == "success_metrics":
            return "\n".join(f"- {item}" for item in value)
        if section == "implementation_plan":
            return "\n".join(
                f"{i + 1}. {step}" for i, step in enumerate(value)
            )
        if section == "tech_stack":
            lines = [value.get("rationale", "")]
            for group in ("frontend", "backend", "database", "devops"):
                items = value.get(group) or []
                if items:
                    lines.append(
                        f"\n### {group.capitalize()}\n"
                        + "\n".join(f"- {item}" for item in items)
                    )
            return "\n".join(lines)
        if section == "infrastructure":
            lines = [value.get("architecture", "")]
            hw = value.get("hardware_specs") or {}
            if hw:
                lines.append(
                    "\n### Hardware Specifications\n"
                    + "\n".join(
                        f"- {label}: {hw.get(field, 'N/A')}"
                        for label, field in (
                            ("CPU", "cpu_cores"),
                            ("RAM", "ram"),
                            ("Disk", "disk_space"),
                        )
                    )
                )
            providers = value.get("cloud_providers") or []
            if providers:
                lines.append(
                    "\n### Cloud Providers\n"
                    + "\n".join(
                        f"- **{p.get('name', 'Provider')}**: "
                        f"{p.get('estimated_monthly_cost', 'N/A')}"
                        for p in providers
                    )
                )
            if value.get("data_stack"):
                lines.append(f"\n### Data Stack\n\n{value['data_stack']}")
            return "\n".join(lines)
        return str(value)

    def _assemble_markdown(
        self, title: str, summary: str, drafts: dict[str, str]
    ) -> str:
        """Final document markdown from title/summary + reviewed drafts"""
        sections = [
            (heading, drafts.get(key, ""))
            for heading, key in (
                ("Requirements", "requirements"),
                ("Technology Stack", "tech_stack"),
                ("Infrastructure Recommendations", "infrastructure"),
                ("Implementation Plan", "implementation_plan"),
                ("Success Metrics", "success_metrics"),
            )
        ]
        body = "\n\n".join(
            f"## {heading}\n\n{content}" for heading, content in sections
        )
        return f"# {title}\n\n## Summary\n\n{summary}\n\n{body}\n"


# Global instance
workflow_service = WorkflowService()
