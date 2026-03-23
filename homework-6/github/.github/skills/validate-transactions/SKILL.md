---
name: validate-transactions
description: Validates all transactions in sample-transactions.json in dry-run mode without running the full pipeline
argument-hint: "optional: path to a different transactions file"
---

# Validate Transactions Skill

Use when you want to check which transactions are valid before running the full pipeline.
This is a dry-run — no file writes, no fraud detection, no compliance checking.

## Steps

1. Read `sample-transactions.json` (or the file provided as argument)
2. For each transaction, run validation checks only:
   - All required fields present: `transaction_id`, `timestamp`, `source_account`, `destination_account`, `amount`, `currency`
   - Amount is a valid positive number (parseable as `new Decimal(amount)`, greater than zero)
   - Currency code is in the ISO 4217 whitelist: `USD`, `EUR`, `GBP`, `JPY`, `CAD`, `AUD`, `CHF`
3. Report totals: total count, valid count, invalid count
4. Show results as a markdown table

## Expected Table Format

| Transaction ID | Amount | Currency | Status | Reason |
|---|---|---|---|---|
| TXN001 | 1500.00 | USD | VALID | — |
| TXN002 | 25000.00 | USD | VALID | — |
| TXN003 | 9999.99 | USD | VALID | — |
| TXN004 | 500.00 | EUR | VALID | — |
| TXN005 | 75000.00 | USD | VALID | — |
| TXN006 | 200.00 | XYZ | INVALID | INVALID_CURRENCY |
| TXN007 | -100.00 | GBP | INVALID | INVALID_AMOUNT |
| TXN008 | 3200.00 | USD | VALID | — |

**Total**: 8 | **Valid**: 6 | **Invalid**: 2
