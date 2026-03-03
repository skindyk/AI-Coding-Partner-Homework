# Plan: 6-Agent Bug-Fixing Pipeline for Homework-4

## Context

Build a multi-agent pipeline that automates bug fixing for a Node.js/Express API. The demo app (`homework-4/demo-bug-fix/`) has a known bug: `GET /api/users/:id` always returns 404 because `req.params.id` (string) is compared with `===` to numeric IDs in `userController.js:23`. The pipeline will research, verify, plan, fix, security-review, and test — all via Claude Code custom agents.

---

## Phase 1: Setup (directories + test framework)

1. **Create directories:**
   - `.claude/agents/` — Claude Code agent definitions
   - `.claude/skills/research-quality-measurement/` — skill for Agent 2
   - `.claude/skills/unit-tests-FIRST/` — skill for Agent 6
   - `homework-4/agents/` — agent copies for submission
   - `homework-4/skills/` — skill copies for submission
   - `homework-4/demo-bug-fix/bugs/API-404/research/` — research output dir
   - `homework-4/demo-bug-fix/tests/` — test output dir
   - `homework-4/docs/screenshots/` — screenshot dir

2. **Add Jest + Supertest** to `homework-4/demo-bug-fix/package.json`:
   - Add `jest` and `supertest` as devDependencies
   - Update `test` script to `jest --verbose`
   - Run `npm install`

---

## Phase 2: Create 2 Skills

### Skill 1: `research-quality-measurement`
- **Primary**: `.claude/skills/research-quality-measurement/SKILL.md`
- **Copy**: `homework-4/skills/research-quality-measurement.md`
- Defines 5 quality levels: Excellent (5/5) → Insufficient (1/5)
- Evaluation criteria: File Reference Accuracy, Code Snippet Fidelity, Root Cause Correctness, Completeness, Reproduction Validity
- Output format spec for the verifier

### Skill 2: `unit-tests-FIRST`
- **Primary**: `.claude/skills/unit-tests-FIRST/SKILL.md`
- **Copy**: `homework-4/skills/unit-tests-FIRST.md`
- Defines FIRST: Fast (<200ms), Independent (no shared state), Repeatable (no external deps), Self-validating (explicit assertions), Timely (test only changed code)
- Includes Arrange-Act-Assert template and checklist

---

## Phase 3: Create 6 Agents

Each agent is created in **both** `.claude/agents/` (for Claude Code) and `homework-4/agents/` (for submission). Identical content.

### Agent 1: `bug-researcher.agent.md`
- **Tools**: Read, Grep, Glob, Bash (read-only)
- **Input**: `bugs/API-404/bug-context.md` + source code
- **Output**: `bugs/API-404/research/codebase-research.md`
- **Role**: Analyze bug report, trace code flow, identify root cause, document all file:line refs

### Agent 2: `research-verifier.agent.md`
- **Tools**: Read, Grep, Glob, Bash (read-only)
- **Skills**: `research-quality-measurement`
- **Input**: `research/codebase-research.md` + source code
- **Output**: `research/verified-research.md`
- **Role**: Verify every file:line reference, check code snippet accuracy, assign quality level per skill

### Agent 3: `bug-planner.agent.md`
- **Tools**: Read, Grep, Glob, Bash (read-only)
- **Input**: `research/verified-research.md` + source code
- **Output**: `bugs/API-404/implementation-plan.md`
- **Role**: Create step-by-step plan with exact before/after code, test commands, risk assessment

### Agent 4: `bug-implementer.agent.md`
- **Tools**: Read, Write, Edit, Bash, Grep, Glob (**can modify code**)
- **Input**: `bugs/API-404/implementation-plan.md`
- **Output**: `bugs/API-404/fix-summary.md` + actual code changes
- **Role**: Apply planned changes, run tests, document results. Only agent that modifies source.

### Agent 5: `security-verifier.agent.md`
- **Tools**: Read, Grep, Glob, Bash (read-only)
- **Input**: `fix-summary.md` + changed files
- **Output**: `bugs/API-404/security-report.md`
- **Role**: Check for injection, secrets, input validation, type coercion, XSS/CSRF. Rate CRITICAL/HIGH/MEDIUM/LOW/INFO. Report only.

### Agent 6: `unit-test-generator.agent.md`
- **Tools**: Read, Write, Edit, Bash, Grep, Glob
- **Skills**: `unit-tests-FIRST`
- **Input**: `fix-summary.md` + changed files
- **Output**: `bugs/API-404/test-report.md` + `tests/userController.test.js`
- **Role**: Generate tests for changed code only, follow FIRST principles, run tests, document results

---

## Phase 4: Documentation

1. **`homework-4/README.md`** — Project overview, pipeline diagram, agent/skill descriptions, directory structure
2. **`homework-4/HOWTORUN.md`** — Step-by-step: prerequisites, setup, how to invoke each agent, verification
3. **`homework-4/STUDENT.md`** — Student name and course info

---

## Phase 5: Run the Pipeline & Capture Screenshots

Execute agents sequentially (agents 5 & 6 can run in parallel):
```
bug-researcher → research-verifier → bug-planner → bug-implementer → security-verifier + unit-test-generator
```

Capture screenshots at each step into `homework-4/docs/screenshots/`.

---

## Pipeline Execution Flow

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
Agent 4 (Bug Implementer)
    │  creates: fix-summary.md + modifies source code
    ├──────────────┐
    ▼              ▼
Agent 5          Agent 6  ← uses unit-tests-FIRST skill
(Security)       (Tests)
    │              │
    ▼              ▼
security-        test-report.md +
report.md        test files
```

---

## Key Files Modified/Created

| File | Action |
|------|--------|
| `homework-4/demo-bug-fix/package.json` | Add jest + supertest |
| `.claude/agents/*.agent.md` (6 files) | Create |
| `.claude/skills/*/SKILL.md` (2 files) | Create |
| `homework-4/agents/*.agent.md` (6 files) | Create (copies) |
| `homework-4/skills/*.md` (2 files) | Create (copies) |
| `homework-4/README.md` | Create |
| `homework-4/HOWTORUN.md` | Create |
| `homework-4/STUDENT.md` | Create |

---

## Verification

1. Bug exists before pipeline: `curl localhost:3000/api/users/123` → 404
2. All 6 agent files recognized by Claude Code
3. Pipeline runs end-to-end producing all output files
4. Bug fixed after pipeline: `curl localhost:3000/api/users/123` → user object
5. `npm test` passes with generated tests
6. All markdown reports are complete and well-structured
