Validate all transactions in sample-transactions.json without processing them (dry-run).

Steps:
1. Run: `python homework-6/agents/transaction_validator.py --dry-run`
2. Parse the stdout output
3. Report:
   - Total transactions scanned: 8
   - Valid: X (list transaction_ids)
   - Invalid: X (list transaction_ids and rejection reasons)
4. Display formatted table:
   | transaction_id | valid | rejection_reason |
5. Note: dry-run mode — no files written to shared/ directories
