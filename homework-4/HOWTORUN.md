# How to Run the 6-Agent Bug-Fixing Pipeline

## Prerequisites

- **Node.js** 18+ installed
- **Claude Code** CLI installed and authenticated
- Working directory: repo root (`AI-Coding-Partner-Homework/`)

## Setup

```bash
cd homework-4/demo-bug-fix && npm install && cd ../..
```

---

## Reporting a New Bug

1. Create a folder for the bug under `demo-bug-fix/bugs/`:
   ```bash
   mkdir -p homework-4/demo-bug-fix/bugs/AUTH-500
   ```

2. Write a `bug-context.md` describing the issue:
   ```
   homework-4/demo-bug-fix/bugs/AUTH-500/bug-context.md
   ```
   Include: title, description, steps to reproduce, expected vs actual behavior.

3. Run the pipeline (agents auto-detect the new bug folder).

---

## Running the Pipeline

Agents **auto-detect** which bug folder to process based on which pipeline stage is incomplete.
You can also tell an agent explicitly: *"analyze bugs/AUTH-500"*.

### Step 1 — Bug Researcher
```
/bug-researcher
```
Finds bug folders without `research/codebase-research.md`. Reads the bug report and source code, traces the call path, identifies root cause.

**Output**: `bugs/{BUG-ID}/research/codebase-research.md`

---

### Step 2 — Research Verifier
```
/research-verifier
```
Finds research docs without `verified-research.md`. Checks every file:line reference against source. Assigns quality score (1–5) using the `research-quality-measurement` skill.

**Output**: `bugs/{BUG-ID}/research/verified-research.md`

---

### Step 3 — Bug Planner
```
/bug-planner
```
Finds verified research without `implementation-plan.md`. Creates an exact before/after implementation plan.

**Output**: `bugs/{BUG-ID}/implementation-plan.md`

---

### Step 4 — Bug Implementer
```
/bug-implementer
```
Finds implementation plans without `fix-summary.md`. Applies the code change and runs tests. **Only agent that modifies source code.**

**Output**: `bugs/{BUG-ID}/fix-summary.md` + modified source file(s)

---

### Steps 5 & 6 — Run in parallel (separate Claude sessions)

**Security Verifier:**
```
/security-verifier
```
Finds fix summaries without `security-report.md`. Reviews changed code for vulnerabilities (read-only).

**Output**: `bugs/{BUG-ID}/security-report.md`

**Unit Test Generator:**
```
/unit-test-generator
```
Finds fix summaries without `test-report.md`. Generates FIRST-compliant Jest tests and runs them.

**Output**: `bugs/{BUG-ID}/test-report.md` + `tests/{module}.test.js`

---

## Pipeline State Detection

Each agent knows which stage it handles and checks for incomplete work:

```
bugs/
└── MY-BUG/
    ├── bug-context.md              ← required to start Agent 1
    ├── research/
    │   ├── codebase-research.md   ← created by Agent 1; triggers Agent 2
    │   └── verified-research.md   ← created by Agent 2; triggers Agent 3
    ├── implementation-plan.md      ← created by Agent 3; triggers Agent 4
    ├── fix-summary.md              ← created by Agent 4; triggers Agents 5+6
    ├── security-report.md          ← created by Agent 5
    └── test-report.md              ← created by Agent 6
```

If multiple bugs are in flight simultaneously, agents will list the candidates and ask which one to process.

---

## Verification (API-404 example)

```bash
cd homework-4/demo-bug-fix

# Run unit tests
npm test

# Manual API test
bash ../demo/test-api.sh
```
