---
name: Run Pipeline
description: Runs the full banking transaction pipeline end-to-end and shows a results summary
agent: Pipeline Orchestrator
---

Run the multi-agent banking pipeline end-to-end:

1. Verify `sample-transactions.json` exists in the homework-6 directory
2. Clear shared/ directories — delete all `.json` files from `shared/input/`, `shared/processing/`, `shared/output/`, `shared/results/` (keep the directory structure)
3. Run the pipeline: `npm run pipeline` in the homework-6 directory
4. Show a results summary:
   - Total transactions processed
   - Approved count
   - Rejected count (list each: transaction_id + reason)
   - Compliance hold count (list each: transaction_id + flags)
5. Report any errors encountered during the run
