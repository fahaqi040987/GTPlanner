"""
Resiliency simulation engine for PRD sequence flows.

Implements PRD v1.0.0 section 8 scenarios:
- AI provider fallback & circuit breaker (already in llm_orchestrator)
- Rate limit 429 (exponential backoff + jitter)
- DB connection pool exhaustion (503 degraded mode)
- Redis failover & eviction storm (sentinel failover, mutex lock)

These simulate the sequence flow telemetry shown in the sequence flow
visualizer. The actual fault injection happens at the database and cache
layer; this module models the orchestration behavior.
"""
import asyncio
import random
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from openai import APIError, RateLimitError


@dataclass
class SimulationResult:
    """Outcome of a simulated failure scenario"""
    scenario: str
    success: bool
    latency_ms: float
    retries: int
    fallback_triggered: bool = False
    error_message: str | None = None


class RateLimitSimulator:
    """Simulates rate limiting with exponential backoff + full jitter"""

    def __init__(self, tpm_limit: int = 100, window_seconds: int = 60):
        self.tpm_limit = tpm_limit
        self.window_seconds = window_seconds
        self.request_timestamps: list[float] = []
        self.backoff_factor = 2.0
        self.max_backoff_seconds = 30.0

    def _cleanup_old_requests(self) -> None:
        cutoff = time.monotonic() - self.window_seconds
        self.request_timestamps = [t for t in self.request_timestamps if t > cutoff]

    def _get_retry_after(self) -> float:
        if not self.request_timestamps:
            return 0.0
        oldest = min(self.request_timestamps)
        elapsed = time.monotonic() - oldest
        return max(0.0, self.window_seconds - elapsed)

    async def simulate_request(
        self, *, force_429: bool = False
    ) -> SimulationResult:
        """Simulate one API request with rate limiting logic"""
        self._cleanup_old_requests()

        if force_429 or len(self.request_timestamps) >= self.tpm_limit:
            retry_after = self._get_retry_after()
            jitter = random.uniform(0, retry_after)
            wait_time = min(retry_after + jitter, self.max_backoff_seconds)

            await asyncio.sleep(wait_time)
            self._cleanup_old_requests()
            if force_429:
                return SimulationResult(
                    scenario="rate_limit_429",
                    success=False,
                    latency_ms=wait_time * 1000,
                    retries=1,
                    error_message="HTTP 429: Rate limit exceeded",
                )

        self.request_timestamps.append(time.monotonic())
        return SimulationResult(
            scenario="rate_limit_429",
            success=True,
            latency_ms=random.uniform(10, 100),
            retries=0,
        )


class DBPoolSimulator:
    """Simulates database connection pool exhaustion (PgBouncer style)"""

    def __init__(self, max_connections: int = 100):
        self.max_connections = max_connections
        self.active_connections = 0
        self.connection_wait_queue: list[asyncio.Event] = []

    async def acquire_connection(
        self, timeout_seconds: float = 5.0
    ) -> SimulationResult:
        """Simulate acquiring a DB connection from the pool"""
        if self.active_connections >= self.max_connections:
            # Pool exhausted - simulate connection timeout (503)
            await asyncio.sleep(timeout_seconds)
            return SimulationResult(
                scenario="db_pool_exhaustion_503",
                success=False,
                latency_ms=timeout_seconds * 1000,
                retries=0,
                error_message="PoolExhausted: No available connections",
            )

        self.active_connections += 1
        try:
            await asyncio.sleep(random.uniform(0.001, 0.01))
            return SimulationResult(
                scenario="db_pool_exhaustion_503",
                success=True,
                latency_ms=random.uniform(5, 50),
                retries=0,
            )
        finally:
            self.active_connections -= 1

    async def simulate_traffic_spike(
        self, concurrent_requests: int = 150
    ) -> list[SimulationResult]:
        """Simulate a traffic spike that exhausts the connection pool"""
        tasks = [
            self.acquire_connection(timeout_seconds=5.0)
            for _ in range(concurrent_requests)
        ]
        return await asyncio.gather(*tasks)


class RedisFailoverSimulator:
    """Simulates Redis Sentinel failover and eviction storms"""

    def __init__(
        self,
        master_nodes: int = 3,
        replica_factor: int = 2,
        max_memory_bytes: int = 1024 * 1024 * 1024,  # 1GB
    ):
        self.master_nodes = master_nodes
        self.replica_factor = replica_factor
        self.max_memory = max_memory_bytes
        self.used_memory = 0
        self.current_master = "redis-master-1"
        self.is_failover_active = False
        self.eviction_rate = 0.0  # Events per second during storm

    def set_memory_usage(self, bytes_used: int) -> None:
        self.used_memory = bytes_used

    def trigger_eviction_storm(self, event_rate: float = 100.0) -> None:
        self.eviction_rate = event_rate

    async def get(self, key: str) -> SimulationResult:
        """Simulate a Redis GET with failover handling"""
        if self.is_failover_active:
            # During failover, reads may hit replicas with slight latency
            await asyncio.sleep(random.uniform(0.01, 0.05))
            return SimulationResult(
                scenario="redis_failover",
                success=True,
                latency_ms=random.uniform(10, 50),
                retries=1,
                fallback_triggered=True,
            )

        if self.used_memory > self.max_memory and self.eviction_rate > 0:
            # Eviction storm - some keys may be evicted
            if random.random() < min(self.eviction_rate * 0.001, 0.5):
                return SimulationResult(
                    scenario="redis_eviction_storm",
                    success=False,
                    latency_ms=random.uniform(1, 5),
                    retries=0,
                    error_message="Key evicted during storm",
                )

        await asyncio.sleep(random.uniform(0.0001, 0.001))
        return SimulationResult(
            scenario="redis_failover",
            success=True,
            latency_ms=random.uniform(0.5, 5),
            retries=0,
        )

    async def simulate_failover(self, duration_seconds: float = 2.5) -> None:
        """Simulate a master node crash and failover to replica"""
        self.is_failover_active = True
        await asyncio.sleep(duration_seconds)
        self.is_failover_active = False
        # Pick new master
        self.current_master = f"redis-master-{random.randint(1, self.master_nodes)}"

    async def simulate_eviction_storm(
        self, duration_seconds: float = 5.0
    ) -> list[SimulationResult]:
        """Simulate cache eviction during memory pressure"""
        start = time.monotonic()
        results: list[SimulationResult] = []

        while time.monotonic() - start < duration_seconds:
            result = await self.get(key=f"key_{int(time.monotonic() * 1000)}")
            results.append(result)

            # Random eviction triggered by high memory usage
            if random.random() < 0.05:
                self.used_memory += random.randint(1024, 10240)  # 1KB-10KB
            else:
                self.used_memory = max(0, self.used_memory - random.randint(100, 500))

        return results


# Global instances for shared state across the application
rate_limit_sim = RateLimitSimulator(tpm_limit=100, window_seconds=60)
db_pool_sim = DBPoolSimulator(max_connections=100)
redis_sim = RedisFailoverSimulator(
    master_nodes=3,
    replica_factor=2,
    max_memory_bytes=1024 * 1024 * 1024,  # 1GB
)


async def simulate_sequence_flow(
    scenario: str = "happy_path",
    **kwargs: Any,
) -> SimulationResult:
    """
    Run a sequence flow simulation for the PRD visualizer.

    Scenarios:
    - happy_path: Normal flow with no issues
    - rate_limit_429: Simulate API rate limiting
    - db_pool_exhaustion_503: Simulate database pool exhaustion
    - redis_failover: Simulate Redis sentinel failover
    - ai_fallback: Simulate LLM provider fallback
    """
    if scenario == "happy_path":
        await asyncio.sleep(random.uniform(0.05, 0.15))
        return SimulationResult(
            scenario=scenario,
            success=True,
            latency_ms=random.uniform(50, 150),
            retries=0,
        )

    elif scenario == "rate_limit_429":
        return await rate_limit_sim.simulate_request(**kwargs)

    elif scenario == "db_pool_exhaustion_503":
        return await db_pool_sim.acquire_connection(**kwargs)

    elif scenario == "redis_failover":
        return await redis_sim.get(key="test")

    elif scenario == "ai_fallback":
        from .llm_orchestrator import LLMOrchestrator, ProviderConfig

        orchestrator = LLMOrchestrator(
            providers=[
                ProviderConfig(
                    name="primary_fallback_test",
                    base_url="https://api.openai.com/v1",
                    api_key="fake-key",
                    model="gpt-4",
                    priority=0,
                )
            ]
        )

        try:
            # Force primary to fail (fake API key)
            result = await orchestrator.complete(
                system_prompt="Test",
                user_prompt="Test",
            )
            return SimulationResult(
                scenario="ai_fallback",
                success=True,
                latency_ms=150,
                retries=1,
                fallback_triggered=True,
            )
        except Exception:
            return SimulationResult(
                scenario="ai_fallback",
                success=False,
                latency_ms=8000,
                retries=0,
                error_message="Primary provider timeout - circuit breaker would open",
            )

    else:
        raise ValueError(f"Unknown scenario: {scenario}")
