# Custom MCP Server — How to Run

## Prerequisites
- Python 3.8+

## 1. Install dependencies

From inside `custom-mcp-server/`:
```bash
pip install -r requirements.txt
```

## 2. Run the server standalone

From the `homework-5/` directory:
```bash
python custom-mcp-server/server.py
```

The server starts in stdio mode and waits for MCP client connections. You won't see output until a client connects.

## 3. Connect to Claude Code

The `mcp.json` file in `homework-5/` configures Claude Code to use this server:

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

To load it, run Claude Code from the `homework-5/` directory, or pass `--mcp-config mcp.json`.

> **Note:** If `python` is not on your PATH, replace `"python"` with the full path to your Python executable (e.g. `"C:/Python311/python.exe"` or `"python3"`).

## 4. Test via Claude

Once connected, ask Claude to:

- Call the `read` tool with default word count:
  > "Call the read tool from the lorem-ipsum MCP server"

- Call `read` with a specific count:
  > "Call read with word_count=50"

- Read a resource directly:
  > "Read the resource lorem://text/20"

## 5. Resources vs Tools — What's the difference?

| Concept | Description | Example |
|---|---|---|
| **Resource** | A URI-addressable data source Claude can read — like a file or API endpoint. Passive; no side effects. | `lorem://text/50` returns 50 words |
| **Tool** | An action Claude can invoke — an active function that may take parameters and perform operations. | `read(word_count=30)` returns 30 words |

In this server both the resource and tool read from the same `lorem-ipsum.md` file, but the resource is accessed by URI (`lorem://text/{word_count}`) while the tool is called by name (`read`) with an optional parameter.
