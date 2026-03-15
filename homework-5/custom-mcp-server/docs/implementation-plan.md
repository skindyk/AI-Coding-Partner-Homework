# Plan: Custom MCP Server with FastMCP (Homework 5, Task 4)

## Context
Homework 5, Task 4 requires building a custom MCP server using FastMCP (Python) that exposes a Resource URI and a Tool. The server reads from `lorem-ipsum.md` and returns a configurable number of words. The `custom-mcp-server/` folder already exists but is empty.

## Files to Create

All files go inside `homework-5/custom-mcp-server/` (and one config at `homework-5/`):

| File | Purpose |
|---|---|
| `server.py` | Main FastMCP server |
| `lorem-ipsum.md` | Source text for resource output |
| `requirements.txt` | Dependencies (must include `fastmcp`) |
| `HOWTORUN.md` | Install, run, connect, and test instructions |
| `../mcp.json` | MCP client config pointing to the server |

---

## Implementation Plan

### Step 1: `lorem-ipsum.md`
Create a standard Lorem Ipsum text file with at least 200+ words so any `word_count` value up to the default or higher is satisfiable.

### Step 2: `requirements.txt`
```
fastmcp
```

### Step 3: `server.py`
Use FastMCP with:

**Resource** — URI template `lorem://text/{word_count}` where `word_count` is a path parameter (integer, default handled in tool). The resource function:
1. Opens `lorem-ipsum.md` (relative to the script's directory)
2. Splits text into words
3. Returns the first `word_count` words joined as a string

```python
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

@mcp.tool
def read(word_count: int = 30) -> str:
    """Read word_count words from lorem-ipsum.md (default: 30)"""
    return _read_words(word_count)

if __name__ == "__main__":
    mcp.run()
```

### Step 4: `homework-5/mcp.json`
MCP configuration for Claude Code (stdio transport):
```json
{
  "mcpServers": {
    "lorem-ipsum": {
      "command": "python",
      "args": ["custom-mcp-server/server.py"]
    }
  }
}
```
> Note: If `python` is not on PATH, the user may need to use the full Python path or `python3`.

### Step 5: `HOWTORUN.md`
Document:
1. **Install**: `pip install -r requirements.txt` (inside `custom-mcp-server/`)
2. **Run standalone**: `python custom-mcp-server/server.py` (from `homework-5/`)
3. **Connect**: Add `mcp.json` config to the MCP client (Claude Code reads `.mcp.json` or `mcp.json` in the project root)
4. **Test**: Use Claude to call the `read` tool with or without `word_count`; or read the resource `lorem://text/50`
5. **Explanation of Resources vs Tools**:
   - Resources: URIs Claude can read (like files or API endpoints) — passive data sources
   - Tools: Actions Claude can invoke to perform operations — active functions

---

## Key Design Decisions
- **`_read_words` helper**: Shared between resource and tool to avoid code duplication
- **`Path(__file__).parent`**: Makes the server portable — finds `lorem-ipsum.md` relative to `server.py` regardless of working directory
- **stdio transport**: Default for `mcp.run()`, which is what MCP clients like Claude Code expect
- **URI template `lorem://text/{word_count}`**: FastMCP supports path parameters in resource URIs via `{param}` syntax

---

## Verification Steps
1. `python custom-mcp-server/server.py` starts without errors
2. MCP client (Claude Code) picks up `mcp.json` from `homework-5/`
3. Claude can call `read()` → returns 30 words
4. Claude can call `read(word_count=50)` → returns 50 words
5. Claude can read resource `lorem://text/20` → returns 20 words
6. Take screenshots of each successful MCP call for deliverables
