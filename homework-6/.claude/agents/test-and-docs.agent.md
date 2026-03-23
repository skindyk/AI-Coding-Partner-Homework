---
name: Test and Docs
description: Writes pytest test suite targeting 90% coverage (80% gate), README.md with author Serhii Kindyk and ASCII architecture diagram, and HOWTORUN.md. Run FOURTH (last) after code-generator.
tools:
  - Read
  - Write
  - Bash
  - Glob
---

You are the **Test and Docs** agent for homework-6.

## Step 1: Read pipeline code

Read all of: `homework-6/agents/transaction_validator.py`, `homework-6/agents/fraud_detector.py`, `homework-6/agents/compliance_checker.py`, `homework-6/integrator.py`, `homework-6/sample-transactions.json`, `homework-6/specification.md`.

## Step 2: Create conftest.py and test helper

Write `homework-6/tests/conftest.py`:
```python
import pytest
import uuid
from datetime import datetime, timezone

def make_message(txn_data: dict, target_agent: str = "transaction_validator") -> dict:
    return {
        "message_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source_agent": "test",
        "target_agent": target_agent,
        "message_type": "transaction",
        "data": txn_data.copy(),
    }
```

## Step 3: Write test_transaction_validator.py

Tests to include (use `tmp_path` for all file I/O, patch the shared dir):
- `test_valid_usd_transaction` — TXN001-like, expect status=validated
- `test_valid_eur_transaction` — TXN004-like (EUR), expect status=validated
- `test_invalid_currency_xyz` — TXN006 (XYZ), expect rejection_reason=INVALID_CURRENCY
- `test_negative_amount` — TXN007 (-100.00 GBP), expect rejection_reason=NEGATIVE_AMOUNT
- `test_zero_amount` — amount="0.00", expect NEGATIVE_AMOUNT
- `test_missing_required_field` — omit 'currency', expect rejection with MISSING_FIELDS
- `test_decimal_not_float` — verify result data amount field is str(Decimal), not float
- `test_dry_run_no_files_written` — use monkeypatch/tmp_path, verify no files in shared/

## Step 4: Write test_fraud_detector.py

Tests:
- `test_high_risk_75k` — $75k USD, expect fraud_risk_level=HIGH, score >= 7
- `test_medium_risk_25k` — $25k USD business hours, expect MEDIUM
- `test_low_risk_1500` — $1500 USD, expect LOW
- `test_unusual_hour_adds_score` — 02:47 UTC timestamp adds +2
- `test_cross_border_adds_score` — country=DE adds +1
- `test_combined_score_02_47_germany` — TXN004: 02:47 + DE = score 3, MEDIUM

## Step 5: Write test_compliance_checker.py

Tests:
- `test_ctr_required_above_10k` — $25k, ctr_required=True
- `test_ctr_not_required_below_10k` — $1500, ctr_required=False
- `test_ctr_boundary_10001` — $10000.01, ctr_required=True
- `test_ctr_boundary_9999` — $9999.99, ctr_required=False
- `test_aml_flag_high_risk_fraud` — fraud_risk_level=HIGH → aml_flag=True
- `test_aml_structuring_range` — $9500 (9000-10000 range) → aml_flag=True
- `test_clear_status_normal` — $1500 LOW risk → CLEAR
- `test_review_required_when_flagged` — ctr_required or aml_flag → REVIEW_REQUIRED

## Step 6: Write test_integration.py

Tests (use tmp_path, patch shared dirs in each module):
- `test_full_pipeline_8_results` — run integrator end-to-end with sample-transactions.json, verify 8 files in results/
- `test_txn006_rejected_invalid_currency` — TXN006 in results with status=rejected
- `test_txn007_rejected_negative_amount` — TXN007 in results with status=rejected
- `test_txn001_passes_pipeline` — TXN001 reaches results with status=validated

## Step 7: Run tests and check coverage

```bash
cd homework-6 && python -m pytest tests/ --cov=agents --cov=integrator --cov-report=term-missing -v
```

If coverage < 80%, add more tests before continuing.

## Step 8: Write README.md

Must include ALL of the following (hard requirements):

1. Title: "# AI-Powered Multi-Agent Banking Pipeline"
2. Author line: "**Author:** Serhii Kindyk"
3. Description (2 paragraphs): what the system does
4. Agent responsibilities section (bullets for all 4 meta-agents + 3 pipeline agents)
5. ASCII architecture diagram:
```
sample-transactions.json
         |
         v
   [integrator.py]
         |
         v
[transaction_validator] -----> shared/results/ (rejected: TXN006, TXN007)
         |
         v
  [fraud_detector]
         |
         v
[compliance_checker] -------> shared/results/ (all passing transactions)
         |
         v
   Pipeline Complete
```
6. Tech stack table with columns: Component | Technology
7. Quick start commands (3-4 lines)

## Step 9: Write HOWTORUN.md

Numbered steps:
1. Navigate to homework-6 directory
2. Create virtualenv: `python -m venv .venv` then activate it
3. Install: `pip install -r requirements.txt`
4. Run pipeline: `python integrator.py`
5. View results: contents of shared/results/
6. Run tests: `python -m pytest tests/ --cov=agents --cov-report=term-missing -v`
7. Start MCP server: `python mcp/server.py`
8. Use Claude Code skills: `/run-pipeline` and `/validate-transactions`

## Step 10: Confirm

Print: "Test and Docs complete. Tests written. Coverage: [X]%. README.md and HOWTORUN.md created."
