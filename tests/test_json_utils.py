"""
Regression tests for LLM JSON parsing (bug: "Extra data: line 63 column 1")

Root cause: providers that ignore response_format={"type": "json_object"}
return JSON wrapped in fences or with trailing prose/duplicated objects;
the old bare json.loads(content) raised JSONDecodeError("Extra data").
parse_llm_json extracts the first balanced JSON object instead.
"""
import pytest

from gtplanner_backend_simple.core.json_utils import (
    LLMJSONParseError,
    parse_llm_json,
)

CLEAN_PRD = '{"title": "Task App", "summary": "A task app.", "requirements": []}'


class TestCleanJson:
    def test_plain_object(self):
        assert parse_llm_json(CLEAN_PRD)["title"] == "Task App"

    def test_whitespace_padded(self):
        assert parse_llm_json(f"\n\n  {CLEAN_PRD}  \n")["title"] == "Task App"


class TestFencedJson:
    """Fenced output would previously raise 'Expecting value'"""

    def test_json_language_fence(self):
        content = f"```json\n{CLEAN_PRD}\n```"
        assert parse_llm_json(content)["title"] == "Task App"

    def test_bare_fence(self):
        content = f"```\n{CLEAN_PRD}\n```"
        assert parse_llm_json(content)["title"] == "Task App"

    def test_fence_with_trailing_prose(self):
        content = f"```json\n{CLEAN_PRD}\n```\n\nHope this helps!"
        assert parse_llm_json(content)["title"] == "Task App"


class TestTrailingData:
    """The exact reported symptom: valid JSON + extra content after it"""

    def test_trailing_prose_after_json(self):
        # 'Extra data: line 63 column 1 (char 5131)' comes from this shape
        content = CLEAN_PRD + "\nThis JSON describes the task app I designed."
        assert parse_llm_json(content)["title"] == "Task App"

    def test_two_concatenated_objects(self):
        content = CLEAN_PRD + '\n{"title": "Second object", "x": 1}'
        assert parse_llm_json(content)["title"] == "Task App"

    def test_braces_inside_strings_do_not_break_extraction(self):
        inner = '{"summary": "use { and } carefully, and \\"quotes\\" too"}'
        content = inner + "\nSome trailing note with { fake braces }"
        assert parse_llm_json(content)["summary"].startswith("use { and }")


class TestLeadingProse:
    def test_intro_before_json(self):
        content = "Here is the PRD you asked for:\n" + CLEAN_PRD
        assert parse_llm_json(content)["title"] == "Task App"


class TestFailures:
    def test_empty_response_raises(self):
        with pytest.raises(LLMJSONParseError, match="empty"):
            parse_llm_json("")

    def test_garbage_raises(self):
        with pytest.raises(LLMJSONParseError, match="parsable JSON"):
            parse_llm_json("Sorry, I cannot do that.")

    def test_unbalanced_braces_raise(self):
        with pytest.raises(LLMJSONParseError):
            parse_llm_json('{"title": "broken"')

    def test_error_includes_content_prefix(self):
        with pytest.raises(LLMJSONParseError, match="Sorry, I cannot"):
            parse_llm_json("Sorry, I cannot do that.")
