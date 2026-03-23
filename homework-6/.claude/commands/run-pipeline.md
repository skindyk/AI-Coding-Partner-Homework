Run the multi-agent banking pipeline end-to-end.

Steps:
1. Check that homework-6/sample-transactions.json exists; if not, report error and stop
2. Clear previous results: delete all files in homework-6/shared/input/, shared/processing/, shared/output/, shared/results/ (keep directories)
3. Run: `python homework-6/integrator.py`
4. Read all JSON files in homework-6/shared/results/ and display summary table:
   | transaction_id | status | fraud_risk_level | ctr_required | compliance_status |
5. Report rejected transactions with their rejection_reason
6. Print final counts: total=8, validated=X, rejected=X, high-risk=X, CTR-required=X
