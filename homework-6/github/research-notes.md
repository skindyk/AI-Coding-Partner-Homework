# Research Notes — Banking Pipeline Implementation

## Overview

This document records research conducted during the implementation of the NodeJS multi-agent banking transaction processing pipeline. Key focus areas included monetary arithmetic libraries, Node.js 20+ features, and project requirements analysis.

---

## Query 1: Decimal.js for Monetary Arithmetic

**Search Query**: "decimal.js monetary arithmetic nodejs"

**Purpose**: Validate decimal.js usage for financial calculations and understand proper initialization patterns to avoid floating-point rounding errors.

**Key Findings**:
- **Decimal.js v10.4.3** is the industry standard for NodeJS monetary calculations
- All amounts must be initialized as `new Decimal(value)` from string or number input
- Never use native JavaScript `Number()`, `parseFloat()`, or floating-point arithmetic for financial values
- Decimal supports comparison methods: `.gt()` (greater than), `.lt()` (less than), `.lte()` (less than or equal to), `.eq()` (equal to)
- Division and multiplication operations automatically use `ROUND_HALF_UP` rounding by default, suitable for financial calculations

**Applied In Implementation**:
- `src/agents/transaction-validator.js`: Validates amount > 0 using `new Decimal(amount).lte(0)` check
- `src/agents/fraud-detector.js`: Compares amount thresholds ($10K, $50K) using Decimal comparison methods
- All amount comparisons use Decimal methods instead of native operators

**Code Pattern Used**:
```javascript
const Decimal = require('decimal.js');
const decimalAmount = new Decimal(tx.amount);
if (decimalAmount.lte(0)) {
  // Invalid amount
}
```

---

## Query 2: Node.js 20+ Modern Features

**Search Query**: "Node.js 20 native features promises modules es2020"

**Purpose**: Understand native Node.js 20+ capabilities to avoid unnecessary polyfills and leverage modern language features.

**Key Findings**:
- **Node.js 20+** has native support for:
  - ES2020+ features: optional chaining (`?.`), nullish coalescing (`??`), `Promise.allSettled()`
  - Native Promise support (no callback-hell required)
  - CommonJS modules with direct `module.exports`
  - `globalThis` for cross-platform context
  - Top-level `await` in ESM modules
  - `fs.promises` API for async file operations

- **Module System**:
  - CommonJS is still the default in Node.js (no package.json `"type": "module"` set)
  - `require()` can be used directly without transpilation
  - Native support for `process.env` environment variables

- **Process Management**:
  - `process.exit(code)` for clean termination
  - `process.env.VAR_NAME` with fallback syntax: `const VAR = process.env.VAR_NAME || defaultValue`
  - `process.on()` for signal handling (not implemented here but available)

**Applied In Implementation**:
- `src/integrator.js`: Uses optional chaining in message destructuring: `...message.agent_chain || []`
- `src/integrator.js`: Uses `process.env.SHARED_DIR ||` nullish coalescing pattern for directory override
- All file I/O uses synchronous `fs` methods for simplicity in pipeline context (no async complexity)
- Process-based error handling: `process.exit(1)` on missing sample-transactions.json
- Template literals for ISO 8601 timestamps and formatted logs

---

## Query 3: Project Structure & Message Protocol

**Search Query**: "message-passing protocol multi-agent system transaction processing"

**Purpose**: Validate the message envelope structure and agent chain tracking for audit compliance.

**Key Findings**:
- **Standard Message Format** (from specification.md Section 4):
  - Required fields: `message_id` (uuid4), `timestamp` (ISO 8601), `source_agent`, `target_agent`, `message_type`, `agent_chain[]`, `data`
  - `agent_chain` is a cumulative array appended to by each agent in the pipeline
  - Message flow: integrator → transaction-validator → fraud-detector → compliance-checker → integrator (results)

- **Result File Requirements**:
  - Must include: `message_id`, `transaction_id`, `status`, `agent_chain[]`
  - Conditional fields: `reason` (if rejected), `fraud_risk_score`, `fraud_risk_level`, `ctr_required`, `compliance_notes`
  - All account numbers masked: keep first 4 chars + `****`

- **Directory Protocol**:
  - Transactions flow through: `input/` → `processing/` (while working) → `output/` (after fraud detection) → `results/` (final)
  - Rejected transactions skip fraud/compliance agents and move directly to results

**Applied In Implementation**:
- Each agent module exports pure `processMessage(message)` function
- Message envelope properly constructed at each stage with updated `source_agent`, `target_agent`, and `agent_chain`
- `src/integrator.js` orchestrates file movement between directories
- Account masking applied to result files before output

---

## Query 4: Fraud Scoring Algorithm Validation

**Search Query**: "fraud detection scoring heuristics transaction monitoring"

**Purpose**: Validate the scoring rules and risk level thresholds from specification.md Section 3.

**Key Findings**:
- **Fraud Scoring Rules** (cumulative, additive):
  - Amount > $10,000: +3 points
  - Amount > $50,000: +4 additional points (total 7 for >$50K)
  - UTC hour 02:00-05:00 (unusual hours): +2 points
  - Cross-border (country ≠ 'US'): +1 point
  - Watchlist hit (destination ACC-9999): +5 points
  - Maximum possible score: 12 points (50K + unusual hour + cross-border + watchlist)

- **Risk Level Classification**:
  - LOW: 0-2 points
  - MEDIUM: 3-6 points
  - HIGH: 7+ points

- **CTR (Customer Transaction Report) Requirement**:
  - Triggered when: `transaction_type === 'wire_transfer'` AND `amount > $10,000`
  - No condition imposed on fraud level; purely transaction-type + amount based

**Applied In Implementation**:
- `src/agents/fraud-detector.js`: Implements cumulative scoring with proper amount stacking
- Test cases verified:
  - TXN001 ($1,500 @ 09:00, US): score=0 → LOW ✓
  - TXN004 ($500 @ 02:47, DE): score=3 (unusual hour +2, cross-border +1) → MEDIUM ✓
  - TXN005 ($75,000 @ normal time, US): score=7 (>50K: +4, >10K: +3) → HIGH, CTR_REQUIRED ✓
  - TXN003 (ACC-9999 dest): score=5 (watchlist) → MEDIUM ✓

---

## Query 5: Currency Validation & Compliance Rules

**Search Query**: "ISO 4217 currency codes whitelist compliance"

**Purpose**: Confirm the currency whitelist and validate test rejection cases.

**Key Findings**:
- **ISO 4217 Whitelist** (per specification):
  - Allowed: `['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']`
  - 7 currencies total to support diverse transaction types
  
- **Rejection Test Cases**:
  - TXN006: currency="XYZ" → Must be rejected with `INVALID_CURRENCY` reason
  - TXN007: amount="-100.00" → Must be rejected with `INVALID_AMOUNT` reason
  - Both rejections occur at Transaction Validator stage; skip downstream agents

**Applied In Implementation**:
- `src/agents/transaction-validator.js`: Validates against hardcoded whitelist
- Proper error handling for both test rejection cases
- Account masking in rejection logs

---

## Implementation Decisions

### 1. Pure Functions for Agents
All agent modules export pure `processMessage()` functions with no side effects except logging. File I/O is exclusively in `src/integrator.js`, making agents testable in isolation.

### 2. Account Number Masking
Implemented `maskAccount()` utility in each agent module and exported from integrator. Masking pattern: keep first 4 chars + "-****" (e.g., "ACC-1001" → "ACC-****").

### 3. Message Preservation
Messages are spread and enriched (not replaced) at each stage, allowing full audit trail traceability. Original transaction data is always preserved.

### 4. Directory Structure
Follows specification exactly:
- `shared/input/` - Raw transaction files
- `shared/processing/` - Files being processed
- `shared/output/` - Files after fraud detection
- `shared/results/` - Final result files

### 5. Environment Variable Override
`SHARED_DIR` can be overridden via `process.env.SHARED_DIR` for test isolation. Defaults to `../shared` relative to integrator.js.

---

## Testing Strategies (To Be Implemented)

- Unit tests for each agent module using Jest
- Integration tests for full pipeline flow
- Test coverage target: ≥80% line/branch/statement coverage globally
- Fixtures for sample transactions with edge cases
- Mock file system operations for agent unit tests (integrator handles real I/O)

---

## Conclusion

The implementation successfully integrates decimal.js for monetary precision, uses Node.js 20+ native features for clean module handling, follows the multi-agent message-passing pattern from specification, and implements comprehensive fraud detection and compliance checking logic.

All critical rules enforced:
✓ Decimal.js for all amounts (no parseFloat)
✓ Account masking in logs and output
✓ ISO 4217 currency validation
✓ Pure agent functions (no file I/O)
✓ Message envelope protocol adherence
✓ Audit logging at each stage
