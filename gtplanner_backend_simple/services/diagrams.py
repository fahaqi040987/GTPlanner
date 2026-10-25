"""
Mermaid diagram support for the generation workflow (PRD v2.3.0)

Owns the diagram catalog (DIAGRAMS / DIAGRAM_TITLES), the lightweight
mermaid syntax gate, and the LLM round trips for generating, regenerating,
and fixing diagrams. LLM calls arrive as an injected
call_json(system_prompt=, user_prompt=) callable — WorkflowService binds it
to its single call_llm_json seam, so class-level test fakes keep working.
"""
from .workflow_prompts import (
    diagram_fix_prompts,
    diagram_generation_prompts,
    diagram_regeneration_prompts,
)

# Visual PRD artifacts (PRD v2.3.0): mermaid diagram keys, embedded inline
# next to their related section at finalize
DIAGRAMS = ["workflow", "architecture", "data_model", "api_sequence"]
DIAGRAM_TITLES = {
    "workflow": "Workflow",
    "architecture": "System Architecture",
    "data_model": "Data Model",
    "api_sequence": "API Sequence",
}

MERMAID_STARTS = (
    "flowchart", "graph", "sequenceDiagram", "erDiagram",
    "classDiagram", "stateDiagram", "journey", "gantt", "pie",
    "mindmap", "timeline",
)


def validate_mermaid(source) -> bool:
    """Lightweight syntax gate: non-empty and starts with a known
    diagram keyword (full rendering validation happens client-side)"""
    if not isinstance(source, str):
        return False
    stripped = source.strip()
    if len(stripped) < 10:
        return False
    first_line = stripped.splitlines()[0].strip()
    return any(first_line.startswith(k) for k in MERMAID_STARTS)


def request_diagram(
    call_json,
    *,
    idea: str,
    current_diagrams: dict | None,
    diagram: str,
    feedback: str | None,
    retry_note: str | None = None,
) -> str:
    """Ask the LLM for one diagram; returns the raw source (unvalidated)

    call_json must raise WorkflowError on failure (the service's bound seam
    does); any other exception is wrapped the same way.
    """
    # Deferred: workflow_service imports this module, so a module-level
    # import would be circular
    from .workflow_service import WorkflowError

    system_prompt, user_prompt = diagram_regeneration_prompts(
        idea=idea,
        current_diagrams=current_diagrams,
        diagram=diagram,
        diagram_title=DIAGRAM_TITLES.get(diagram),
        feedback=feedback,
        retry_note=retry_note,
    )
    try:
        result = call_json(system_prompt=system_prompt, user_prompt=user_prompt)
    except WorkflowError:
        raise
    except Exception as e:
        raise WorkflowError(f"LLM error: {e}") from e

    source = result.get(diagram)
    if not isinstance(source, str) or not source.strip():
        raise WorkflowError(
            f"LLM response did not include a '{diagram}' diagram"
        )
    return source


def generate_diagrams_safe(
    call_json,
    *,
    idea: str,
    structured_prd: dict | None,
) -> dict[str, str]:
    """Generate the 4 mermaid diagrams; never raises — invalid or failed
    diagrams are simply omitted (the user can regenerate per diagram)"""
    # Deferred: workflow_service imports this module, so a module-level
    # import would be circular
    from .workflow_service import WorkflowError

    try:
        system_prompt, user_prompt = diagram_generation_prompts(
            idea=idea, structured_prd=structured_prd
        )
        result = call_json(system_prompt=system_prompt, user_prompt=user_prompt)

        valid = {
            key: str(result[key]).strip()
            for key in DIAGRAMS
            if key in result and validate_mermaid(result[key])
        }
        invalid = [k for k in DIAGRAMS if k not in valid]

        if invalid:
            # PRD risk mitigation: auto-retry once for invalid diagrams
            retry_system_prompt, retry_user_prompt = diagram_fix_prompts(
                structured_prd=structured_prd, invalid=invalid
            )
            retry = call_json(
                system_prompt=retry_system_prompt,
                user_prompt=retry_user_prompt,
            )
            for key in invalid:
                if key in retry and validate_mermaid(retry[key]):
                    valid[key] = str(retry[key]).strip()
        return valid
    except WorkflowError:
        # Fail-soft: drafts are already stored; diagrams can be
        # regenerated individually
        return {}
