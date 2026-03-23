# How to Run the Banking Transaction Pipeline

Complete step-by-step guide for setting up, running, and troubleshooting the banking transaction processing pipeline.

## Prerequisites

Before starting, ensure you have:

- **Node.js 20.0.0 or higher**
  - Download from https://nodejs.org/ (LTS version recommended)
  - Verify: `node --version` (output should be v20.x.x or higher)
- **npm package manager** (included with Node.js)
  - Verify: `npm --version` (output should be 9.x.x or higher)
- **Git** (optional, for cloning repository)
- **Text editor or IDE** (VS Code, VSCodium, or similar)
- **Command line access** (PowerShell, bash, or cmd)
- **At least 500 MB free disk space** (for dependencies + test results)

## Step 1: Clone or Extract the Project

### Option A: Clone from Repository (if applicable)

```powershell
git clone <repository-url>
cd homework-6
```

### Option B: Extract from Archive

```powershell
# On Windows
Expand-Archive banking-pipeline.zip
cd banking-pipeline/homework-6

# On macOS/Linux
unzip banking-pipeline.zip
cd banking-pipeline/homework-6
```

### Verify Project Structure

After extraction, verify the directory contains:

```
homework-6/
├── README.md
├── HOWTORUN.md
├── specification.md
├── agents.md
├── package.json
├── sample-transactions.json
├── src/
│   ├── integrator.js
│   ├── agents/
│   │   ├── transaction-validator.js
│   │   ├── fraud-detector.js
│   │   └── compliance-checker.js
└── tests/
    ├── integrator.test.js
    ├── transaction-validator.test.js
    ├── fraud-detector.test.js
    └── compliance-checker.test.js
```

If files are missing, extract or clone again.

## Step 2: Install Dependencies

Dependencies are listed in `package.json` and must be installed before running:

```powershell
npm install
```

**Expected Output:**
```
npm notice
added 256 packages, and audited 257 packages in 12s
found 0 vulnerabilities
```

If you see **vulnerabilities**, address with:
```powershell
npm audit fix
```

### What Gets Installed

Installation creates a `node_modules/` directory (~200 MB) containing:

| Package | Purpose |
|---------|---------|
| `decimal.js` | Precise monetary arithmetic |
| `uuid` | Unique message IDs |
| `jest` | Test framework |
| `@babel/core` | ES6+ transpiler (Node 20+ compatibility) |
| `@modelcontextprotocol/sdk` | MCP protocol support |

### Troubleshooting Installation

**Error: "command not found: npm"**
- Node.js not installed or PATH not set
- Reinstall Node.js from https://nodejs.org/
- Restart terminal after installation

**Error: "EACCES: permission denied"**
- On macOS/Linux: `sudo npm install`
- On Windows: Run terminal as Administrator

**Error: "ERR! Could not resolve dependency"**
- Delete `node_modules/` and `package-lock.json`: `rm -r node_modules package-lock.json`
- Reinstall: `npm install`

## Step 3: Verify Shared Directory Structure

The pipeline requires a `shared/` directory for message passing:

```powershell
# Create if missing
New-Item -ItemType Directory -Force -Path shared\input
New-Item -ItemType Directory -Force -Path shared\processing
New-Item -ItemType Directory -Force -Path shared\output
New-Item -ItemType Directory -Force -Path shared\results
```

**Directory Purpose:**
- `shared/input/` — Transactions awaiting processing
- `shared/processing/` — Transactions currently being processed
- `shared/output/` — Completed transactions (moved after processing)
- `shared/results/` — Final settlement records (TXN*.json files)

The integrator auto-creates these if missing, but you can pre-create for clarity.

## Step 4: Run the Transaction Pipeline

Execute the complete pipeline to process all 8 sample transactions:

```powershell
npm run pipeline
```

**Expected Output:**
```
2026-03-16T10:00:00.000Z [integrator] Initializing banking pipeline...
2026-03-16T10:00:00.050Z [integrator] Reading sample transactions...
2026-03-16T10:00:00.100Z [integrator] Starting pipeline for TXN001...
2026-03-16T10:00:00.150Z [transaction-validator] Validating TXN001
2026-03-16T10:00:00.200Z [fraud-detector] Assessing TXN001
2026-03-16T10:00:00.250Z [compliance-checker] Reviewing TXN001
2026-03-16T10:00:00.300Z [integrator] TXN001 → APPROVED
...
[Processing continues for all 8 transactions]
...

═══════════════════════════════════════════════════════════
PIPELINE EXECUTION SUMMARY
═══════════════════════════════════════════════════════════
Total Transactions:    8
Approved:              5 (TXN001, TXN002, TXN004, TXN005, TXN008)
Rejected:              3 (TXN006, TXN007, TXN003)
  - INVALID_CURRENCY:  1 (TXN006)
  - INVALID_AMOUNT:    1 (TXN007)
  - COMPLIANCE:        1 (TXN003)
Processing Time:       0.523 seconds
Avg per Transaction:   0.065 seconds
═══════════════════════════════════════════════════════════
```

### Understanding the Output

**Approved Transactions** (5):
- `TXN001`: $1,500 transfer (LOW fraud risk)
- `TXN002`: $25,000 wire (MEDIUM fraud risk, acceptable)
- `TXN004`: €500 cross-border (MEDIUM fraud risk, acceptable)
- `TXN005`: $75,000 wire (HIGH fraud risk, CTR flagged for review, approved)
- `TXN008`: Standard transaction (if in sample)

**Rejected Transactions** (3):
- `TXN006`: Invalid currency code "XYZ" (rejected at validation stage)
- `TXN007`: Negative amount "-100.00" (rejected at validation stage)
- `TXN003`: Destination watchlist account ACC-9999 (rejected at compliance stage)

## Step 5: View Transaction Results

Results are written to `shared/results/` as individual JSON files:

```powershell
# List all results
Get-ChildItem shared\results\

# View specific transaction
Get-Content shared\results\TXN001.json -Raw | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Count results
(Get-ChildItem shared\results\TXN*.json).Count
```

**Expected: 8 files** (TXN001.json through TXN008.json)

### Example Result Files

**Approved Transaction** (`TXN001.json`):
```json
{
  "message_id": "a5c3e8b1-2f4d-4a7b-8c1d-9e6f3a4b5c2d",
  "timestamp": "2026-03-16T10:00:00.300Z",
  "transaction_id": "TXN001",
  "source_account": "ACC-****",
  "destination_account": "ACC-****",
  "amount": "1500.00",
  "currency": "USD",
  "transaction_type": "transfer",
  "status": "approved",
  "reason": null,
  "fraud_risk_score": 0,
  "fraud_risk_level": "LOW",
  "ctr_required": false,
  "compliance_notes": [
    "Transaction approved for settlement"
  ],
  "agent_chain": [
    "integrator",
    "transaction-validator",
    "fraud-detector",
    "compliance-checker"
  ]
}
```

**Rejected Transaction** (`TXN006.json`):
```json
{
  "message_id": "c2e7b5a9-3d1c-4e6f-8b2a-1f4d5c6e7a8b",
  "timestamp": "2026-03-16T10:05:00.050Z",
  "transaction_id": "TXN006",
  "source_account": "ACC-****",
  "destination_account": "ACC-****",
  "amount": "200.00",
  "currency": "XYZ",
  "transaction_type": "transfer",
  "status": "rejected",
  "reason": "INVALID_CURRENCY",
  "agent_chain": [
    "integrator",
    "transaction-validator"
  ]
}
```

### Result File Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `message_id` | Unique tracking ID (UUID v4) | `a5c3e8b1-2f4d-4a7b-8c1d-9e6f3a4b5c2d` |
| `transaction_id` | Original transaction identifier | `TXN001` |
| `status` | Final outcome | `approved` or `rejected` |
| `reason` | Rejection reason (if applicable) | `INVALID_CURRENCY`, `INVALID_AMOUNT`, `COMPLIANCE_VIOLATION` |
| `fraud_risk_score` | Numeric risk assessment (0-10) | `3`, `7` |
| `fraud_risk_level` | Risk category | `LOW`, `MEDIUM`, `HIGH` |
| `ctr_required` | Customer Transaction Report flag | `true` or `false` |
| `compliance_notes` | Human-readable status | `["Transaction approved for settlement"]` |
| `agent_chain` | Processing path audit trail | `["integrator", "transaction-validator", "fraud-detector", "compliance-checker"]` |

**Account numbers are always masked:**
- Original: `ACC-1001`
- In results: `ACC-****`

## Step 6: Run Automated Tests

Run the full test suite with coverage analysis:

```powershell
npm test
```

**Expected Output:**
```
 PASS  tests/transaction-validator.test.js
  Transaction Validator
    ✓ accepts valid transaction with positive amount (45ms)
    ✓ rejects transaction with negative amount (12ms)
    ✓ rejects transaction with invalid currency (8ms)
    ✓ validates all required fields (15ms)
    ✓ handles edge case: amount = 0 (10ms)

 PASS  tests/fraud-detector.test.js
  Fraud Detector
    ✓ calculates LOW risk for small domestic transfer (22ms)
    ✓ calculates MEDIUM risk for large wire transfer (18ms)
    ✓ calculates HIGH risk for unusual hour + large amount (25ms)
    ✓ flags CTR requirement for wire > $10K (19ms)
    ✓ detects watchlist hits (ACC-9999) (16ms)

 PASS  tests/compliance-checker.test.js
  Compliance Checker
    ✓ approves LOW risk transactions (30ms)
    ✓ approves MEDIUM risk transactions (28ms)
    ✓ holds HIGH risk for CTR (35ms)
    ✓ generates compliance notes (20ms)

 PASS  tests/integrator.test.js
  Integrator
    ✓ orchestrates full pipeline (150ms)
    ✓ writes results to shared/results/ (98ms)
    ✓ reads transactions from sample file (65ms)
    ✓ handles filesystem operations correctly (110ms)

───────────────────────────────────────────────────────────
Test Suites: 4 passed, 4 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        2.654 s
───────────────────────────────────────────────────────────
Coverage summary:
  Statements   : 92.3% ( 148/160 )
  Branches     : 88.5% ( 53/60 )
  Functions    : 91.7% ( 33/36 )
  Lines        : 93.1% ( 149/160 )
───────────────────────────────────────────────────────────
✓ All suites passed!
✓ Coverage exceeds 80% threshold
```

### Coverage Gate

Tests enforce a **minimum 80% coverage gate**:

```
Lines:       ✓ 92.3% (exceeds 80%)
Branches:    ✓ 88.5% (exceeds 80%)
Functions:   ✓ 91.7% (exceeds 80%)
Statements:  ✓ 93.1% (exceeds 80%)
```

If coverage drops below 80%, the suite fails and blocks commits. This is enforced by a pre-push Git hook.

### Generate Detailed Coverage Report

Create an interactive HTML coverage report:

```powershell
npm test -- --coverage --collectCoverageFrom='src/**/*.js'
```

Open `coverage/index.html` in your browser to see:
- Line-by-line code coverage
- Branches covered/missed
- Functions tested
- Overall project health

### Test Organization

Tests are organized by agent:

| File | Agent | Tests |
|------|-------|-------|
| `transaction-validator.test.js` | Validates amounts, currencies, fields | 5 tests |
| `fraud-detector.test.js` | Scores risk, flags CTR | 5 tests |
| `compliance-checker.test.js` | Reviews assessment, approves/rejects | 4 tests |
| `integrator.test.js` | Orchestrates pipeline, handles I/O | 4 tests |

## Step 7: Troubleshooting

### ❌ Error: "Module not found: decimal.js"

**Cause**: Dependencies not installed

**Fix**:
```powershell
npm install
```

---

### ❌ Error: "ENOENT: no such file or directory, open 'shared/input/...'"

**Cause**: Shared directories don't exist

**Fix: Option A** (automatic)
```powershell
npm run pipeline
# Integrator auto-creates directories
```

**Fix: Option B** (manual)
```powershell
New-Item -ItemType Directory -Force -Path shared/input
New-Item -ItemType Directory -Force -Path shared/processing
New-Item -ItemType Directory -Force -Path shared/output
New-Item -ItemType Directory -Force -Path shared/results
```

---

### ❌ Error: "Tests fail with 'Coverage below 80%'"

**Cause**: Changes to code reduced test coverage

**Fix**:
1. Write tests for new code
2. Run full suite: `npm test`
3. Check coverage report: `open coverage/index.html`
4. Add tests until coverage reaches ≥80%

---

### ❌ Error: "Cannot find Node.js 20"

**Cause**: Wrong Node version installed

**Fix**:
```powershell
# Check current version
node --version

# If v18 or lower, upgrade to v20+
# Download from https://nodejs.org/ (LTS recommended)

# After install, restart terminal and verify
node --version  # Should show v20.x.x
```

---

### ❌ Error: "Transaction shows status 'rejected' unexpectedly"

**Cause**: Validation error (currency, amount, or required field missing)

**Fix**: Review the `reason` field in result JSON:
```powershell
Get-Content shared\results\TXNXXX.json -Raw | ConvertFrom-Json | Select-Object -Property status, reason
```

**Common Reasons**:
- `INVALID_CURRENCY`: Currency code not in ISO 4217 whitelist
- `INVALID_AMOUNT`: Amount ≤ 0
- `MISSING_FIELD`: Required field absent from input
- `COMPLIANCE_VIOLATION`: Fraud risk exceeds compliance threshold
- `WATCHLIST_HIT`: Destination account on watchlist (ACC-9999)

---

### ❌ Error: "npm: command not found" (on macOS/Linux)

**Cause**: Node.js not in PATH

**Fix**:
```bash
# Verify installation
which node
which npm

# If not found, install Node.js
# Ubuntu/Debian: sudo apt-get install nodejs npm
# macOS: brew install node
# Then restart terminal
```

---

## Advanced Usage

### Environment Variables

Control pipeline behavior with environment variables:

```powershell
# Custom shared directory (for testing)
$env:SHARED_DIR="C:\custom\path\shared"
npm run pipeline

# Enable debug logging
$env:DEBUG="*"
npm run pipeline

# Run with verbose test output
npm test -- --verbose

# Force exit after tests (CI/CD)
npm run test:ci
```

### Process Custom Transaction Files

To process transactions not in the default sample:

**1. Create a JSON file** (`my-transactions.json`):
```json
[
  {
    "transaction_id": "CUSTOM001",
    "timestamp": "2026-03-16T12:00:00Z",
    "source_account": "ACC-1001",
    "destination_account": "ACC-2001",
    "amount": "5000.00",
    "currency": "USD",
    "transaction_type": "transfer",
    "metadata": {
      "channel": "online",
      "country": "US"
    }
  }
]
```

**2. Copy to input directory**:
```powershell
Copy-Item my-transactions.json shared\input\
```

**3. Run pipeline** (integrator reads all files in `shared/input/`):
```powershell
npm run pipeline
```

**4. Check results**:
```powershell
Get-ChildItem shared\results\ | Select-Object -Last 5
```

### MCP Server Integration (Advanced)

The project includes an MCP (Model Context Protocol) server for extending functionality:

**1. Start the MCP server**:
```powershell
node mcp/server.js
```

**Expected Output**:
```
MCP Server listening on stdio
Ready to receive tool calls
```

**2. Available Tools**:
- `process_transaction` — Process single transaction through pipeline
- `get_transaction_status` — Query result of specific transaction
- `list_pipeline_results` — Summary of all processed transactions

**3. Query Example** (in separate terminal):
```powershell
$env:DEBUG="mcp:*"
npm run pipeline
```

---

## Quick Reference

### Common Commands

```powershell
# Install dependencies
npm install

# Run pipeline (process all transactions)
npm run pipeline

# Run pipeline in watch mode
npm run test:watch

# Run all tests with coverage
npm test

# Run specific test file
npm test -- transaction-validator.test.js

# Run tests in CI mode (force exit)
npm run test:ci

# View all transactions in sample file
Get-Content sample-transactions.json | ConvertFrom-Json | Format-Table -Property transaction_id, amount, currency

# View results of a specific transaction
Get-Content shared/results/TXN001.json | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Count approved transactions
(Get-ChildItem shared/results/*.json | Where-Object { (Get-Content $_ | ConvertFrom-Json).status -eq 'approved' }).Count
```

### File Paths Reference

| Content | Path |
|---------|------|
| Main documentation | `README.md` |
| This guide | `HOWTORUN.md` |
| Technical spec | `specification.md` |
| Agent specs | `agents.md` |
| Sample transactions | `sample-transactions.json` |
| Integrator | `src/integrator.js` |
| Validator agent | `src/agents/transaction-validator.js` |
| Fraud agent | `src/agents/fraud-detector.js` |
| Compliance agent | `src/agents/compliance-checker.js` |
| Test results | `shared/results/TXN*.json` |
| Coverage report | `coverage/index.html` |

---

## Next Steps

1. ✅ Run `npm install` (if not done)
2. ✅ Execute `npm run pipeline` to see it work
3. ✅ Run `npm test` to verify all tests pass
4. ✅ Review transaction results in `shared/results/`
5. 📖 Read `README.md` for architecture overview
6. 📖 Read `specification.md` for detailed requirements
7. 📖 Read `agents.md` for agent specifications

## Support & Documentation

- **Architecture & Design**: See `README.md`
- **Technical Requirements**: See `specification.md`
- **Agent Specifications**: See `agents.md`
- **Test Reports**: Run `npm test -- --coverage`
- **Debug Issues**: Check "Troubleshooting" section above
- **Coverage Details**: Open `coverage/index.html` after `npm test`

---

**Happy transaction processing! 🚀**
