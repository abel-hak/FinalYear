"""
M6: Sandbox unit tests.

Tests run_python for basic execution, timeout, and output capture.
"""
import pytest

from app.core.sandbox import run_python, SandboxResult


def test_run_python_simple_print() -> None:
    """Simple print statement produces correct stdout."""
    result = run_python("print('hello')")
    assert isinstance(result, SandboxResult)
    assert result.stdout.strip() == "hello"
    assert result.exit_code == 0
    assert result.timed_out is False


def test_run_python_multiline_output() -> None:
    """Multiple print lines captured correctly."""
    result = run_python("print(1)\nprint(2)\nprint(3)")
    assert result.exit_code == 0
    assert "1" in result.stdout
    assert "2" in result.stdout
    assert "3" in result.stdout


def test_run_python_syntax_error() -> None:
    """Syntax error produces non-zero exit and stderr."""
    result = run_python("print(  # unclosed paren")
    assert result.exit_code != 0
    assert "SyntaxError" in result.stderr or "Error" in result.stderr


def test_run_python_runtime_error() -> None:
    """Runtime error (e.g. NameError) produces stderr."""
    result = run_python("print(undefined_var)")
    assert result.exit_code != 0
    assert "NameError" in result.stderr or "Error" in result.stderr


def test_run_python_timeout() -> None:
    """Infinite loop triggers timeout (1 second for test speed)."""
    result = run_python("while True: pass", timeout_seconds=1)
    assert result.timed_out is True
    assert result.exit_code == -1
    assert "timed out" in result.stderr.lower() or "timeout" in result.stderr.lower()


def test_run_python_dedent() -> None:
    """Indented code is dedented before execution."""
    code = """
    x = 1
    y = 2
    print(x + y)
    """
    result = run_python(code)
    assert result.exit_code == 0
    assert "3" in result.stdout
