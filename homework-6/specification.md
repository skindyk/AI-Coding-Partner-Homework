# Specification: AI-Powered Multi-Agent Banking Pipeline

## 1. High-Level Objective

Build a 3-agent Python pipeline that validates, scores for fraud risk, and performs compliance checks on banking transactions using file-based JSON message passing.

---

## 2. Mid-Level Objectives

1. **Invalid transaction rejection**: TXN006 (currency "XYZ") is rejected with reason `INVALID_CURRENCY`; TXN007 (amount -100.00) is rejected with reason `NEGATIVE_AMOUNT`. Both must appear in `shared/results/` with `status: "rejected"`.

2. **High-value fraud flagging**: Transactions above $50,000 receive `fraud_risk_level: "HIGH"` (score >= 7). TXN005 ($75,000) must be flagged `HIGH` by the Fraud Detector.

3. **Currency Transaction Report (CTR) flagging**: Transactions above $10,000 receive `ctr_required: true`. TXN002 ($25,000) and TXN005 ($75,000) must both be flagged with `ctr_required: true` by the Compliance Checker.

4. **Full pipeline execution**: The pipeline reads all 8 transactions from `sample-transactions.json` and writes exactly 8 result files to `shared/results/` (2 rejected by Validator, 6 processed through Fraud Detector and Compliance Checker).

5. **Audit logging with PII masking**: All agent operations write audit log entries with ISO 8601 timestamps. Account numbers are masked in all log output using the format `***-{last4}` (e.g., `ACC-1001` → `***-1001`).

---

## 3. Implementation Notes

- **Monetary values**: Use `decimal.Decimal` for all monetary calculations — never `float`. Parse amounts with `Decimal(str(data["amount"]))` to avoid floating-point imprecision.
- **Currency validation**: ISO 4217 whitelist: `USD`, `EUR`, `GBP`, `JPY`, `CAD`, `AUD`. Any currency not on this list is rejected with reason `INVALID_CURRENCY`.
- **Message format**: Every inter-agent message must follow this JSON schema:
  ```json
  {
    "message_id": "<uuid4>",
    "timestamp": "<ISO 8601 UTC>",
    "source_agent": "<agent_name>",
    "target_agent": "<agent_name>",
    "message_type": "transaction",
    "data": { ... }
  }
  ```
- **Audit logging**: Each log entry must include: `timestamp` (ISO 8601), `agent_name`, `transaction_id`, `outcome`.
- **PII masking**: Account numbers must never appear in plaintext in logs. Apply `mask_account` helper: `***-{acct[-4:]}` (e.g., `ACC-1001` → `***-1001`).
- **JSON serialization**: Use a custom `DecimalEncoder` subclass of `json.JSONEncoder` to serialize `Decimal` values as strings.
- **Dry-run mode**: The Transaction Validator must support a `--dry-run` CLI flag that validates all transactions without writing any files and prints a summary table to stdout.

---

## 4. Context

- **Beginning state**: `sample-transactions.json` exists in `homework-6/` with 8 raw transaction records (TXN001–TXN008). No `agents/` directory exists. No `shared/` subdirectories exist. No pipeline code exists.

- **Ending state**: `shared/results/` contains 8 JSON result files (one per transaction). `shared/output/` contains intermediate files for the 6 valid transactions after fraud scoring. The audit log captures every agent operation. Test coverage is >= 90%. `README.md` and `HOWTORUN.md` are complete and include the author's name.

---

## 5. Low-Level Tasks

### Task: Transaction Validator

**Prompt**: "Context: You are building the first agent in a 3-agent Python banking pipeline. The project uses file-based JSON message passing through shared/ directories. All monetary values use decimal.Decimal (never float). Account numbers must be masked in logs as ***-{last4}. The integrator will call your process_message() function with a dict containing a message_id, timestamp, source_agent, target_agent, message_type, and a data payload from sample-transactions.json.

Task: Create agents/transaction_validator.py with a process_message(message: dict) -> dict function that validates a single banking transaction message.

Rules:
- Required fields: transaction_id, amount, currency, source_account, destination_account. Missing any field → reject with reason MISSING_FIELD.
- Parse amount as Decimal(str(data['amount'])). If amount <= 0, reject with reason NEGATIVE_AMOUNT.
- Valid currencies: USD, EUR, GBP, JPY, CAD, AUD. Any other value → reject with reason INVALID_CURRENCY.
- mask_account helper: return '***-' + acct[-4:] (e.g. ACC-1001 → ***-1001). Use this in all log output.
- On valid: write message to shared/output/{message_id}.json with status='validated', then return the updated message.
- On rejected: write message to shared/results/{message_id}.json with status='rejected' and reason field, then return the updated message.
- Support --dry-run CLI flag: validate without writing any files, print a table of results to stdout.
- Write one audit log entry per transaction: timestamp (ISO 8601), agent_name='transaction_validator', transaction_id, outcome ('validated' or 'rejected: <reason>').

Output: A single file agents/transaction_validator.py implementing process_message(message: dict) -> dict and a CLI entry point with --dry-run support."

**File to CREATE**: `agents/transaction_validator.py`

**Function to CREATE**: `process_message(message: dict) -> dict`

**Details**:
- Required fields check: `transaction_id`, `amount`, `currency`, `source_account`, `destination_account`
- Amount parsing: `Decimal(str(data["amount"]))` — reject if `<= 0` with reason `NEGATIVE_AMOUNT`
- Currency whitelist: `USD`, `EUR`, `GBP`, `JPY`, `CAD`, `AUD` — reject unknown codes with reason `INVALID_CURRENCY`
- `mask_account(acct)` helper: returns `"***-" + acct[-4:]`
- On valid transaction: write message JSON to `shared/output/{message_id}.json` with `data.status = "validated"`
- On rejected transaction: write message JSON to `shared/results/{message_id}.json` with `data.status = "rejected"` and `data.reason = "<REASON_CODE>"`
- CLI `--dry-run` flag: validates all transactions in `sample-transactions.json` without writing any files; prints a formatted table to stdout showing transaction_id, amount, currency, and validation result
- Audit log format per entry: `{"timestamp": "<ISO8601>", "agent_name": "transaction_validator", "transaction_id": "<id>", "outcome": "<validated|rejected: REASON>"}`

---

### Task: Fraud Detector

**Prompt**: "Context: You are building the second agent in a 3-agent Python banking pipeline. The Transaction Validator has already run and placed validated transaction messages as JSON files in shared/output/. All monetary values use decimal.Decimal. The message format includes message_id, timestamp, source_agent, target_agent, message_type, and data (which already has status='validated').

Task: Create agents/fraud_detector.py with a process_message(message: dict) -> dict function that scores a validated transaction for fraud risk.

Rules:
- Scoring system (additive, max 10 pts):
  - amount > $50,000 → +4 pts
  - $10,000 < amount <= $50,000 → +3 pts
  - Transaction hour in 02:00–05:00 UTC (inclusive) → +2 pts
  - metadata.country != 'US' → +1 pt
- Risk levels: LOW (score 0–2), MEDIUM (score 3–6), HIGH (score 7–10)
- Add fraud_risk_score (int) and fraud_risk_level (str) to message.data
- Read source file from shared/output/, write updated message back to shared/output/{message_id}.json (overwrite) for the Compliance Checker to consume
- Write one audit log entry per transaction: timestamp, agent_name='fraud_detector', transaction_id, outcome (e.g. 'scored: HIGH (8)')
- Use decimal.Decimal for all amount comparisons

Output: A single file agents/fraud_detector.py implementing process_message(message: dict) -> dict."

**File to CREATE**: `agents/fraud_detector.py`

**Function to CREATE**: `process_message(message: dict) -> dict`

**Details**:
- Fraud scoring (additive points, integer total):
  - `amount > Decimal("50000")` → `+4` pts
  - `Decimal("10000") < amount <= Decimal("50000")` → `+3` pts
  - Transaction timestamp hour in `[2, 3, 4, 5]` UTC → `+2` pts
  - `message["data"]["metadata"]["country"] != "US"` → `+1` pt
- Risk level mapping: `LOW` = score 0–2, `MEDIUM` = score 3–6, `HIGH` = score 7–10
- Adds `fraud_risk_score` (int) and `fraud_risk_level` (str) to `message["data"]`
- Reads input from `shared/output/`, writes updated result back to `shared/output/{message_id}.json`
- Updates `source_agent` to `"fraud_detector"` and `target_agent` to `"compliance_checker"` in the message envelope

---

### Task: Compliance Checker

**Prompt**: "Context: You are building the third and final agent in a 3-agent Python banking pipeline. The Fraud Detector has added fraud_risk_score and fraud_risk_level to each transaction message in shared/output/. All monetary values use decimal.Decimal. The message data already contains: transaction_id, amount, currency, source_account, destination_account, status='validated', fraud_risk_score, fraud_risk_level.

Task: Create agents/compliance_checker.py with a process_message(message: dict) -> dict function that performs regulatory compliance checks and writes the final result.

Rules:
- ctr_required = True if amount > Decimal('10000') (Currency Transaction Report threshold)
- aml_flag = True if: fraud_risk_level == 'HIGH' OR amount is in the structuring range [Decimal('9000'), Decimal('10000')] (inclusive)
- compliance_status = 'REVIEW_REQUIRED' if aml_flag is True OR ctr_required is True, else 'CLEAR'
- Add ctr_required (bool), aml_flag (bool), compliance_status (str) to message.data
- Write final message to shared/results/{message_id}.json — this is the terminal output for this transaction
- Write one audit log entry per transaction: timestamp, agent_name='compliance_checker', transaction_id, outcome (e.g. 'REVIEW_REQUIRED' or 'CLEAR')
- Mask account numbers in all log output using ***-{last4}

Output: A single file agents/compliance_checker.py implementing process_message(message: dict) -> dict."

**File to CREATE**: `agents/compliance_checker.py`

**Function to CREATE**: `process_message(message: dict) -> dict`

**Details**:
- `ctr_required = True` if `Decimal(str(data["amount"])) > Decimal("10000")`
- `aml_flag = True` if `data["fraud_risk_level"] == "HIGH"` OR `Decimal("9000") <= amount <= Decimal("10000")` (structuring detection)
- `compliance_status = "REVIEW_REQUIRED"` if `aml_flag or ctr_required`, else `"CLEAR"`
- Adds `ctr_required`, `aml_flag`, and `compliance_status` to `message["data"]`
- Writes final result JSON to `shared/results/{message_id}.json`
- Updates `source_agent` to `"compliance_checker"` and `target_agent` to `"pipeline_complete"` in the message envelope
- Audit log entry format: `{"timestamp": "<ISO8601>", "agent_name": "compliance_checker", "transaction_id": "<id>", "outcome": "<compliance_status>"}`
