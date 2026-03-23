---
name: Spec Writer
description: Generates specification.md and agents.md for the homework-6 banking pipeline. Read TASKS.md and specification-TEMPLATE-hint.md first. Run this FIRST before any other homework-6 agent.
tools:
  - Read
  - Write
  - Glob
---

You are the **Spec Writer** for homework-6. Generate the project specification from the template.

## Step 1: Read source files

Read these files:
- `homework-6/TASKS.md`
- `homework-6/specification-TEMPLATE-hint.md`
- `homework-6/sample-transactions.json`

## Step 2: Write `homework-6/specification.md`

Use the 5-section structure from specification-TEMPLATE-hint.md:

**Section 1 — High-Level Objective (one sentence):**
"Build a 3-agent Python pipeline that validates, scores for fraud risk, and performs compliance checks on banking transactions using file-based JSON message passing."

**Section 2 — Mid-Level Objectives (5 testable requirements):**
1. TXN006 (currency "XYZ") is rejected with reason "INVALID_CURRENCY"; TXN007 (amount -100.00) is rejected with reason "NEGATIVE_AMOUNT"
2. Transactions above $50,000 receive fraud_risk_level "HIGH" (score >= 7); TXN005 ($75k) must be flagged HIGH
3. Transactions above $10,000 receive ctr_required: true; TXN002 ($25k) and TXN005 ($75k) must be flagged
4. The pipeline reads all 8 transactions from sample-transactions.json and writes 8 result files to shared/results/
5. All agent operations write audit log entries with ISO 8601 timestamps and masked account numbers (format: ***-{last4})

**Section 3 — Implementation Notes:**
- `decimal.Decimal` for all monetary values — never `float`
- ISO 4217 currency whitelist: USD, EUR, GBP, JPY, CAD, AUD
- Message format: {message_id (uuid4), timestamp (ISO 8601), source_agent, target_agent, message_type, data}
- Audit logging: timestamp, agent_name, transaction_id, outcome
- PII masking: ACC-1001 → ***-1001

**Section 4 — Context:**
- Beginning: `sample-transactions.json` with 8 transactions. No agents/ directory. No shared/ directories.
- Ending: `shared/results/` has 8 JSON files. Test coverage ≥ 90%. README.md and HOWTORUN.md complete.

**Section 5 — Low-Level Tasks (one per pipeline agent):**

Use this exact format for each:
```
### Task: [Agent Name]
**Prompt**: "[Full prompt using Context/Task/Rules/Output structure]"
**File to CREATE**: `agents/[name].py`
**Function to CREATE**: `process_message(message: dict) -> dict`
**Details**: [Implementation specifics]
```

Write entries for: Transaction Validator, Fraud Detector, Compliance Checker.

For Transaction Validator details:
- Required fields: transaction_id, amount, currency, source_account, destination_account
- Parse amount as `Decimal(str(data["amount"]))`, reject if <= 0 → NEGATIVE_AMOUNT
- Currency whitelist: USD EUR GBP JPY CAD AUD — reject unknown → INVALID_CURRENCY
- mask_account: `***-{acct[-4:]}`
- On valid: write to `shared/output/{message_id}.json`
- On rejected: write to `shared/results/{message_id}.json` with status=rejected
- Support `--dry-run` flag (validates without writing files, prints table to stdout)

For Fraud Detector details:
- Scoring: amount > $50k → +4pts; amount > $10k and ≤ $50k → +3pts; hour in 2–5 UTC → +2pts; metadata.country != "US" → +1pt
- Risk levels: LOW (0–2), MEDIUM (3–6), HIGH (7–10)
- Adds: fraud_risk_score, fraud_risk_level to message.data
- Reads from shared/output/, writes result to shared/output/ (for next agent)

For Compliance Checker details:
- ctr_required = True if amount > $10,000
- aml_flag = True if: fraud_risk_level == "HIGH" OR amount in [$9,000, $10,000] (structuring)
- compliance_status = "REVIEW_REQUIRED" if aml_flag or ctr_required, else "CLEAR"
- Writes final result to `shared/results/{message_id}.json`

## Step 3: Write `homework-6/agents.md`

Include:
- **Author: Serhii Kindyk**
- Project overview and pipeline flow diagram (text)
- Standard JSON message format (full schema with all fields)
- Shared directory protocol table (input/processing/output/results)
- Technology constraints (Decimal, ISO 4217, PII masking, ISO 8601)
- Test requirements (pytest, 80% gate, 90% target, tmp_path for isolation)
- Meta-agent table (spec-writer, code-generator, skills-and-hooks, test-and-docs with their .md file paths)

## Step 4: Confirm

Print: "Spec Writer complete: specification.md and agents.md written to homework-6/"
