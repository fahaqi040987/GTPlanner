"""
Generation workflow service (PRD v2.1.0)

Server-persisted, resumable PRD generation:
  Step 1 intake (idea + tech preferences + LLM choice)
  Step 2 clarify (LLM-generated questions, skippable)
  Step 3 section drafts (reviewable, editable, per-section regenerable)
  Step 4 review & finalize (assembled markdown saved as a document)

Slim orchestrator: prompt text lives in workflow_prompts, mermaid
generation/validation lives in diagrams, and every LLM call still flows
through call_llm_json (single seam, easy to mock/test). LLM config resolves
via llm_config_service.resolve_llm_config (PRD v2.2.0 resolution order).
"""
from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam
from sqlalchemy.orm import Session

from ..core.json_utils import LLMJSONParseError, parse_llm_json
from ..models.schemas import PRDGeneration, WorkflowResponse
from ..models.user import User
from ..models.workflow import GenerationWorkflow
from .diagrams import (
    DIAGRAMS,
    DIAGRAM_TITLES,
    MERMAID_STARTS,
    generate_diagrams_safe,
    request_diagram,
    validate_mermaid,
)
from .document_service import document_service
from .llm_config_service import LLMConfigError, llm_config_service
from .workflow_prompts import (
    clarifying_questions_prompts,
    full_prd_prompts,
    section_regeneration_prompts,
)

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
    """Workflow failure with a user-actionable message (maps to HTTP 400)"""


class WorkflowLLMError(WorkflowError):
    """LLM/upstream failure inside an otherwise valid request (maps to 502)"""


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
        system_prompt, user_prompt = section_regeneration_prompts(
            idea=workflow.idea,
            structured_prd=workflow.structured_prd,
            section=section,
            feedback=feedback,
        )
        try:
            result = self.call_llm_json(
                base_url=base_url,
                api_key=api_key,
                model=model,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
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

    def regenerate_diagram(
        self,
        db: Session,
        user: User,
        workflow: GenerationWorkflow,
        diagram: str,
        feedback: str | None,
    ) -> GenerationWorkflow:
        """Regenerate one mermaid diagram from context + feedback (PRD v2.3.0:
        validate, auto-retry once, error out with a clear message)"""
        self._require_review_step(workflow)
        if diagram not in DIAGRAMS:
            raise WorkflowError(
                f"Unknown diagram '{diagram}'. Valid: {', '.join(DIAGRAMS)}"
            )
        if not workflow.structured_prd:
            raise WorkflowError("No drafts to regenerate — generate them first")

        call_json = self._diagram_call_json(
            self._resolve_llm(db, user, workflow.llm_choice)
        )
        source = request_diagram(
            call_json,
            idea=workflow.idea,
            current_diagrams=workflow.diagrams,
            diagram=diagram,
            feedback=feedback,
        )
        if not self._validate_mermaid(source):
            # PRD risk mitigation: auto-retry once before failing
            source = request_diagram(
                call_json,
                idea=workflow.idea,
                current_diagrams=workflow.diagrams,
                diagram=diagram,
                feedback=feedback,
                retry_note=(
                    "The previous output was not valid mermaid syntax. "
                    f"It must start with one of: {', '.join(MERMAID_STARTS)}."
                ),
            )
        if not self._validate_mermaid(source):
            raise WorkflowLLMError(
                "LLM error: produced invalid mermaid syntax after retry — "
                "please try again"
            )

        diagrams = dict(workflow.diagrams or {})
        diagrams[diagram] = source.strip()
        workflow.diagrams = diagrams
        db.commit()
        db.refresh(workflow)
        return workflow

    def update_diagram(
        self,
        db: Session,
        workflow: GenerationWorkflow,
        diagram: str,
        content: str,
    ) -> GenerationWorkflow:
        """Manual mermaid source edit (validated, no LLM call)"""
        self._require_review_step(workflow)
        if diagram not in DIAGRAMS:
            raise WorkflowError(
                f"Unknown diagram '{diagram}'. Valid: {', '.join(DIAGRAMS)}"
            )
        if not self._validate_mermaid(content):
            raise WorkflowError(
                "Diagram must be valid mermaid syntax — the first line must "
                f"start with one of: {', '.join(MERMAID_STARTS)}"
            )

        diagrams = dict(workflow.diagrams or {})
        diagrams[diagram] = content.strip()
        workflow.diagrams = diagrams
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

        content = self._assemble_markdown(
            title, summary, workflow.drafts or {}, workflow.diagrams
        )

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

        system_prompt, user_prompt = full_prd_prompts(
            idea=workflow.idea,
            tech_preferences=workflow.tech_preferences,
            questions=workflow.clarifying_questions,
            answers=workflow.clarifying_answers,
        )

        try:
            prd_data = self.call_llm_json(
                base_url=base_url,
                api_key=api_key,
                model=model,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
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
        # Visual PRDs (PRD v2.3.0) — fail-soft: drafts survive diagram failures
        workflow.diagrams = self._generate_diagrams_safe(
            (base_url, api_key, model), workflow
        )
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
        system_prompt, user_prompt = clarifying_questions_prompts(
            idea=idea,
            tech_preferences=tech_preferences,
            feedback=feedback,
        )
        try:
            result = self.call_llm_json(
                base_url=base_url,
                api_key=api_key,
                model=model,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
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
            raise WorkflowLLMError(f"LLM error: {str(e)[:300]}") from e

        content = response.choices[0].message.content or ""
        try:
            return parse_llm_json(content)
        except LLMJSONParseError as e:
            raise WorkflowLLMError(
                "LLM returned invalid JSON — please retry"
            ) from e

    def _diagram_call_json(self, llm: tuple[str, str, str]):
        """Bind the LLM triple into a call_json(system_prompt=, user_prompt=)
        closure for the diagram helpers in diagrams.py. Routes through
        self.call_llm_json so class-level test fakes intercept every call,
        and wraps stray exceptions exactly like the direct calls do."""
        base_url, api_key, model = llm

        def call_json(*, system_prompt: str, user_prompt: str) -> dict:
            try:
                return self.call_llm_json(
                    base_url=base_url,
                    api_key=api_key,
                    model=model,
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                )
            except WorkflowError:
                raise
            except Exception as e:
                raise WorkflowError(f"LLM error: {e}") from e

        return call_json

    def _generate_diagrams_safe(
        self,
        llm: tuple[str, str, str],
        workflow: GenerationWorkflow,
    ) -> dict[str, str]:
        """Generate the 4 mermaid diagrams; never raises — invalid or failed
        diagrams are simply omitted (the user can regenerate per diagram)"""
        return generate_diagrams_safe(
            self._diagram_call_json(llm),
            idea=workflow.idea,
            structured_prd=workflow.structured_prd,
        )

    @staticmethod
    def _validate_mermaid(source) -> bool:
        """Lightweight syntax gate (see diagrams.validate_mermaid)"""
        return validate_mermaid(source)

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
        self,
        title: str,
        summary: str,
        drafts: dict[str, str],
        diagrams: dict[str, str] | None = None,
    ) -> str:
        """Final document markdown: reviewed drafts with diagrams embedded
        inline next to their related sections (PRD v2.3.0, lean-inline
        placement assumed per PRD Open Question #9)"""
        diagrams = diagrams or {}

        def mermaid_block(key):
            return f"```mermaid\n{diagrams[key]}\n```"

        blocks = [f"# {title}", "## Summary", summary]

        if "workflow" in diagrams:
            blocks += [f"### {DIAGRAM_TITLES['workflow']}", mermaid_block("workflow")]

        for heading, key, diagram_key in (
            ("Requirements", "requirements", "api_sequence"),
            ("Technology Stack", "tech_stack", "data_model"),
            ("Infrastructure Recommendations", "infrastructure", "architecture"),
            ("Implementation Plan", "implementation_plan", None),
            ("Success Metrics", "success_metrics", None),
        ):
            blocks += [f"## {heading}", drafts.get(key, "")]
            if diagram_key and diagram_key in diagrams:
                blocks += [
                    f"### {DIAGRAM_TITLES[diagram_key]}",
                    mermaid_block(diagram_key),
                ]

        return "\n\n".join(blocks) + "\n"


# Global instance
workflow_service = WorkflowService()
