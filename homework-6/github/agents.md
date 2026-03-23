# Agents Manifest — Banking Pipeline

## Overview

The banking pipeline consists of **3 core transaction-processing agents** that form the primary processing chain. Each agent is a pure-functional Node.js module that conforms to the standard message interface.

---

## Core Transaction Agents

### 1. Transaction Validator

**File**: `src/agents/transaction-validator.js`  
**Export Function**: `processMessage(message)`

**Role**: First-stage gatekeeper that validates transaction structure and basic compliance rules.

**Input Contract**:
```json
{
  "message_id": "uuid",
  "timestamp": "ISO 8601",
  "source_agent": "integrator",
  "target_agent": "transaction-validator",
  "message_type": "transaction",
  "agent_chain": ["integrator"],
  "data": {
    "transaction_id": "TXN001",
    "amount": "1500.00",
    "currency": "USD",
    "source_account": "ACC-1001",
    "destination_account": "ACC-2001",
    "transaction_type": "transfer",
    "timestamp": "2026-03-16T09:00:00Z",
    "metadata": {"channel": "online", "country": "US"}
  }
}
```

**Processing Steps**:
1. Verify required fields: `transaction_id`, `amount`, `currency`, `source_account`, `destination_account`, `transaction_type`
2. Parse `amount` using `decimal.js` → `new Decimal(amount)`
3. Validate amount > 0 (reject if ≤ 0 with reason `INVALID_AMOUNT`)
4. Validate `currency` against ISO 4217 whitelist: `['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']` (reject if not in list with reason `INVALID_CURRENCY`)
5. If all pass: set `data.status = "validated"`, else: set `status = "rejected"` and add `reason` field

**Output Contract**:
```json
{
  "message_id": "uuid",
  "timestamp": "ISO 8601",
  "source_agent": "transaction-validator",
  "target_agent": "fraud-detector",
  "message_type": "transaction",
  "agent_chain": ["integrator", "transaction-validator"],
  "data": {
    "transaction_id": "TXN001",
    "amount": "1500.00",
    "currency": "USD",
    "source_account": "ACC-1001",
    "destination_account": "ACC-2001",
    "transaction_type": "transfer",
    "timestamp": "2026-03-16T09:00:00Z",
    "status": "validated",
    "reason": null,
    "metadata": {"channel": "online", "country": "US"}
  }
}
```

**Example Rejection** (TXN006 - invalid currency XYZ):
```json
{
  "data": {
    "transaction_id": "TXN006",
    "status": "rejected",
    "reason": "INVALID_CURRENCY",
    "currency": "XYZ"
  },
  "agent_chain": ["integrator", "transaction-validator"]
}
```

---

### 2. Fraud Detector

**File**: `src/agents/fraud-detector.js`  
**Export Function**: `processMessage(message)`

**Role**: Scores transactions for fraud risk and flags compliance requirements based on heuristic analysis.

**Input Contract**: Message with `status === "validated"` from Transaction Validator

**Processing Steps**:
1. Extract `amount` (as Decimal), `currency`, `transaction_type`, `timestamp`, and `metadata.country`
2. Initialize `fraud_risk_score = 0`
3. Apply scoring rules:
   - `amount > 10000`: +3 points
   - `amount > 50000`: +4 points (additional to above)
   - `timestamp` hour in [02–05] UTC: +2 points
   - `metadata.country !== "US"`: +1 point
   - `destination_account === "ACC-9999"`: +5 points (watchlist hit)
4. Calculate `fraud_risk_level`:
   - 0–2 points: `"LOW"`
   - 3–6 points: `"MEDIUM"`
   - 7–10 points: `"HIGH"`
5. Set `ctr_required = true` if `transaction_type === "wire_transfer"` AND `amount > 10000`
6. Add fields to `data`: `fraud_risk_score`, `fraud_risk_level`, `ctr_required`
7. Append `"fraud-detector"` to `agent_chain`

**Output Contract**:
```json
{
  "message_id": "uuid",
  "timestamp": "ISO 8601",
  "source_agent": "fraud-detector",
  "target_agent": "compliance-checker",
  "message_type": "transaction",
  "agent_chain": ["integrator", "transaction-validator", "fraud-detector"],
  "data": {
    "transaction_id": "TXN001",
    "amount": "1500.00",
    "currency": "USD",
    "source_account": "ACC-1001",
    "destination_account": "ACC-2001",
    "transaction_type": "transfer",
    "status": "validated",
    "fraud_risk_score": 0,
    "fraud_risk_level": "LOW",
    "ctr_required": false,
    "metadata": {"channel": "online", "country": "US"}
  }
}
```

**Example: TXN005** ($75,000 wire_transfer, expects HIGH risk + CTR_REQUIRED):
```json
{
  "data": {
    "transaction_id": "TXN005",
    "amount": "75000.00",
    "fraud_risk_score": 7,
    "fraud_risk_level": "HIGH",
    "ctr_required": true,
    "transaction_type": "wire_transfer"
  }
}
```

**Example: TXN004** (02:47 UTC, country DE, expects unusual hour + cross-border):
- Hour check (02:47): +2 points
- Cross-border (DE ≠ US): +1 point
- Result: `fraud_risk_score: 3`, `fraud_risk_level: "MEDIUM"`

**Example: TXN003** (destination ACC-9999, expects watchlist hit):
```json
{
  "data": {
    "transaction_id": "TXN003",
    "destination_account": "ACC-9999",
    "fraud_risk_score": 5,
    "fraud_risk_level": "MEDIUM"
  }
}
```

---

### 3. Compliance Checker

**File**: `src/agents/compliance-checker.js`  
**Export Function**: `processMessage(message)`

**Role**: Final validation stage that reviews fraud assessment and enforces compliance rules. Either approves for settlement or rejects with compliance violation reason.

**Input Contract**: Message from Fraud Detector with `fraud_risk_level` and `ctr_required` fields

**Processing Steps**:
1. Check `fraud_risk_level`:
   - If `"HIGH"` and `ctr_required === true`: Check if CTR (Customer Transaction Report) flag is acknowledged in message metadata (simulated check)
   - If `"HIGH"` and CTR is not satisfied: Set `reason = "COMPLIANCE_VIOLATION"`, `status = "rejected"`
2. If all compliance checks pass:
   - Set `status = "approved"` (final approval for settlement)
3. Populate `compliance_notes` array with:
   - `"CTR required for wire transfers above $10,000"` (if flagged)
   - `"High fraud risk detected; review recommended"` (if level is HIGH)
   - `"Transaction approved for settlement"` (if status = approved)
4. Append `"compliance-checker"` to `agent_chain`

**Output Contract**:
```json
{
  "message_id": "uuid",
  "timestamp": "ISO 8601",
  "source_agent": "compliance-checker",
  "target_agent": "integrator",
  "message_type": "transaction",
  "agent_chain": ["integrator", "transaction-validator", "fraud-detector", "compliance-checker"],
  "data": {
    "transaction_id": "TXN001",
    "amount": "1500.00",
    "currency": "USD",
    "status": "approved",
    "fraud_risk_score": 0,
    "fraud_risk_level": "LOW",
    "ctr_required": false,
    "compliance_notes": ["Transaction approved for settlement"]
  }
}
```

**Example: TXN005 Approval** (HIGH fraud but CTR satisfied):
```json
{
  "data": {
    "transaction_id": "TXN005",
    "status": "approved",
    "fraud_risk_level": "HIGH",
    "ctr_required": true,
    "compliance_notes": [
      "CTR required for wire transfers above $10,000",
      "High fraud risk detected; review recommended",
      "Transaction approved for settlement"
    ]
  }
}
```

**Example: Invalid Currency Rejection** (TXN006):
```json
{
  "data": {
    "transaction_id": "TXN006",
    "status": "rejected",
    "reason": "INVALID_CURRENCY"
  }
}
```

---

## Message Exchange Flow

### Happy Path (Valid Transaction)

```
Integrator → Transaction Validator
  Input:  raw transaction (amount, currency, accounts)
  Output: {status: "validated", ...}
            ↓
         Fraud Detector
  Input:  validated transaction
  Output: {fraud_risk_score, fraud_risk_level, ctr_required, ...}
            ↓
         Compliance Checker
  Input:  fraud-assessed transaction
  Output: {status: "approved" | "rejected", compliance_notes[], ...}
            ↓
         Integrator (writes to shared/results/TXN[ID].json)
```

### Early Rejection Path (Invalid Currency or Amount)

```
Integrator → Transaction Validator
  Input:  raw transaction (currency: "XYZ" or amount: "-100.00")
  Output: {status: "rejected", reason: "INVALID_CURRENCY" | "INVALID_AMOUNT"}
            ↓
         Integrator (writes rejection to shared/results/TXN[ID].json, skips downstream agents)
```

### Edge Cases Tested

| Transaction | Input Condition | Expected Behavior | Agent Affected |
|---|---|---|---|
| TXN006 | currency = "XYZ" | Rejected with reason `INVALID_CURRENCY` | Transaction Validator |
| TXN007 | amount = "-100.00" | Rejected with reason `INVALID_AMOUNT` | Transaction Validator |
| TXN005 | amount = "$75,000", wire_transfer | fraud_risk_level = `HIGH`, ctr_required = `true` | Fraud Detector |
| TXN004 | timestamp = "02:47 UTC", country = "DE" | +2 pts (unusual hour), +1 pt (cross-border), score ≥ 3 | Fraud Detector |
| TXN003 | destination_account = "ACC-9999" | +5 pts (watchlist hit), fraud_risk_level ≥ `MEDIUM` | Fraud Detector |

---

## Agent Contract Summary

| Agent | Inputs | Outputs | Rejects | Libraries |
|---|---|---|---|---|
| **Transaction Validator** | transaction_id, amount, currency, accounts, metadata | status (validated/rejected), reason if rejected | INVALID_CURRENCY, INVALID_AMOUNT, MISSING_FIELD | `decimal.js`, `uuid` |
| **Fraud Detector** | validated transaction + timestamp, country metadata | fraud_risk_score, fraud_risk_level, ctr_required | None (always processes) | `decimal.js`, `Date` |
| **Compliance Checker** | fraud-assessed transaction | status (approved/rejected), compliance_notes, reason if rejected | COMPLIANCE_VIOLATION | none (pure logic) |

