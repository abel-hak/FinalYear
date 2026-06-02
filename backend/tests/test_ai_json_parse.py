import pytest

from app.core.ai import _parse_json_from_llm_text


def test_parse_json_from_plain_object() -> None:
    parsed = _parse_json_from_llm_text('{"title": "loops", "level": 2}')
    assert parsed["title"] == "loops"
    assert parsed["level"] == 2


def test_parse_json_from_markdown_fence() -> None:
    text = """```json
{
  "title": "while loop bug",
  "level": 1
}
```"""
    parsed = _parse_json_from_llm_text(text)
    assert parsed["title"] == "while loop bug"


def test_parse_json_from_prose_and_fence() -> None:
    text = """Here is the quest draft:

```json
{"title": "dict keys", "tags": ["dictionaries"]}
```

Hope that helps."""
    parsed = _parse_json_from_llm_text(text)
    assert parsed["title"] == "dict keys"
    assert parsed["tags"] == ["dictionaries"]


def test_parse_json_rejects_non_object() -> None:
    with pytest.raises(ValueError, match="JSON object"):
        _parse_json_from_llm_text("[1, 2, 3]")
