"""
Sandboxed code execution abstraction.

Phase 1 of the Judge0 migration:
- Defines a single interface (CodeRunner) used by services to execute learner code.
- Provides a Judge0 implementation (works for both Judge0 CE public endpoint
  and self-hosted Judge0; RapidAPI host header is added when configured).
- Provides a local fallback that wraps the legacy subprocess sandbox so
  development can keep working until Phase 2 wires services to Judge0.

This module does NOT change any existing flow on its own. It only introduces
the abstraction. Phase 2 will switch quest_submission_service to call it.
"""

from __future__ import annotations

import asyncio
import base64
import time
from dataclasses import dataclass
from typing import Protocol

import httpx

from app.config import get_settings
from app.core.sandbox import run_python


# Map our internal language names to Judge0 language IDs.
# IDs from https://ce.judge0.com/languages/ (stable across CE and self-host).
JUDGE0_LANGUAGE_IDS: dict[str, int] = {
    "python": 71,       # Python (3.8.1)
    "javascript": 63,   # JavaScript (Node.js 12.14.0)
    "java": 62,         # Java (OpenJDK 13.0.1)
    "cpp": 54,          # C++ (GCC 9.2.0)
    "c": 50,            # C (GCC 9.2.0)
    "typescript": 74,   # TypeScript (3.7.4)
}


# Judge0 status IDs we care about. Reference: https://ce.judge0.com/statuses
# 1: In Queue, 2: Processing, 3: Accepted, 4: Wrong Answer,
# 5: TLE, 6: Compilation Error, 7..12: various Runtime Errors, 13: Internal Error,
# 14: Exec Format Error
_JUDGE0_TIMEOUT_STATUS = 5
_JUDGE0_COMPILE_ERROR_STATUS = 6
_JUDGE0_INTERNAL_ERROR_STATUS = 13


@dataclass
class CodeRunResult:
    """Normalized result returned by any CodeRunner implementation."""

    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool
    # Optional richer metadata (not all runners populate these).
    status: str | None = None  # e.g. "Accepted", "Wrong Answer", "Compilation Error"
    time_seconds: float | None = None
    memory_kb: int | None = None


class CodeRunnerError(RuntimeError):
    """Raised when the runner cannot execute code due to provider/transport issues."""


class CodeRunner(Protocol):
    """Interface every code runner must implement."""

    async def run(
        self,
        *,
        language: str,
        source: str,
        stdin: str | None = None,
        timeout_seconds: int = 5,
    ) -> CodeRunResult:
        ...


# ---------------------------------------------------------------------------
# Judge0 implementation
# ---------------------------------------------------------------------------


# Lightweight circuit breaker so a Judge0 outage doesn't hammer the upstream.
_judge0_state: dict[str, float | int] = {"failure_count": 0, "open_until": 0.0}
_JUDGE0_MAX_RETRIES = 2
_JUDGE0_BACKOFF_BASE_SECONDS = 0.6
_JUDGE0_CIRCUIT_FAILURE_THRESHOLD = 3
_JUDGE0_CIRCUIT_OPEN_SECONDS = 60


def _judge0_circuit_open() -> bool:
    return time.time() < float(_judge0_state["open_until"])


def _judge0_note_failure() -> None:
    _judge0_state["failure_count"] = int(_judge0_state["failure_count"]) + 1
    if int(_judge0_state["failure_count"]) >= _JUDGE0_CIRCUIT_FAILURE_THRESHOLD:
        _judge0_state["open_until"] = time.time() + _JUDGE0_CIRCUIT_OPEN_SECONDS
        _judge0_state["failure_count"] = 0


def _judge0_note_success() -> None:
    _judge0_state["failure_count"] = 0
    _judge0_state["open_until"] = 0.0


class Judge0CodeRunner:
    """Code runner backed by a Judge0 (CE) instance.

    Uses synchronous mode (`?wait=true`) which is the simplest and works for
    both the public endpoint and self-hosted deployments without webhooks.
    """

    def __init__(
        self,
        *,
        base_url: str,
        api_key: str | None = None,
        api_host: str | None = None,
        request_timeout_seconds: float = 15.0,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._api_host = api_host
        self._request_timeout = request_timeout_seconds

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["X-RapidAPI-Key"] = self._api_key
        if self._api_host:
            headers["X-RapidAPI-Host"] = self._api_host
        return headers

    @staticmethod
    def _resolve_language_id(language: str) -> int:
        key = (language or "").strip().lower()
        if key not in JUDGE0_LANGUAGE_IDS:
            raise CodeRunnerError(
                f"Unsupported language for Judge0: {language!r}. "
                f"Known: {sorted(JUDGE0_LANGUAGE_IDS)}"
            )
        return JUDGE0_LANGUAGE_IDS[key]

    @staticmethod
    def _decode_field(value: object) -> str:
        """Decode a Judge0 string field that was returned with base64 encoding.

        Judge0 returns ``None`` when a field is empty and otherwise base64 text
        whenever the request was made with ``base64_encoded=true``.
        """
        if value is None:
            return ""
        if not isinstance(value, str):
            return str(value)
        try:
            return base64.b64decode(value, validate=False).decode("utf-8", errors="replace")
        except (ValueError, TypeError):
            return value

    @classmethod
    def _to_result(cls, payload: dict, *, configured_timeout: int) -> CodeRunResult:
        stdout = cls._decode_field(payload.get("stdout"))
        stderr = cls._decode_field(payload.get("stderr"))
        compile_output = cls._decode_field(payload.get("compile_output"))
        message = cls._decode_field(payload.get("message"))

        status = payload.get("status") or {}
        status_id = int(status.get("id") or 0)
        status_desc = status.get("description")

        # Judge0 returns time as a string of seconds, e.g. "0.012"; memory as int (KB).
        try:
            time_seconds = float(payload.get("time")) if payload.get("time") is not None else None
        except (TypeError, ValueError):
            time_seconds = None
        memory_kb = payload.get("memory")
        try:
            memory_kb = int(memory_kb) if memory_kb is not None else None
        except (TypeError, ValueError):
            memory_kb = None

        # Compose stderr with compile output / runtime message so the UI sees the real cause.
        combined_stderr_parts = [s for s in (stderr, compile_output, message) if s]
        combined_stderr = "\n".join(combined_stderr_parts)

        timed_out = status_id == _JUDGE0_TIMEOUT_STATUS
        if timed_out and not combined_stderr:
            combined_stderr = f"Execution timed out after {configured_timeout}s."

        # Judge0 returns exit_code only on successful execution; default to 0 if Accepted.
        exit_code = payload.get("exit_code")
        if exit_code is None:
            if status_id == 3:  # Accepted
                exit_code = 0
            elif status_id == _JUDGE0_COMPILE_ERROR_STATUS:
                exit_code = -1
            else:
                exit_code = 1

        return CodeRunResult(
            stdout=stdout,
            stderr=combined_stderr,
            exit_code=int(exit_code),
            timed_out=timed_out,
            status=status_desc,
            time_seconds=time_seconds,
            memory_kb=memory_kb,
        )

    async def run(
        self,
        *,
        language: str,
        source: str,
        stdin: str | None = None,
        timeout_seconds: int = 5,
    ) -> CodeRunResult:
        if _judge0_circuit_open():
            raise CodeRunnerError(
                "Code execution service is temporarily unavailable. Please try again shortly."
            )

        language_id = self._resolve_language_id(language)

        # Use base64-encoded payloads to avoid intermittent UTF-8 validation
        # rejections from ce.judge0.com when compiler output (e.g. GCC's curly
        # quotes) is not strictly UTF-8. Both request and response strings are
        # base64; we decode response fields in _to_result.
        encoded_source = base64.b64encode((source or "").encode("utf-8")).decode("ascii")
        body: dict = {
            "language_id": language_id,
            "source_code": encoded_source,
            "cpu_time_limit": float(timeout_seconds),
            "wall_time_limit": float(timeout_seconds + 2),
        }
        if stdin:
            body["stdin"] = base64.b64encode(stdin.encode("utf-8")).decode("ascii")

        last_exc: Exception | None = None
        for attempt in range(_JUDGE0_MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(
                    base_url=self._base_url,
                    timeout=self._request_timeout,
                ) as client:
                    resp = await client.post(
                        "/submissions",
                        params={"base64_encoded": "true", "wait": "true"},
                        json=body,
                        headers=self._headers(),
                    )
                    resp.raise_for_status()
                    data = resp.json()

                _judge0_note_success()
                return self._to_result(data, configured_timeout=timeout_seconds)
            except httpx.HTTPStatusError as exc:
                last_exc = exc
                status_code = exc.response.status_code
                if status_code in (429, 500, 502, 503, 504) and attempt < _JUDGE0_MAX_RETRIES:
                    await asyncio.sleep(_JUDGE0_BACKOFF_BASE_SECONDS * (2**attempt))
                    continue
                _judge0_note_failure()
                raise CodeRunnerError(
                    f"Code execution service returned an error ({status_code})."
                ) from exc
            except (httpx.TimeoutException, httpx.RequestError) as exc:
                last_exc = exc
                if attempt < _JUDGE0_MAX_RETRIES:
                    await asyncio.sleep(_JUDGE0_BACKOFF_BASE_SECONDS * (2**attempt))
                    continue
                _judge0_note_failure()
                raise CodeRunnerError(
                    "Code execution service is unreachable. Please try again shortly."
                ) from exc

        _judge0_note_failure()
        raise CodeRunnerError("Code execution service failed.") from last_exc


# ---------------------------------------------------------------------------
# Local fallback (wraps existing subprocess sandbox)
# ---------------------------------------------------------------------------


class LocalSandboxCodeRunner:
    """Runs code via the legacy local subprocess sandbox.

    DEV ONLY. Supports Python only. Other languages raise CodeRunnerError.
    Kept so developers without internet can still iterate locally.
    """

    async def run(
        self,
        *,
        language: str,
        source: str,
        stdin: str | None = None,
        timeout_seconds: int = 5,
    ) -> CodeRunResult:
        if (language or "").lower() != "python":
            raise CodeRunnerError(
                "Local sandbox only supports Python. Configure JUDGE0_BASE_URL "
                "to run other languages."
            )

        # The legacy sandbox is sync; offload to a thread to avoid blocking the loop.
        sandbox_result = await asyncio.to_thread(
            run_python, source, timeout_seconds
        )
        return CodeRunResult(
            stdout=sandbox_result.stdout,
            stderr=sandbox_result.stderr,
            exit_code=sandbox_result.exit_code,
            timed_out=sandbox_result.timed_out,
            status="Accepted" if sandbox_result.exit_code == 0 and not sandbox_result.timed_out else None,
        )


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------


def get_code_runner() -> CodeRunner:
    """Pick the appropriate runner based on settings.

    Priority:
      1. JUDGE0_BASE_URL set -> Judge0 runner (preferred).
      2. USE_LOCAL_SANDBOX=true -> legacy local subprocess sandbox (dev only).
      3. Otherwise raise CodeRunnerError so misconfigured deployments fail fast.
    """
    settings = get_settings()

    if settings.judge0_base_url:
        return Judge0CodeRunner(
            base_url=settings.judge0_base_url,
            api_key=settings.judge0_api_key,
            api_host=settings.judge0_api_host,
            request_timeout_seconds=float(settings.judge0_timeout_seconds),
        )

    if settings.use_local_sandbox:
        return LocalSandboxCodeRunner()

    raise CodeRunnerError(
        "No code execution backend configured. Set JUDGE0_BASE_URL "
        "(or USE_LOCAL_SANDBOX=true for development)."
    )
