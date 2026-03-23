# Homework 6: GitHub Copilot Multi-Agent Banking Pipeline

## Context

Build a GitHub Copilot agent workflow in VS Code (NodeJS) that implements the Homework 6 capstone:
4 meta-agents that together create a banking transaction processing system from scratch.
The user is **not** manually writing the pipeline code — the agents do it when invoked.

Architecture: **Orchestrator + Workers** with Copilot handoffs (user-chosen).
Directory layout: **Full Copilot `.github/`** (user-chosen).

---

## File Manifest

All paths relative to `homework-6/`.

```
.github/
├── copilot-instructions.md           # Global project context injected into every agent
├── agents/
│   ├── pipeline-orchestrator.agent.md   # Master agent — dispatches to 4 workers via handoffs
│   ├── spec-writer.agent.md             # Task 1 — writes specification.md + agents.md
│   ├── code-generator.agent.md          # Task 2 — generates NodeJS pipeline source + research-notes.md
│   ├── test-generator.agent.md          # Task 3 — generates Jest tests, verifies ≥80% coverage
│   └── doc-generator.agent.md           # Task 5 — writes README.md + HOWTORUN.md
├── prompts/
│   ├── write-spec.prompt.md
│   ├── run-pipeline.prompt.md
│   └── validate-transactions.prompt.md
└── skills/
    ├── write-spec/SKILL.md
    ├── run-pipeline/SKILL.md
    └── validate-transactions/SKILL.md
.vscode/
└── settings.json                     # Coverage gate hook (Claude Code format, blocks push < 80%)
mcp/
└── server.js                         # NodeJS MCP server (get_transaction_status, list_pipeline_results, pipeline://summary)
mcp.json                              # context7 + pipeline-status MCP config
package.json                          # Jest config (coverageThreshold 80%), scripts, dependencies
src/
├── agents/
│   ├── transactionValidator.js
│   ├── fraudDetector.js
│   └── complianceChecker.js
└── integrator.js
tests/
├── transactionValidator.test.js
├── fraudDetector.test.js
├── complianceChecker.test.js
└── integration.test.js
specification.md                      # Agent 1 output
agents.md                             # Agent 1 output
research-notes.md                     # Agent 2 output (2 context7 queries)
README.md                             # Agent 4 output (must include "Serhii Kindyk")
HOWTORUN.md                           # Agent 4 output
docs/screenshots/                     # 5 screenshots (manual)
```

---

## Phase 1 — Copilot Infrastructure

### 1.1 `.github/copilot-instructions.md`
Global rules injected into every session:
- Author: Serhii Kindyk
- Stack: Node.js 20+, decimal.js, Jest, @modelcontextprotocol/sdk
- Non-negotiables: `new Decimal()` for all amounts (never float), ISO 4217 currency whitelist, ISO 8601 logging, PII masking, shared directory protocol
- Standard message JSON format (from TASKS.md)

### 1.2 `pipeline-orchestrator.agent.md`
```yaml
---
name: pipeline-orchestrator
description: Orchestrates all 4 pipeline agents. Say "build the banking pipeline".
tools: [read/readFile, search/codebase]
model: gpt-4o
agents: [spec-writer, code-generator, test-generator, doc-generator]
handoffs:
  - label: "→ Step 1: Write Specification"
    agent: spec-writer
    prompt: "Write specification.md (5 sections) and agents.md using specification-TEMPLATE-hint.md. Pipeline must include Transaction Validator, Fraud Detector, Compliance Checker."
    send: true
  - label: "→ Step 2: Generate Pipeline Code"
    agent: code-generator
    prompt: "specification.md exists. Generate src/agents/transactionValidator.js, fraudDetector.js, complianceChecker.js and src/integrator.js in NodeJS. Use context7 MCP to look up decimal.js. Document 2 queries in research-notes.md."
    send: true
  - label: "→ Step 3: Generate Tests"
    agent: test-generator
    prompt: "Pipeline source is ready. Generate Jest tests in tests/ for all 3 agents + 1 integration test. Target 90% coverage. Run npm test and report results."
    send: true
  - label: "→ Step 4: Generate Documentation"
    agent: doc-generator
    prompt: "Tests pass. Generate README.md (author: Serhii Kindyk, ASCII diagram, tech stack table) and HOWTORUN.md."
    send: true
---
```
Instructions: check `sample-transactions.json` exists, show buttons in sequence, report completion summary.

### 1.3 `spec-writer.agent.md`
Tools: readFile, createFile, editFiles. Reads `specification-TEMPLATE-hint.md` + `sample-transactions.json`, writes `specification.md` (5 required sections) + `agents.md`. Handoff back to orchestrator.

### 1.4 `code-generator.agent.md`
Tools: readFile, createFile, createDirectory, runInTerminal. Reads spec, queries context7 twice (decimal.js, uuid), creates `package.json` + all `src/` files + `research-notes.md`, runs `npm install`. Handoff back to orchestrator.

### 1.5 `test-generator.agent.md`
Tools: readFile, createFile, runInTerminal. Reads src/ files, creates all test files, runs `npm test --coverage`, fixes if below 80%. Handoff back to orchestrator.

### 1.6 `doc-generator.agent.md`
Tools: readFile, createFile. Creates `README.md` (with "Serhii Kindyk", ASCII diagram, tech stack table) and `HOWTORUN.md`. No return handoff needed.

---

## Phase 2 — Skills & Prompts

### Prompt files (`.github/prompts/*.prompt.md`)
- **write-spec**: `agent: spec-writer` — generates spec from template
- **run-pipeline**: `agent: pipeline-orchestrator` — clear shared/, run `npm run pipeline`, show summary
- **validate-transactions**: `agent: pipeline-orchestrator` — dry-run validator only, render results table

### Skill files (`.github/skills/*/SKILL.md`)
Same 3 skills as slash commands. SKILL.md format:
```yaml
---
name: run-pipeline
description: Run the multi-agent banking pipeline end-to-end
---
Steps: 1. Check sample-transactions.json, 2. Clear shared/, 3. npm run pipeline, 4. Show summary
```

---

## Phase 3 — Coverage Gate Hook

### `.vscode/settings.json`
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'git push'; then cd homework-6 && npm test -- --coverage --coverageThreshold='{\"global\":{\"lines\":80}}' || (echo 'BLOCKED: Coverage below 80%' && exit 1); fi"
          }
        ]
      }
    ]
  }
}
```

---

## Phase 4 — MCP Server

### `mcp.json`
```json
{
  "mcpServers": {
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp@latest"] },
    "pipeline-status": { "command": "node", "args": ["mcp/server.js"] }
  }
}
```

### `mcp/server.js` (NodeJS, CommonJS)
Uses `@modelcontextprotocol/sdk`:
- Tool `get_transaction_status(transaction_id)` — reads `shared/results/{id}.json`, returns status/fraud/compliance/agent_chain
- Tool `list_pipeline_results()` — reads all `shared/results/*.json`, returns summary array
- Resource `pipeline://summary` — text summary (total/approved/rejected/on-hold counts)

---

## Phase 5 — Pipeline Source Code

### Key design principle: Pure functions for testability
Each agent exports `processMessage(message) → message` — no filesystem I/O inside the function. The integrator handles all file reads/writes. This gives 90%+ coverage without filesystem mocking.

### `src/agents/transactionValidator.js`
- REQUIRED_FIELDS: `['transaction_id', 'timestamp', 'source_account', 'destination_account', 'amount', 'currency']`
- Currency whitelist: `['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']`
- Uses `new Decimal(amount).lte(0)` to catch negative/zero
- Returns `{...message, data: {...tx, status: 'rejected', reason: 'INVALID_CURRENCY'}}` etc.
- Logs: `[ISO8601] [transaction-validator] TXN001 → validated` (accounts masked)

### `src/agents/fraudDetector.js`
Scoring: `>$10k: +3pts`, `>$50k: +4 more (total 7)`, `hour 02–04 UTC: +2pts`, `cross-border: +1pt`
Levels: `0–2=LOW, 3–6=MEDIUM, 7+=HIGH`
Annotates (never rejects) — adds `fraud_risk_score`, `fraud_risk_level` to data.

### `src/agents/complianceChecker.js`
Flags: `wire >$10k → CTR_REQUIRED`, `HIGH fraud → FRAUD_REVIEW`, `ACC-9999 → WATCHLIST_HIT`
Status: `approved` (no flags) or `compliance_hold`

### `src/integrator.js`
1. Create `shared/{input,processing,output,results}/` dirs
2. Read `sample-transactions.json`
3. For each tx: build message envelope (`message_id: uuidv4()`)
4. Call validator → if rejected, write to results, skip rest
5. Call fraudDetector → call complianceChecker
6. Write final to `shared/results/{transaction_id}.json` with `agent_chain[]`
7. Print summary: 8 processed, N approved, 2 rejected, N compliance_hold
8. Uses `process.env.SHARED_DIR || path.join(__dirname, '../shared')` for testability

### `package.json` key sections
```json
{
  "scripts": {
    "pipeline": "node src/integrator.js",
    "test": "jest --coverage"
  },
  "dependencies": {
    "decimal.js": "^10.4.3",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": { "jest": "^29.0.0" },
  "jest": {
    "coverageThreshold": { "global": { "lines": 80, "functions": 80, "branches": 80 } },
    "collectCoverageFrom": ["src/**/*.js"]
  }
}
```

---

## Phase 6 — Tests

### Coverage map
| File | Test file | Key branches |
|---|---|---|
| transactionValidator.js | tests/transactionValidator.test.js | 6 missing-field cases, negative amt, zero amt, invalid currency, 6 valid currencies |
| fraudDetector.js | tests/fraudDetector.test.js | >$10k, >$50k, hour 02–04, cross-border, all 3 risk level thresholds |
| complianceChecker.js | tests/complianceChecker.test.js | CTR, FRAUD_REVIEW, WATCHLIST_HIT, multiple flags, clean tx |
| integrator.js | tests/integration.test.js | full 8-tx run with temp SHARED_DIR, assert TXN006 rejected, TXN005 HIGH |

All unit tests call `processMessage()` directly — no fs mocking needed.
Integration test uses `process.env.SHARED_DIR` pointing to a temp dir.

### Expected sample-transaction outcomes
| ID | Expected |
|---|---|
| TXN001 | approved (USD $1,500 LOW risk) |
| TXN002 | compliance_hold (CTR_REQUIRED, $25k wire) |
| TXN003 | compliance_hold (WATCHLIST_HIT ACC-9999) |
| TXN004 | approved (EUR $500, MEDIUM fraud — no compliance flag) |
| TXN005 | compliance_hold (HIGH fraud + CTR_REQUIRED, $75k) |
| TXN006 | rejected (INVALID_CURRENCY: XYZ) |
| TXN007 | rejected (INVALID_AMOUNT: -100.00) |
| TXN008 | approved (USD $3,200 LOW risk) |

---

## Phase 7 — Deliverable Documents

- **`specification.md`**: 5 sections, produced by spec-writer agent
- **`agents.md`**: 4 meta-agents + 3 pipeline agents described, produced by spec-writer agent
- **`research-notes.md`**: 2 context7 queries (decimal.js + uuid), produced by code-generator agent
- **`README.md`**: Must contain "Serhii Kindyk", ASCII pipeline diagram, tech stack table, agent bullets
- **`HOWTORUN.md`**: Numbered steps from `npm install` to running agents and MCP tools
- **`docs/screenshots/`**: 5 screenshots captured manually during demo

---

## Verification

```bash
# 1. Run pipeline
cd homework-6 && npm install && npm run pipeline
ls shared/results/    # expect 8 .json files

# 2. Tests + coverage gate
npm test -- --coverage    # expect ≥80% all metrics

# 3. MCP server
node mcp/server.js    # should start without error

# 4. Author check
grep "Serhii Kindyk" README.md    # must match

# 5. Agent structure check
ls .github/agents/    # 5 .agent.md files
ls .github/skills/    # 3 SKILL.md dirs
cat mcp.json          # context7 + pipeline-status both present
```

---

## Build Order

1. `.github/copilot-instructions.md`
2. All 5 `.agent.md` files
3. All 3 `.prompt.md` files
4. All 3 `SKILL.md` files
5. `.vscode/settings.json` (coverage gate)
6. `mcp.json`
7. `mcp/server.js`
8. `package.json`
9. `src/agents/transactionValidator.js`
10. `src/agents/fraudDetector.js`
11. `src/agents/complianceChecker.js`
12. `src/integrator.js`
13. `npm install`
14. `tests/transactionValidator.test.js`
15. `tests/fraudDetector.test.js`
16. `tests/complianceChecker.test.js`
17. `tests/integration.test.js`
18. Run `npm test` — verify gate passes
19. `specification.md`
20. `agents.md`
21. `research-notes.md`
22. `README.md`
23. `HOWTORUN.md`
24. `docs/screenshots/` dir (screenshots manually)
