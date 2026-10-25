"""
Prompt builders for the generation workflow (PRD v2.1.0–v2.3.0)

Pure functions only — no I/O, no service state. Each returns the
(system_prompt, user_prompt) pair for one LLM round trip. The wording is
load-bearing: test fakes dispatch on prompt substrings ("clarifying
questions", "mermaid", "Regenerate ONLY"), so change with care.
"""
import json


def clarifying_questions_prompts(
    idea: str,
    tech_preferences: dict,
    feedback: str | None = None,
) -> tuple[str, str]:
    """Step 2 — prompts for targeted clarifying questions about the idea"""
    system_prompt = (
        "You are a senior product manager helping refine a "
        "product idea before writing a PRD. Respond with JSON "
        "only."
    )
    user_prompt = (
        f"Project idea: {idea}\n\n"
        f"Technology preferences: "
        f"{json.dumps(tech_preferences)}\n\n"
        "Generate 3 to 5 targeted clarifying questions whose "
        "answers would most improve a PRD for this idea.\n"
        + (f"User guidance: {feedback}\n" if feedback else "")
        + 'Return JSON exactly like: {"questions": [str]}'
    )
    return system_prompt, user_prompt


def full_prd_prompts(
    idea: str,
    tech_preferences: dict | None,
    questions: list | None,
    answers: list | None,
) -> tuple[str, str]:
    """Step 3 — prompts for the single structured full-PRD draft call"""
    answers = answers or []
    qa_block = ""
    if questions:
        pairs = "\n".join(
            f"Q: {q}\nA: {answers[i] if i < len(answers) else '(skipped)'}"
            for i, q in enumerate(questions)
        )
        qa_block = f"Clarifying questions and the user's answers:\n{pairs}\n\n"

    system_prompt = (
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
    )
    user_prompt = (
        f"Project idea: {idea}\n\n"
        + (
            f"Technology preferences: "
            f"{json.dumps(tech_preferences or {})}\n\n"
            if tech_preferences
            else ""
        )
        + qa_block
        + "Generate the complete PRD as JSON."
    )
    return system_prompt, user_prompt


def section_regeneration_prompts(
    idea: str,
    structured_prd: dict,
    section: str,
    feedback: str | None,
) -> tuple[str, str]:
    """Step 3 — prompts for regenerating one PRD section from feedback"""
    system_prompt = (
        "You are an expert technical architect refining one "
        "section of a Product Requirements Document. Respond "
        "with JSON only."
    )
    user_prompt = (
        f"Project idea: {idea}\n\n"
        f"Current PRD (JSON):\n"
        f"{json.dumps(structured_prd, indent=2)}\n\n"
        f"Regenerate ONLY the '{section}' section, improving it "
        f"for quality and specificity.\n"
        + (f"User feedback: {feedback}\n" if feedback else "")
        + f'Return JSON exactly like: {{"{section}": <value in '
        f"the same shape as in the current PRD>}}"
    )
    return system_prompt, user_prompt


def diagram_generation_prompts(
    idea: str,
    structured_prd: dict | None,
) -> tuple[str, str]:
    """Step 3 — prompts for generating all four mermaid diagrams"""
    system_prompt = (
        "You are an expert technical architect who visualizes "
        "products as mermaid diagrams. Respond with JSON only."
    )
    user_prompt = (
        f"Project idea: {idea}\n\n"
        f"PRD (JSON):\n"
        f"{json.dumps(structured_prd or {}, indent=2)}\n\n"
        "Generate 4 mermaid diagrams for this PRD:\n"
        '- "workflow": user/product workflow as a flowchart\n'
        '- "architecture": system architecture as a flowchart\n'
        '- "data_model": core entities as an erDiagram\n'
        '- "api_sequence": a key API interaction as a '
        'sequenceDiagram\n\n'
        "Every value must be valid mermaid syntax — the first "
        "line must start with the diagram keyword (flowchart, "
        "erDiagram, sequenceDiagram, ...). Keep each diagram "
        "under 30 lines.\n"
        'Return JSON exactly like: {"workflow": str, '
        '"architecture": str, "data_model": str, '
        '"api_sequence": str}'
    )
    return system_prompt, user_prompt


def diagram_regeneration_prompts(
    idea: str,
    current_diagrams: dict | None,
    diagram: str,
    feedback: str | None,
    retry_note: str | None = None,
    diagram_title: str | None = None,
) -> tuple[str, str]:
    """Step 3 — prompts for regenerating one mermaid diagram"""
    system_prompt = (
        "You are an expert technical architect who visualizes "
        "products as mermaid diagrams. Respond with JSON only."
    )
    user_prompt = (
        f"Project idea: {idea}\n\n"
        f"Current diagrams (JSON):\n"
        f"{json.dumps(current_diagrams or {}, indent=2)}\n\n"
        f"Regenerate ONLY the '{diagram}' diagram"
        + (f" ({diagram_title})" if diagram_title else "")
        + " as valid mermaid syntax"
        + (f". {retry_note}" if retry_note else "")
        + ".\n"
        + (f"User feedback: {feedback}\n" if feedback else "")
        + f'Return JSON exactly like: {{"{diagram}": str}}'
    )
    return system_prompt, user_prompt


def diagram_fix_prompts(
    structured_prd: dict | None,
    invalid: list[str],
) -> tuple[str, str]:
    """Step 3 — prompts for the one-shot invalid-diagram fix retry"""
    system_prompt = (
        "You fix mermaid diagrams. Respond with JSON only."
    )
    user_prompt = (
        f"These outputs were not valid mermaid syntax: "
        f"{', '.join(invalid)}.\n\n"
        "Regenerate them as valid mermaid (first line must "
        "start with the diagram keyword). Context — PRD JSON:\n"
        f"{json.dumps(structured_prd or {}, indent=2)}\n\n"
        f'Return JSON with exactly these keys: {invalid}'
    )
    return system_prompt, user_prompt
