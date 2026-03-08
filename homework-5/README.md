# Homework 5: Configure MCP Servers

> **Student Name**: Serhii Kindyk
> **Date Submitted**: 03/08/2026
> **AI Tools Used**: Claude Code (mcp implementation), GitHub Copilot mcp testing

---

## Overview

This homework configures **three external MCP servers** (GitHub, Filesystem, Atlassian) and implements **one custom MCP server** using FastMCP (Python). Each server was connected to GitHub Copilot, tested with a real interaction, and documented with screenshots.

---

## Tasks Completed

### Task 1: GitHub MCP

Configured the official GitHub MCP server. Used it to interact with this repository — summarizing commits.

**Screenshot**: `docs/screenshots/github/`

---

### Task 2: Filesystem MCP

Configured the Filesystem MCP server with a local project directory path. Used it to list allowed resources.

**Screenshot**: `docs/screenshots/filesystem/`

---

### Task 3: Jira (Atlassian) MCP

Configured the Atlassian MCP server. Queried the last 5 bug tickets from a real TestRail MCP project.

**Screenshot**: `docs/screenshots/atlassian/`

---

### Task 4: Custom MCP Server with FastMCP

Built a custom Python MCP server using **FastMCP** that exposes:

- **Resource** — URI template `lorem://text/{word_count}`: reads `lorem-ipsum.md` and returns the first `word_count` words
- **Tool** — `read(word_count=30)`: same logic

**Key design decisions:**
- `Path(__file__).parent` makes the server portable — locates `lorem-ipsum.md` relative to `server.py` regardless of working directory
- `_read_words()` helper is shared between resource and tool to avoid duplication
- stdio transport (FastMCP default) is used, which is what Claude Code expects

**Resources vs Tools:**
- **Resources** are URI-addressable data sources Claude can read passively (like files or API endpoints) — no side effects
- **Tools** are active functions Claude can invoke with parameters to perform operations

**Screenshots**: `custom-mcp-server/docs/screenshots/`

---

## Directory Structure

```
homework-5/
├── README.md                          ← This file
├── TASKS.md                           ← Assignment specification
├── mcp.json                           ← MCP client config for Claude Code
├── docs/
│   └── screenshots/
│       ├── github/                    ← Task 1 screenshots
│       ├── filesystem/                ← Task 2 screenshots
│       └── atlassian/                 ← Task 3 screenshots
└── custom-mcp-server/                 ← Task 4: custom FastMCP server
    ├── server.py                      ← FastMCP server (resource + tool)
    ├── lorem-ipsum.md                 ← Source text for the resource
    ├── requirements.txt               ← Python dependencies (fastmcp)
    ├── HOWTORUN.md                    ← Setup, run, connect, and test guide
    └── docs/
        ├── implementation-plan.md
        └── screenshots/               ← Task 4 screenshots
```

---

## Quick Start (Custom MCP Server)

```bash
cd homework-5/custom-mcp-server
pip install -r requirements.txt
cd ..
python custom-mcp-server/server.py
```

For full setup and connection instructions, see [custom-mcp-server/HOWTORUN.md](custom-mcp-server/HOWTORUN.md).

---

<div align="center">

*This project was completed as part of the AI-Assisted Development course.*

</div>
