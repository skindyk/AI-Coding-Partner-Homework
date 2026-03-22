---
name: Write Spec
description: Invokes the Spec Writer agent to generate specification.md and agents.md from the template
agent: Spec Writer
---

Use `specification-TEMPLATE-hint.md` as the template. Read `sample-transactions.json` to ground the specification in real data.

Generate `specification.md` with all 5 required sections:
1. High-Level Objective (one sentence)
2. Mid-Level Objectives (5+ testable requirements)
3. Implementation Notes (decimal.js, ISO 4217, PII masking, ISO 8601 logging)
4. Context (beginning and ending state)
5. Low-Level Tasks (one entry per agent: Transaction Validator, Fraud Detector, Compliance Checker)

Also generate `agents.md` describing all 4 meta-agents and 3 pipeline agents.
