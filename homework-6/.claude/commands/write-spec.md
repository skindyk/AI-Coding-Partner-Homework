Generate the banking pipeline specification from the template.

Steps:
1. Read homework-6/specification-TEMPLATE-hint.md
2. Read homework-6/TASKS.md
3. Read homework-6/sample-transactions.json (8 transactions — note edge cases: TXN006 invalid currency XYZ, TXN007 negative amount, TXN005 $75k high value, TXN004 02:47 UTC unusual hour)
4. Write homework-6/specification.md with all 5 required sections:
   - High-Level Objective (one sentence)
   - Mid-Level Objectives (5 testable requirements)
   - Implementation Notes (decimal.Decimal, ISO 4217, logging, PII masking)
   - Context (beginning state → ending state)
   - Low-Level Tasks for each pipeline agent using Task/Prompt/File/Function/Details format
5. Write homework-6/agents.md with project AI context including message format, shared/ directory protocol, and tech constraints
6. Confirm: print summary of both files created
