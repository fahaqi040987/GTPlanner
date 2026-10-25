"""
Regression tests for gtplanner_backend_simple.core.config

Locks down env-file path anchoring: configuration must be discovered relative
to the package / repo root, never the current working directory.

Note: importing the config module executes `settings = get_settings()`, so
like the rest of this suite these tests require OPENAI_API_KEY to be set in
the environment or an env file.
"""

from pathlib import Path

import pytest

import gtplanner_backend_simple.core.config as config_module

BACKEND_DIR = Path(config_module.__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent


def test_env_file_candidates_are_absolute():
    """Regression: env files must be __file__-anchored, not CWD-relative."""
    for path in config_module._env_file_candidates():
        assert path.is_absolute(), f"env file candidate is CWD-relative: {path}"


def test_default_mode_prefers_env_dev_over_env(monkeypatch):
    """Regression: .env.dev overrides .env; .env remains the fallback."""
    monkeypatch.delenv("GTPLANNER_ENV", raising=False)
    candidates = [Path(p) for p in config_module._env_file_candidates()]

    assert REPO_ROOT / ".env.dev" in candidates
    assert REPO_ROOT / ".env" in candidates
    # pydantic-settings merges files in order; later entries win.
    assert candidates.index(REPO_ROOT / ".env") < candidates.index(
        REPO_ROOT / ".env.dev"
    )


def test_simple_mode_loads_only_env_dev(monkeypatch):
    monkeypatch.setenv("GTPLANNER_ENV", "simple")
    candidates = [Path(p) for p in config_module._env_file_candidates()]

    assert REPO_ROOT / ".env.dev" in candidates
    assert all(p.name == ".env.dev" for p in candidates)


def test_missing_api_key_error_lists_searched_paths(monkeypatch):
    """Fail-fast must be actionable: name every location that was searched."""
    has_env_file = any(
        path.is_file() for path in config_module._env_file_candidates()
    )
    if has_env_file:
        pytest.skip("env file exists on this machine; missing-key path not testable")

    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        config_module.get_settings()


def test_api_key_can_come_from_environment(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key-123")
    settings = config_module.get_settings()
    assert settings.OPENAI_API_KEY == "test-key-123"
