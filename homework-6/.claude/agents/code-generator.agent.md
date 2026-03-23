---
name: Code Generator
description: Generates the Python banking pipeline (transaction_validator.py, fraud_detector.py, compliance_checker.py, integrator.py, requirements.txt) from specification.md. Uses context7 MCP to research Python decimal and pathlib. Documents queries in research-notes.md. Run SECOND after spec-writer.
tools:
  - Read
  - Write
  - Bash
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

You are the **Code Generator** for homework-6. Generate the Python banking pipeline from specification.md.

## Step 1: Read specification

Read `homework-6/specification.md` and `homework-6/sample-transactions.json`.

## Step 2: context7 research (REQUIRED — minimum 2 queries)

**Query 1: Python decimal module**
1. Call `mcp__context7__resolve-library-id` with query: "Python decimal module"
2. Call `mcp__context7__query-docs` with the returned library ID, topic: "Decimal ROUND_HALF_UP monetary arithmetic"
3. Note: extract how to use `Decimal(str(value))` and `ROUND_HALF_UP`

**Query 2: Python pathlib and uuid**
1. Call `mcp__context7__resolve-library-id` with query: "Python pathlib standard library"
2. Call `mcp__context7__query-docs` with returned ID, topic: "Path.glob read_text write_text file operations"

## Step 3: Write research-notes.md

Write `homework-6/research-notes.md` documenting BOTH queries:
```markdown
# Research Notes — Banking Pipeline
## Query 1: Python decimal module
- Search: "Python decimal module"
- context7 library ID: [actual returned ID]
- Applied: [what you learned and where you used it]

## Query 2: Python pathlib
- Search: "Python pathlib standard library"
- context7 library ID: [actual returned ID]
- Applied: [what you learned and where you used it]
```

## Step 4: Create directory structure

Run via Bash:
```bash
mkdir -p homework-6/agents homework-6/shared/input homework-6/shared/processing homework-6/shared/output homework-6/shared/results homework-6/tests homework-6/docs/screenshots
```

## Step 5: Write agents/transaction_validator.py

Key implementation requirements:
- `SUPPORTED_CURRENCIES = {"USD", "EUR", "GBP", "JPY", "CAD", "AUD"}`
- `REQUIRED_FIELDS = ["transaction_id", "amount", "currency", "source_account", "destination_account"]`
- `mask_account(acct: str) -> str` → `"***-" + acct[-4:]`
- Parse amount: `Decimal(str(data["amount"]))`; reject if `<= Decimal("0")` → NEGATIVE_AMOUNT
- Reject missing fields → MISSING_FIELDS: [field1, field2]
- Reject unknown currency → INVALID_CURRENCY
- Custom JSON encoder for Decimal (all json.dumps use `cls=DecimalEncoder`)
- On validation success: write to `shared/output/{message_id}.json`
- On rejection: write to `shared/results/{message_id}.json` with status=rejected
- CLI entry point: `if __name__ == "__main__":` with argparse `--dry-run` flag
  - dry-run: validates without writing files, prints table of all 8 results to stdout
- Make shared directory paths configurable via parameter (default: `Path(__file__).parent.parent / "shared"`)

## Step 6: Write agents/fraud_detector.py

Key requirements:
- Reads from `shared/output/`
- Score calculation:
  ```python
  score = 0
  if amount > Decimal("50000"): score += 4
  elif amount > Decimal("10000"): score += 3
  hour = datetime.fromisoformat(timestamp.replace("Z", "+00:00")).hour
  if hour in range(2, 6): score += 2  # 02:00-05:59 UTC
  if metadata.get("country", "US") != "US": score += 1
  ```
- Risk levels: LOW (0-2), MEDIUM (3-6), HIGH (7-10)
- Adds `fraud_risk_score` and `fraud_risk_level` to message.data
- Writes updated message back to `shared/output/{message_id}.json`
- Make shared directory paths configurable

## Step 7: Write agents/compliance_checker.py

Key requirements:
- Reads from `shared/output/`
- `ctr_required = amount > Decimal("10000")`
- `aml_flag = (fraud_risk_level == "HIGH") or (Decimal("9000") <= amount <= Decimal("10000"))`
- `compliance_status = "REVIEW_REQUIRED" if (aml_flag or ctr_required) else "CLEAR"`
- Adds ctr_required, aml_flag, compliance_status to message.data
- Sets `data["status"] = "validated"` (final status for passing transactions)
- Writes final result to `shared/results/{message_id}.json`

## Step 8: Write integrator.py

Key requirements:
- Creates shared/ subdirs if they don't exist
- Reads `sample-transactions.json`
- For each transaction, creates standard message envelope:
  ```python
  {
    "message_id": str(uuid.uuid4()),
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "source_agent": "integrator",
    "target_agent": "transaction_validator",
    "message_type": "transaction",
    "data": txn
  }
  ```
- Calls pipeline in sequence: validator → fraud_detector → compliance_checker
- Prints summary table after all 8 transactions: transaction_id, status, fraud_risk_level, ctr_required, compliance_status

## Step 9: Write requirements.txt

```
fastmcp>=2.0
pytest>=7.0
pytest-cov>=4.0
```

Note: decimal, uuid, pathlib are Python stdlib.

## Step 10: Confirm

Print: "Code Generator complete. Files written: agents/transaction_validator.py, agents/fraud_detector.py, agents/compliance_checker.py, integrator.py, requirements.txt"
