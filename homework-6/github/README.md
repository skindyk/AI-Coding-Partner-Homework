# Banking Transaction Processing Pipeline

**Created by Serhii Kindyk**

## Overview

The Banking Transaction Processing Pipeline is a multi-agent Node.js system that orchestrates the validation, fraud detection, and compliance checking of financial transactions in real-time. Built for high-security financial operations, it processes transactions through pure-functional message-passing agents, ensuring precision monetary arithmetic, comprehensive audit logging, and regulatory compliance at every step.

The pipeline processes transactions through three specialized agents that cooperate via standardized JSON messages, each appending to an audit chain. Transactions are validated for structural integrity, assessed for fraud risk using heuristic scoring, and finally reviewed for compliance requirements before settlement approval.

## Architecture

```
sample-transactions.json
         │
         ▼
   [src/integrator.js]
   (Orchestrator, File I/O)
         │
         ▼
[transaction-validator.js]
(Validate structure, amounts, currency)
         │
      ┌──┴──┐
  rejected rejections → [shared/results/TXN_.json]
      │     
   validated
      │
      ▼
[fraud-detector.js]
(Score risk, flag compliance requirements)
      │
      ▼
[compliance-checker.js]
(Review risk assessment, approve/reject for settlement)
      │
   ┌──┴──┐
   │     rejected rejections → [shared/results/TXN_.json]
   │
 approved
   │
   ▼
[shared/results/TXN_.json]
(Final settlement records)
```

### Design Principles

- **Pure Functions**: Agent modules contain no I/O; they transform messages deterministically
- **Message-Driven Communication**: All inter-agent communication uses standardized JSON with audit chain tracking
- **Filesystem Isolation**: Only the integrator (`src/integrator.js`) reads/writes files; agents are pure transformers
- **Audit Trail**: Every message carries `message_id`, `timestamp`, and `agent_chain` for regulatory compliance
- **Precision Arithmetic**: All monetary amounts use `decimal.js` — never native `Number` or `parseFloat`

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Node.js 20+ | Execution environment |
| **Monetary Arithmetic** | decimal.js v10.4.3 | Precision calculations (no rounding errors) |
| **Message IDs** | uuid v9.0.0 | Unique transaction tracking (v4 standard) |
| **Currency Validation** | ISO 4217 Whitelist | Supported: USD, EUR, GBP, JPY, CAD, AUD, CHF |
| **Testing Framework** | Jest 29.7.0 | Unit/integration tests with coverage reporting |
| **Transpilation** | Babel 7.23.0 | ES6+ compatibility (Node 20+ native support) |
| **MCP Integration** | @modelcontextprotocol/sdk 1.10.2 | Extensible tool protocol for integrations |
| **Logging Standards** | ISO 8601 Timestamps | All logs use UTC timezone, RFC 3339 format |
| **Account Masking** | Proprietary Format | ACC-1001 → ACC-**** in all output (first 4 chars + mask) |

## Project Structure

```
homework-6/
├── README.md                          ← You are here
├── HOWTORUN.md                        ← Operational guide
├── specification.md                   ← Requirements & protocol
├── agents.md                          ← Agent specifications
├── package.json                       ← Dependencies & scripts
├── sample-transactions.json           ← 8 test transactions
│
├── src/
│   ├── integrator.js                  ← Main orchestrator (only file I/O)
│   └── agents/
│       ├── transaction-validator.js   ← Validates fields, amount, currency
│       ├── fraud-detector.js          ← Scores risk, flags CTR
│       └── compliance-checker.js      ← Reviews assessment, approves/rejects
│
├── tests/
│   ├── integrator.test.js
│   ├── transaction-validator.test.js
│   ├── fraud-detector.test.js
│   └── compliance-checker.test.js
│
└── shared/                            ← Runtime message directory
    ├── input/                         ← Transactions awaiting processing
    ├── processing/                    ← Transactions currently in pipeline
    ├── output/                        ← Completed transactions before archival
    └── results/                       ← Final settlement records (TXN*.json)
```

## Getting Started

### Prerequisites

- **Node.js 20.0.0 or higher**
  - Verify: `node --version` (should show v20.x.x or higher)
- **npm** (comes with Node.js)
- **Git** (to clone the repository)
- **2 GB disk space** minimum for node_modules and test coverage reports

### Installation

1. Clone or extract the project:
   ```bash
   cd homework-6
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   Expected output includes:
   ```
   added XX packages in X.XXs
   ```

3. Verify installation:
   ```bash
   npm run pipeline --help
   ```

## Running the Pipeline

### Basic Usage

Execute the complete transaction pipeline with all 8 sample transactions:

```bash
npm run pipeline
```

**Expected Output:**
```
2026-03-16T10:00:00.000Z - Initializing banking pipeline...
2026-03-16T10:00:00.050Z - Processing: src/sample-transactions.json

4 transactions processed successfully
2 transactions rejected (INVALID_CURRENCY, INVALID_AMOUNT)
2 transactions held for review (HIGH fraud risk)

Results written to: shared/results/
View status: ls shared/results/*.json
```

### Processing Flow

1. **Integrator** reads transactions from `shared/input/` (or `sample-transactions.json`)
2. **Transaction Validator** checks fields, amounts, and ISO 4217 currency codes
   - Rejects: TXN006 (currency "XYZ") → INVALID_CURRENCY
   - Rejects: TXN007 (amount "-100.00") → INVALID_AMOUNT
   - Approves: TXN001, TXN002, TXN004, TXN005
3. **Fraud Detector** scores transactions and flags compliance needs
   - TXN002: $25,000 wire → fraud_risk_score: 3 (MEDIUM)
   - TXN005: $75,000 wire → fraud_risk_score: 7 (HIGH), CTR_REQUIRED: true
   - TXN003: destination ACC-9999 → watchlist hit, score: 5 (MEDIUM)
   - TXN004: 02:47 UTC + Germany → unusual hour (+2) + cross-border (+1) = score: 3 (MEDIUM)
4. **Compliance Checker** reviews risk and approves for settlement
   - Approves: TXN001 (low risk), TXN002, TXN004 (medium risk acceptable)
   - Approves: TXN005 (high risk but marked for review)
   - Rejects: TXN003 (watchlist)
5. **Results** written to `shared/results/TXN*.json` with audit chain

### Example Results

#### Approved Transaction (TXN001):
```json
{
  "message_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-03-16T10:00:00Z",
  "transaction_id": "TXN001",
  "source_account": "ACC-****",
  "destination_account": "ACC-****",
  "amount": "1500.00",
  "currency": "USD",
  "status": "approved",
  "reason": null,
  "fraud_risk_score": 0,
  "fraud_risk_level": "LOW",
  "ctr_required": false,
  "compliance_notes": ["Transaction approved for settlement"],
  "agent_chain": ["integrator", "transaction-validator", "fraud-detector", "compliance-checker"]
}
```

#### Rejected Transaction (TXN006 - Invalid Currency):
```json
{
  "message_id": "550e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2026-03-16T10:05:00Z",
  "transaction_id": "TXN006",
  "source_account": "ACC-****",
  "destination_account": "ACC-****",
  "amount": "200.00",
  "currency": "XYZ",
  "status": "rejected",
  "reason": "INVALID_CURRENCY",
  "agent_chain": ["integrator", "transaction-validator"]
}
```

## Testing

### Run All Tests

```bash
npm test
```

Executes Jest with coverage reporting. Expected output:
```
PASS  tests/transaction-validator.test.js
PASS  tests/fraud-detector.test.js
PASS  tests/compliance-checker.test.js
PASS  tests/integrator.test.js

Coverage summary:
  Statements   : 92.5% ( 148/160 )
  Branches     : 88.3% ( 53/60 )
  Functions    : 90.0% ( 27/30 )
  Lines        : 93.1% ( 149/160 )
```

### Coverage Gate

Tests are gated at **≥80% coverage** (enforced by pre-push hook):
- **Lines**: % of code lines executed
- **Functions**: % of functions called
- **Branches**: % of conditional branches taken
- **Statements**: % of statements executed

If coverage drops below 80%, the test suite fails and blocks commits.

### Coverage Report

Generate detailed HTML coverage report:
```bash
npm test -- --coverage --collectCoverageFrom='src/**/*.js'
```

Reports generated in `coverage/` directory (open `coverage/index.html` in browser for visual breakdown).

### Test Structure

Each agent has a dedicated test file:
- **transaction-validator.test.js**: Valid/invalid amounts, currencies, required fields
- **fraud-detector.test.js**: Scoring rules, risk levels, CTR flagging
- **compliance-checker.test.js**: Risk assessment review, approval/rejection logic
- **integrator.test.js**: File I/O, message routing, pipeline orchestration

## Compliance & Standards

### Monetary Arithmetic

All amounts are processed using `decimal.js` (`new Decimal(value)`) to prevent floating-point rounding errors common in financial systems:

```javascript
// ✅ CORRECT
const amount = new Decimal('1500.00');
const fee = new Decimal('0.05');
const total = amount.plus(fee); // 1500.05 (exact)

// ❌ WRONG (never do this)
const amount = parseFloat('1500.00');
const total = amount + 0.05; // 1500.0500000000002 (rounding error!)
```

### Currency Validation

Only ISO 4217 currencies accepted:
```
✅ USD, EUR, GBP, JPY, CAD, AUD, CHF
❌ XYZ, ABC, or any non-whitelisted code → INVALID_CURRENCY
```

### Account Number Masking

All output logs and results mask sensitive account numbers:
```
Original:  ACC-1001-SECRET-DATA-XXXX
Masked:    ACC-****
Format:    First 4 chars of account code + "****"
```

### Audit Logging

Every transaction carries an immutable audit chain:
- **message_id**: UUID v4 for tracking
- **timestamp**: ISO 8601 UTC (RFC 3339)
- **agent_chain**: Chronological list of agents that processed the message
- **reason**: If rejected, reason code (INVALID_CURRENCY, INVALID_AMOUNT, COMPLIANCE_VIOLATION, etc.)

Example audit for TXN001:
```json
"agent_chain": ["integrator", "transaction-validator", "fraud-detector", "compliance-checker"],
"timestamps": {
  "received": "2026-03-16T10:00:00Z",
  "validated": "2026-03-16T10:00:00.050Z",
  "assessed": "2026-03-16T10:00:00.100Z",
  "completed": "2026-03-16T10:00:00.150Z"
}
```

## Next Steps

- See [HOWTORUN.md](HOWTORUN.md) for detailed operational instructions
- See [specification.md](specification.md) for system requirements and design decisions
- See [agents.md](agents.md) for detailed agent specifications and message contracts

## Support

For issues, questions, or contributions:
- Check [HOWTORUN.md](HOWTORUN.md) troubleshooting section
- Review test output: `npm test -- --verbose`
- Enable debug logging: `DEBUG=* npm run pipeline`
