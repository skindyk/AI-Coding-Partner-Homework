# Banking Pipeline — Copilot Project Instructions

## Project

NodeJS multi-agent banking transaction processing pipeline.
**Author**: Serhii Kindyk

## Stack

- Runtime: Node.js 20+
- Monetary arithmetic: `decimal.js` — NEVER use native `Number` or `parseFloat` for amounts
- Testing: Jest with `--coverage`
- MCP server: `@modelcontextprotocol/sdk` (NodeJS)
- Message IDs: `uuid` (v4)

## Non-negotiable Rules

1. All monetary amounts must use `new Decimal(amount)` — never `parseFloat`, never `Number()`
2. Currency codes validated against ISO 4217 whitelist: `['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']`
3. All agent operations log with ISO 8601 timestamp, agent name, transaction_id, and outcome
4. Account numbers masked in all log output: keep first 4 chars + `****` (e.g. `ACC-****`)
5. Shared directory protocol: `input/` → `processing/` (while working) → `output/` → `results/`
6. Every result file in `shared/results/` must include: `message_id`, `transaction_id`, `status`, `reason` (if rejected), `agent_chain[]`
7. Agent functions must be pure (`processMessage(msg) → msg`) — no filesystem I/O inside agent modules
8. `src/integrator.js` is the only file that reads/writes to the filesystem
9. Integrator uses `process.env.SHARED_DIR || path.join(__dirname, '../shared')` for testability

## Standard Message Format

```json
{
  "message_id": "uuid4-string",
  "timestamp": "2026-03-16T10:00:00Z",
  "source_agent": "transaction-validator",
  "target_agent": "fraud-detector",
  "message_type": "transaction",
  "agent_chain": ["integrator", "transaction-validator"],
  "data": {
    "transaction_id": "TXN001",
    "amount": "1500.00",
    "currency": "USD",
    "status": "validated"
  }
}
```

## Directory Structure

```
homework-6/
├── src/agents/          ← agent modules (pure functions)
├── src/integrator.js    ← orchestrator (handles file I/O)
├── tests/               ← Jest test files
├── shared/              ← runtime message passing
│   ├── input/
│   ├── processing/
│   ├── output/
│   └── results/
├── mcp/server.js        ← MCP server
└── sample-transactions.json
```

## Coverage Gate

Tests must maintain ≥ 80% line/function/branch/statement coverage. The pre-push hook enforces this.
Aim for ≥ 90% where possible.

## Sample Transaction Edge Cases

- TXN006: currency `XYZ` → must be rejected with `INVALID_CURRENCY`
- TXN007: amount `-100.00` → must be rejected with `INVALID_AMOUNT`
- TXN005: `$75,000` wire → fraud score 7 (HIGH), CTR_REQUIRED
- TXN004: timestamp `02:47 UTC`, country `DE` → unusual hour (+2) + cross-border (+1)
- TXN003: destination `ACC-9999` → WATCHLIST_HIT
