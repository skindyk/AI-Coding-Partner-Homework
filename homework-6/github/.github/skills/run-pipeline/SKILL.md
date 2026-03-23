---
name: run-pipeline
description: Runs the multi-agent banking transaction pipeline end-to-end and reports results
argument-hint: "optional: specific transaction ID to trace through the pipeline"
---

# Run Pipeline Skill

Use when you want to execute the full banking pipeline and see results.

## Steps

1. **Check preconditions**: Verify `sample-transactions.json` exists in homework-6/
2. **Clear shared directories**: Delete all `.json` files from `shared/input/`, `shared/processing/`, `shared/output/`, `shared/results/` — keep the directory structure intact
3. **Run the pipeline**: Execute `npm run pipeline` in the homework-6 directory
4. **Show results summary**:
   - Total transactions processed
   - Approved count (list transaction IDs)
   - Rejected count with reasons
   - Compliance hold count with flags
5. **Report errors**: If the pipeline exits with an error, show the full error output

## Expected Output Format

```
Pipeline Summary
----------------
Total processed: 8
Approved: 4 (TXN001, TXN004, TXN008, ...)
Rejected: 2
  - TXN006: INVALID_CURRENCY
  - TXN007: INVALID_AMOUNT
Compliance hold: 2
  - TXN002: CTR_REQUIRED
  - TXN005: CTR_REQUIRED, FRAUD_REVIEW
```

## Expected Sample Results

Based on `sample-transactions.json`:
- TXN001 (USD $1,500) → approved
- TXN002 (USD $25,000 wire) → compliance_hold (CTR_REQUIRED)
- TXN003 (USD $9,999.99, ACC-9999) → compliance_hold (WATCHLIST_HIT)
- TXN004 (EUR $500, 02:47 DE) → approved (MEDIUM fraud, no compliance flags)
- TXN005 (USD $75,000 wire) → compliance_hold (FRAUD_REVIEW + CTR_REQUIRED)
- TXN006 (XYZ $200) → rejected (INVALID_CURRENCY)
- TXN007 (GBP -$100) → rejected (INVALID_AMOUNT)
- TXN008 (USD $3,200) → approved
