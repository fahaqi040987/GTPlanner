"""
Multi-provider LLM orchestration with circuit breaker & fallback routing.

Implements PRD v1.0.0 section 8.2: when the primary provider fails
(timeout / 5xx / connection errors) the circuit breaker opens and the
router transparently falls back to the next healthy provider.

Providers are OpenAI-compatible endpoints (OpenAI, plus gateways/proxies
serving Claude / Gemini / open models through an OpenAI-shaped API).
"""
from __future__ import annotations

import asyncio
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam

from ..core.config import settings
from .errors import PRDGenerationError

_LLM_TIMEOUT_SECONDS = 120.0

# Failures required to trip the breaker, and how long it stays open.
BREAKER_THRESHOLD = 3
BREAKER_COOLDOWN_SECONDS = 30.0


@dataclass
class ProviderConfig:
    """One addressable LLM provider"""
    name: str
    base_url: str
    api_key: str
    model: str
    priority: int = 100  # lower = tried first


@dataclass
class _BreakerState:
    consecutive_failures: int = 0
    opened_at: float | None = None

    @property
    def is_open(self) -> bool:
        if self.opened_at is None:
            return False
        if time.monotonic() - self.opened_at >= BREAKER_COOLDOWN_SECONDS:
            # Half-open: allow one probe request through.
            self.opened_at = None
            self.consecutive_failures = BREAKER_THRESHOLD - 1
            return False
        return True


@dataclass
class FallbackResult:
    """Outcome of one routed completion"""
    provider: str
    model: str
    content: str
    attempts: list[dict[str, Any]] = field(default_factory=list)


def default_provider_chain() -> list[ProviderConfig]:
    """Build the provider chain from environment/settings.

    Order: the configured primary, then well-known alternates when their
    API keys exist in the environment (ANTHROPIC_API_KEY / GEMINI_API_KEY
    routed through their OpenAI-compatible gateways).
    """
    import os

    chain = [
        ProviderConfig(
            name="primary",
            base_url=settings.OPENAI_BASE_URL,
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
            priority=0,
        )
    ]

    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    if anthropic_key:
        chain.append(
            ProviderConfig(
                name="anthropic",
                base_url=os.getenv(
                    "ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1"
                ),
                api_key=anthropic_key,
                model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest"),
                priority=10,
            )
        )

    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if gemini_key:
        chain.append(
            ProviderConfig(
                name="gemini",
                base_url=os.getenv(
                    "GEMINI_BASE_URL",
                    "https://generativelanguage.googleapis.com/oci/v1beta/openai",
                ),
                api_key=gemini_key,
                model=os.getenv("GEMINI_MODEL", "gemini-1.5-pro"),
                priority=20,
            )
        )

    return sorted(chain, key=lambda p: p.priority)


class LLMOrchestrator:
    """Routes completion requests across providers with breaker protection"""

    def __init__(
        self,
        client_factory: Callable[[str, str], OpenAI] | None = None,
        providers: list[ProviderConfig] | None = None,
    ) -> None:
        self._client_factory = client_factory or (
            lambda base_url, api_key: OpenAI(
                api_key=api_key,
                base_url=base_url,
                timeout=_LLM_TIMEOUT_SECONDS,
            )
        )
        self._providers = providers if providers is not None else default_provider_chain()
        self._breakers: dict[str, _BreakerState] = {
            p.name: _BreakerState() for p in self._providers
        }

    @property
    def providers(self) -> list[ProviderConfig]:
        return list(self._providers)

    def breaker_status(self) -> dict[str, dict[str, Any]]:
        """Observability snapshot for the admin analytics portal"""
        return {
            name: {
                "open": state.is_open,
                "consecutive_failures": state.consecutive_failures,
            }
            for name, state in self._breakers.items()
        }

    def _eligible(self, provider: ProviderConfig) -> bool:
        state = self._breakers[provider.name]
        return not state.is_open

    def _record_success(self, provider: ProviderConfig) -> None:
        self._breakers[provider.name].consecutive_failures = 0
        self._breakers[provider.name].opened_at = None

    def _record_failure(self, provider: ProviderConfig) -> None:
        state = self._breakers[provider.name]
        state.consecutive_failures += 1
        if state.consecutive_failures >= BREAKER_THRESHOLD:
            state.opened_at = time.monotonic()

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = True,
        temperature: float = 0.7,
        max_tokens: int = 4000,
    ) -> FallbackResult:
        """Run a completion across the provider chain with fallback.

        Raises PRDGenerationError when every eligible provider fails.
        """
        candidates = [p for p in self._providers if self._eligible(p)]
        if not candidates:
            # All breakers open: retry the highest-priority one as a probe
            # rather than failing outright (degraded, not dead).
            candidates = [self._providers[0]]

        attempts: list[dict[str, Any]] = []
        last_error: Exception | None = None

        for provider in candidates:
            try:
                content = await asyncio.to_thread(
                    self._call_provider,
                    provider,
                    system_prompt,
                    user_prompt,
                    json_mode,
                    temperature,
                    max_tokens,
                )
                self._record_success(provider)
                attempts.append(
                    {"provider": provider.name, "ok": True, "model": provider.model}
                )
                return FallbackResult(
                    provider=provider.name,
                    model=provider.model,
                    content=content,
                    attempts=attempts,
                )
            except Exception as e:  # noqa: BLE001 — fall through to next provider
                self._record_failure(provider)
                last_error = e
                attempts.append(
                    {"provider": provider.name, "ok": False, "error": str(e)[:200]}
                )

        raise PRDGenerationError(
            "All LLM providers failed. Last error: "
            f"{str(last_error)[:300] if last_error else 'unknown'}"
        )

    def _call_provider(
        self,
        provider: ProviderConfig,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool,
        temperature: float,
        max_tokens: int,
    ) -> str:
        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        client = self._client_factory(provider.base_url, provider.api_key)
        kwargs: dict[str, Any] = {
            "model": provider.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""


# Global instance
llm_orchestrator = LLMOrchestrator()
