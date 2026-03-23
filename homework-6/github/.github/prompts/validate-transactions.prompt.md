---
name: Validate Transactions
description: Validates all transactions in sample-transactions.json in dry-run mode without running the full pipeline
agent: Pipeline Orchestrator
---

Validate all transactions in `sample-transactions.json` without processing them through the full pipeline:

1. Read `sample-transactions.json`
2. Run only the Transaction Validator logic against each transaction (dry-run — no file writes, no fraud detection, no compliance checking)
3. Report a summary: total count, valid count, invalid count
4. Show a results table:

| Transaction ID | Amount | Currency | Status | Reason |
|---|---|---|---|---|
| TXN001 | 1500.00 | USD | VALID | — |
| TXN006 | 200.00 | XYZ | INVALID | INVALID_CURRENCY |
| TXN007 | -100.00 | GBP | INVALID | INVALID_AMOUNT |

5. Highlight any transactions that would be rejected and explain why
