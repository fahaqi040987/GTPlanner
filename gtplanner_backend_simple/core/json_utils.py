"""
Robust JSON parsing for LLM responses

OpenAI's response_format={"type": "json_object"} is not enforced by every
OpenAI-compatible provider (GLM/Z.ai, DeepSeek, local gateways, ...). Those
models may wrap JSON in markdown fences or append trailing prose after the
object, and a bare json.loads then fails with "Extra data" / "Expecting
value". parse_llm_json extracts the first balanced JSON object instead.
"""
import json


class LLMJSONParseError(ValueError):
    """Raised when an LLM response contains no parsable JSON object"""


def _strip_code_fences(content: str) -> str:
    """Remove a leading/trailing markdown code fence if present"""
    text = content.strip()
    if not text.startswith("```"):
        return text
    lines = text.splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    while lines and not lines[-1].strip():
        lines.pop()
    if lines and lines[-1].strip().startswith("```"):
        lines = lines[:-1]
    return "\n".join(lines).strip()


def _extract_first_object(text: str) -> str | None:
    """
    Return the first balanced {...} block from text, tracking string and
    escape state so braces inside JSON strings don't break the scan.
    """
    start = text.find("{")
    while start != -1:
        depth = 0
        in_string = False
        escaped = False
        for i in range(start, len(text)):
            ch = text[i]
            if in_string:
                if escaped:
                    escaped = False
                elif ch == "\\":
                    escaped = True
                elif ch == '"':
                    in_string = False
            else:
                if ch == '"':
                    in_string = True
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        return text[start:i + 1]
        # Unbalanced from this '{' — try the next one as a safeguard
        start = text.find("{", start + 1)
    return None


def parse_llm_json(content: str):
    """
    Parse a JSON object out of a raw LLM response.

    Tolerates clean JSON, markdown-fenced JSON, and trailing prose or
    duplicated JSON after the first object (the "Extra data" failure).
    Raises LLMJSONParseError when nothing parsable remains.
    """
    if not content or not content.strip():
        raise LLMJSONParseError("LLM returned an empty response")

    stripped = content.strip()
    # Fast path: the content is (fenced) JSON and nothing else
    for candidate in dict.fromkeys([stripped, _strip_code_fences(stripped)]):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue

    # Slow path: extract the first balanced object and parse that
    extracted = _extract_first_object(stripped)
    if extracted:
        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            pass

    raise LLMJSONParseError(
        "LLM response did not contain a parsable JSON object "
        f"(started with: {stripped[:120]!r})"
    )
