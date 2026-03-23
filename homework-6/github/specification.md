# Specification: NodeJS Banking Transaction Processing Pipeline

## 1. Overview

The banking pipeline is a multi-agent NodeJS application that orchestrates the validation, fraud detection, and compliance checking of financial transactions using a pure functional message-passing architecture. The system processes 8 sample transactions through a 3-agent pipeline, produces audit-logged results, and maintains ≥90% test coverage with comprehensive error handling.

## 2. System Architecture

The pipeline follows a **multi-agent message-passing design** where:

- **Integrator** (`src/integrator.js`) — the only component with filesystem I/O — reads transactions from `shared/input/`, routes them through the agent chain, and writes results to `shared/results/`
- **Agents** (`src/agents/`) — pure functions that process and transform messages without side effects
- **Message Protocol** — all communication uses a standardized JSON format with required fields: `message_id` (uuid4), `timestamp` (ISO 8601), `source_agent`, `target_agent`, `message_type`, `agent_chain[]`, and `data` object
- **Shared Directory Protocol** — transactions flow through: `input/` → `processing/` (while working) → `output/` → `results/`

Each agent in the chain receives a message, performs validation or transformation, appends its name to the `agent_chain` array, and passes the enriched message to the next stage. The integrator coordinates the entire flow and persists final results.

## 3. Agent Responsibilities

### Transaction Validator
- **Input**: Raw transaction message with fields: `transaction_id`, `amount`, `currency`, `source_account`, `destination_account`, `transaction_type`, `timestamp`, `metadata`
- **Processing**:
  - Validates required fields are present
  - Uses `decimal.js` to parse and validate amount is positive (> 0)
  - Validates currency code against ISO 4217 whitelist: `['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']`
  - Returns `status: "validated"` on success or `status: "rejected"` with `reason: "INVALID_CURRENCY" | "INVALID_AMOUNT" | "MISSING_FIELD"`
- **Output**: Enriched message with validation status and any rejection reason

### Fraud Detector
- **Input**: Validated transaction message
- **Processing**:
  - Calculates fraud risk score (0–10 scale) based on heuristics:
    - Amount > $10,000: +3 points
    - Amount > $50,000: +4 points (stacks with above)
    - Timestamp between 02:00–05:00 UTC: +2 points (unusual hour)
    - Country metadata not "US": +1 point (cross-border)
    - Destination account `ACC-9999`: +5 points (watchlist hit)
  - Assigns fraud_risk_level: `LOW` (0–2 pts), `MEDIUM` (3–6 pts), `HIGH` (7–10 pts)
  - For wire transfers > $10,000, sets compliance flag `CTR_REQUIRED: true`
- **Output**: Message enriched with `fraud_risk_score`, `fraud_risk_level`, and `ctr_required` flag

### Compliance Checker
- **Input**: Transaction with validation and fraud risk assessment
- **Processing**:
  - Reviews fraud_risk_level and compliance flags
  - Checks if CTR_REQUIRED flag is set; logs requirement if present
  - Validates transaction does not violate risk thresholds (rejects if HIGH + CTR_REQUIRED mismatch)
  - Returns final `status: "approved" | "rejected"` and `compliance_notes` array
- **Output**: Message with compliance assessment, ready for settlement or rejection

## 4. Message Format & Protocol

All messages conform to this standard structure:

```json
{
  "message_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-03-16T10:00:00Z",
  "source_agent": "transaction-validator",
  "target_agent": "fraud-detector",
  "message_type": "transaction",
  "agent_chain": ["integrator", "transaction-validator"],
  "data": {
    "transaction_id": "TXN001",
    "source_account": "ACC-1001",
    "destination_account": "ACC-2001",
    "amount": "1500.00",
    "currency": "USD",
    "transaction_type": "transfer",
    "timestamp": "2026-03-16T09:00:00Z",
    "status": "validated",
    "metadata": {
      "channel": "online",
      "country": "US"
    }
  }
}
```

**Required Fields**:
- `message_id` (string, uuid4): Unique identifier for tracking
- `timestamp` (string, ISO 8601): Processing timestamp
- `source_agent` (string): Agent that created the message
- `target_agent` (string): Next agent in the pipeline
- `message_type` (string): Fixed value `"transaction"`
- `agent_chain` (array): Cumulative list of agents that have processed this message
- `data` (object): Transaction details and processing results

**Final Result Files** (written to `shared/results/TXN[ID].json`) must include:
- `message_id`, `transaction_id`, `status` (approved/rejected)
- `reason` (if rejected, one of: `INVALID_CURRENCY`, `INVALID_AMOUNT`, `MISSING_FIELD`, `COMPLIANCE_VIOLATION`, `WATCHLIST_HIT`)
- `agent_chain` (full processing path)
- `fraud_risk_score` and `fraud_risk_level` (if assessed)
- All transaction details with masked account numbers (format: first 4 chars + `****`, e.g., `ACC-****`)

## 5. Error Handling & Validation

### Decimal.js Monetary Arithmetic
- **Rule**: ALL amounts must be instantiated as `new Decimal(value)` from `decimal.js` — never use native `Number()`, `parseFloat()`, or floating-point arithmetic
- **Rationale**: Prevents rounding errors in financial calculations; ensures precision and audit trail compliance

### ISO 4217 Currency Whitelist
- **Allowed codes**: `['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']`
- **Rejection criterion**: Any currency outside this list is rejected with `status: "rejected"` and `reason: "INVALID_CURRENCY"`
- **Test case**: TXN006 (`currency: "XYZ"`) must fail validation

### Amount Validation
- **Rule**: Amount must be positive (> 0) when converted to Decimal
- **Rejection criterion**: Zero, negative, or non-numeric amounts are rejected with `status: "rejected"` and `reason: "INVALID_AMOUNT"`
- **Test case**: TXN007 (`amount: "-100.00"`) must fail validation

### PII Masking
- **Rule**: All account numbers in log output and result files must be masked
- **Format**: Keep first 4 characters + `****` (e.g., `ACC-1001` → `ACC-****`)
- **Applies to**: `source_account`, `destination_account` in audit logs and result files

### Audit Logging
- **Every agent operation** logs with: ISO 8601 `timestamp`, `agent_name`, `transaction_id`, processing `outcome` (success/failure), and masked `account_numbers`
- **Audit log location**: Internal agent logs; integrator maintains file-based audit trail
- **Latency requirement**: Logging must complete within 100ms of agent processing (where practical)

### Result File Structure
- **Location**: `shared/results/TXN[ID].json` for each processed transaction
- **Mandatory fields**: `message_id`, `transaction_id`, `status`, `agent_chain[]`
- **Conditional fields**: `reason` (if rejected), `fraud_risk_score`, `fraud_risk_level`, `ctr_required`, `compliance_notes`
- **All 8 sample transactions** must produce result files after pipeline execution

### Success Criteria
- All 8 transactions in `sample-transactions.json` are processed
- TXN006 (invalid currency) and TXN007 (negative amount) are rejected with correct reasons
- TXN005 ($75,000 wire) receives fraud_risk_level `HIGH` and compliance flag `CTR_REQUIRED: true`
- TXN004 (02:47 UTC, DE country) receives ≥2 bonus fraud points for unusual hour, ≥1 for cross-border
- TXN003 (destination ACC-9999) receives watchlist hit (+5 fraud points)
- Result files in `shared/results/` include all required fields with masked account numbers
- Test coverage ≥90% (line, branch, function, and statement coverage combined)
