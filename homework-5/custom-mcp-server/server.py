from fastmcp import FastMCP
from pathlib import Path

mcp = FastMCP("Lorem Ipsum MCP Server")


def _read_words(word_count: int) -> str:
    file_path = Path(__file__).parent / "lorem-ipsum.md"
    text = file_path.read_text(encoding="utf-8")
    words = text.split()
    return " ".join(words[:word_count])


@mcp.resource("lorem://text/{word_count}")
def lorem_resource(word_count: int) -> str:
    """Read word_count words from lorem-ipsum.md"""
    return _read_words(word_count)


@mcp.tool()
def read(word_count: int = 30) -> str:
    """Read word_count words from lorem-ipsum.md (default: 30)"""
    return _read_words(word_count)


if __name__ == "__main__":
    mcp.run()
