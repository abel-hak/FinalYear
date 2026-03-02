"""
Simple Python code execution sandbox abstraction.

MVP implementation:
- Runs learner Python code in a separate process with a hard timeout.
- Captures stdout, stderr, and exit code.

NOTE: For production, this should be replaced with a proper container-based
sandbox with resource limits and isolation, as described in the documentation.
"""
from __future__ import annotations

from dataclasses import dataclass
import subprocess
import sys
import tempfile
import textwrap
import os


@dataclass
class SandboxResult:
    stdout: str
    stderr: str
    timed_out: bool
    exit_code: int


def run_python(code: str, timeout_seconds: int = 5) -> SandboxResult:
    """
    Execute Python code in a separate process with timeout.

    This is a minimal stand-in for the secure sandbox described in the design:
    - 5-second timeout (per NFR-06.2).
    - Captures stdout/stderr but does not provide network or file access
      beyond what the OS permits for the Python process.
    """
    # Normalize code indentation
    code_to_run = textwrap.dedent(code)

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tmp:
        tmp.write(code_to_run)
        tmp_path = tmp.name

    try:
        proc = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
        return SandboxResult(
            stdout=proc.stdout,
            stderr=proc.stderr,
            timed_out=False,
            exit_code=proc.returncode,
        )
    except subprocess.TimeoutExpired as exc:
        return SandboxResult(
            stdout=exc.stdout or "",
            stderr=(exc.stderr or "") + "\nExecution timed out.",
            timed_out=True,
            exit_code=-1,
        )
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            # If cleanup fails it's not critical for MVP
            pass

