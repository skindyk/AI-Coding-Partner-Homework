# Homework 4: 6-Agent Bug-Fixing Pipeline

## Overview

This project implements a **6-agent automated bug-fixing pipeline** available in **two flavours**:

| Flavour | Runtime | Location |
|---------|---------|----------|
| **Claude Code** | Claude Code CLI | `.claude/agents/` + `.claude/skills/` |
| **GitHub Copilot** | VS Code Copilot Chat | `.github/agents/` + `.github/skills/` |

Both pipelines share the same 6 agents, 2 skills, and bug-folder conventions. The GitHub Copilot version adds **handoff buttons** that appear in the chat UI to guide the user from one agent to the next.

## The Bug

**Endpoint**: `GET /api/users/:id`
**Symptom**: Always returns 404 even for valid user IDs
**Root Cause**: `req.params.id` is a string, but user IDs in the array are numbers. The strict equality check (`===`) at `src/controllers/userController.js:23` always fails because `"123" !== 123`.

## Pipeline Diagram

```
Agent 1 (Bug Researcher)
    │  creates: codebase-research.md
    ▼
Agent 2 (Research Verifier)  ← uses research-quality-measurement skill
    │  creates: verified-research.md
    ▼
Agent 3 (Bug Planner)
    │  creates: implementation-plan.md
    ▼
Agent 4 (Bug Implementer)        ← ONLY agent that modifies source code
    │  creates: fix-summary.md + modifies userController.js
    ├──────────────────┐
    ▼                  ▼
Agent 5               Agent 6   ← uses unit-tests-FIRST skill
(Security Verifier)   (Unit Test Generator)
    │                  │
    ▼                  ▼
security-report.md    test-report.md +
                      tests/userController.test.js
```

---

## Option A — Claude Code

### Agents

| Agent | File | Role | Tools |
|-------|------|------|-------|
| Bug Researcher | `agents/bug-researcher.agent.md` | Traces code flow, identifies root cause | Read, Grep, Glob, Bash (read-only) |
| Research Verifier | `agents/research-verifier.agent.md` | Fact-checks research, assigns quality score | Read, Grep, Glob, Bash (read-only) |
| Bug Planner | `agents/bug-planner.agent.md` | Creates step-by-step fix plan | Read, Grep, Glob, Bash (read-only) |
| Bug Implementer | `agents/bug-implementer.agent.md` | Applies changes, runs tests | Read, Write, Edit, Bash, Grep, Glob |
| Security Verifier | `agents/security-verifier.agent.md` | Reviews changed code for vulnerabilities | Read, Grep, Glob, Bash (read-only) |
| Unit Test Generator | `agents/unit-test-generator.agent.md` | Generates FIRST-compliant tests | Read, Write, Edit, Bash, Grep, Glob |

### Skills

| Skill | File | Used By | Purpose |
|-------|------|---------|---------|
| Research Quality Measurement | `skills/research-quality-measurement.md` | Research Verifier | Standardized 5-level quality scoring |
| Unit Tests FIRST | `skills/unit-tests-FIRST.md` | Unit Test Generator | FIRST principles for unit test quality |

### Runtime locations

```
.claude/
├── agents/           ← 6 agent files (Claude Code picks these up automatically)
└── skills/
    ├── research-quality-measurement/SKILL.md
    └── unit-tests-FIRST/SKILL.md
```

---

## Option B — GitHub Copilot

### Agents

Same 6 agents, adapted with Copilot-specific frontmatter:
- **Tools**: `codebase`, `editFiles`, `runCommands`, `runTests`, `findTestFiles`, `fetch`
- **Model**: `Claude Haiku 4.5 (copilot)`
- **Handoffs**: buttons in Copilot Chat guide the user to the next agent automatically

| Handoff | From → To |
|---------|-----------|
| → Verify Research | Bug Researcher → Research Verifier |
| → Create Implementation Plan | Research Verifier → Bug Planner |
| → Apply the Fix | Bug Planner → Bug Implementer |
| → Security Review | Bug Implementer → Security Verifier |
| → Generate Tests | Bug Implementer → Unit Test Generator |

### Skills

Skills use the `SKILL.md` format (open `agentskills.io` standard), loaded on-demand by Copilot when the agent invokes `/skill-name`:

| Skill | Directory | Invoked by |
|-------|-----------|-----------|
| `/research-quality-measurement` | `copilot-skills/research-quality-measurement/` | Research Verifier |
| `/unit-tests-FIRST` | `copilot-skills/unit-tests-FIRST/` | Unit Test Generator |

### Runtime locations

```
.github/
├── agents/           ← 6 agent files (Copilot picks these up automatically)
└── skills/
    ├── research-quality-measurement/SKILL.md
    └── unit-tests-FIRST/SKILL.md
```

---

## Directory Structure

```
homework-4/
├── README.md
├── HOWTORUN.md
├── STUDENT.md
│
├── agents/                        ← Claude Code agents (submission copy)
│   ├── bug-researcher.agent.md
│   ├── research-verifier.agent.md
│   ├── bug-planner.agent.md
│   ├── bug-implementer.agent.md
│   ├── security-verifier.agent.md
│   └── unit-test-generator.agent.md
├── skills/                        ← Claude Code skills (submission copy)
│   ├── research-quality-measurement.md
│   └── unit-tests-FIRST.md
│
├── .github/
│   ├── agents/                    ← GitHub Copilot agents (Copilot picks these up automatically)
│   │   ├── bug-researcher.agent.md
│   │   ├── research-verifier.agent.md
│   │   ├── bug-planner.agent.md
│   │   ├── bug-implementer.agent.md
│   │   ├── security-verifier.agent.md
│   │   └── unit-test-generator.agent.md
│   └── skills/                    ← GitHub Copilot skills
│       ├── research-quality-measurement/SKILL.md
│       └── unit-tests-FIRST/SKILL.md
│
├── demo-bug-fix/
│   ├── server.js
│   ├── package.json
│   ├── src/
│   │   ├── controllers/
│   │   │   └── userController.js      ← bug is here (line 23, fixed)
│   │   └── routes/
│   │       └── users.js
│   ├── bugs/
│   │   └── API-404/
│   │       ├── bug-context.md          ← bug report
│   │       ├── research/
│   │       │   ├── codebase-research.md   ← Agent 1 output
│   │       │   └── verified-research.md   ← Agent 2 output
│   │       ├── implementation-plan.md     ← Agent 3 output
│   │       ├── fix-summary.md             ← Agent 4 output
│   │       ├── security-report.md         ← Agent 5 output
│   │       └── test-report.md             ← Agent 6 output
│   └── tests/
│       └── userController.test.js         ← Agent 6 output
│
├── demo/
│   ├── run.sh                     ← starts the API server
│   └── test-api.sh                ← 8 curl-based API tests
│
└── docs/
    └── screenshots/
```

## Agent Output Files

After running the full pipeline:

| Output File | Created By |
|-------------|-----------|
| `bugs/API-404/research/codebase-research.md` | Agent 1: Bug Researcher |
| `bugs/API-404/research/verified-research.md` | Agent 2: Research Verifier |
| `bugs/API-404/implementation-plan.md` | Agent 3: Bug Planner |
| `bugs/API-404/fix-summary.md` | Agent 4: Bug Implementer |
| `bugs/API-404/security-report.md` | Agent 5: Security Verifier |
| `bugs/API-404/test-report.md` | Agent 6: Unit Test Generator |
| `tests/userController.test.js` | Agent 6: Unit Test Generator |
