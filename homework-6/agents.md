# AI-Powered Multi-Agent Banking Pipeline — Project Context

**Author: Serhii Kindyk**

## Project Overview

This project implements a 3-agent Python banking transaction pipeline orchestrated by 4 Claude Code meta-agents. The pipeline validates transactions, scores them for fraud risk, and performs compliance checks using file-based JSON message passing through shared directories.

## Pipeline Flow Diagram

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

## Standard JSON Message Format

All agents communicate via JSON files with this schema:

```json
{
  "message_id": "uuid4-string",
  "timestamp": "2026-03-16T10:00:00Z",
  "source_agent": "transaction_validator",
  "target_agent": "fraud_detector",
  "message_type": "transaction",
  "data": {
    "transaction_id": "TXN001",
    "amount": "1500.00",
    "currency": "USD",
    "source_account": "ACC-1001",
    "destination_account": "ACC-2001",
    "status": "validated",
    "fraud_risk_score": 0,
    "fraud_risk_level": "LOW",
    "ctr_required": false,
    "aml_flag": false,
    "compliance_status": "CLEAR"
  }
}
```

## Shared Directory Protocol

| Directory | Purpose | Written by | Read by |
|---|---|---|---|
| `shared/input/` | Initial transaction drops | integrator.py | transaction_validator |
| `shared/processing/` | In-flight messages | any agent | any agent |
| `shared/output/` | Intermediate results | validator / fraud_detector | fraud_detector / compliance_checker |
| `shared/results/` | Final outcomes | compliance_checker / validator (rejects) | MCP server / /run-pipeline skill |

## Technology Constraints

- **Monetary values**: `decimal.Decimal` only — never `float`
- **Currency codes**: ISO 4217 whitelist: `USD, EUR, GBP, JPY, CAD, AUD`
- **PII masking**: Account numbers masked in all logs — `ACC-1001 → ***-1001`
- **Timestamps**: ISO 8601 format with UTC timezone
- **JSON serialization**: Custom `DecimalEncoder` — `Decimal` → `str`

## Test Requirements

- Framework: `pytest` with `pytest-cov`
- Coverage gate: ≥ 80% (blocks push)
- Coverage target: ≥ 90%
- File isolation: use `tmp_path` fixture — never write to real `shared/` in tests

## Meta-Agent Table

| Agent | File | Role | Run Order |
|---|---|---|---|
| Spec Writer | `.claude/agents/spec-writer.agent.md` | Generates specification.md and agents.md | 1st |
| Code Generator | `.claude/agents/code-generator.agent.md` | Generates pipeline Python code | 2nd |
| Skills and Hooks | `.claude/agents/skills-and-hooks.agent.md` | Installs pre-push hook, verifies skills | 3rd |
| Test and Docs | `.claude/agents/test-and-docs.agent.md` | Writes tests, README.md, HOWTORUN.md | 4th |

## Pipeline Agent Table

| Agent | File | Input | Output |
|---|---|---|---|
| Transaction Validator | `agents/transaction_validator.py` | raw transaction from integrator | valid → shared/output/, rejected → shared/results/ |
| Fraud Detector | `agents/fraud_detector.py` | shared/output/ | shared/output/ (with fraud scores added) |
| Compliance Checker | `agents/compliance_checker.py` | shared/output/ | shared/results/ (final result) |

## Validation Rules

| Check | Condition | Rejection Reason |
|---|---|---|
| Required fields | Any of transaction_id, amount, currency, source_account, destination_account missing | `MISSING_FIELD` |
| Positive amount | `Decimal(str(amount)) <= 0` | `NEGATIVE_AMOUNT` |
| Currency whitelist | Currency not in USD, EUR, GBP, JPY, CAD, AUD | `INVALID_CURRENCY` |

**Known rejection cases from sample-transactions.json:**
- TXN006: currency "XYZ" → `INVALID_CURRENCY`
- TXN007: amount -100.00 → `NEGATIVE_AMOUNT`

## Fraud Scoring Rules

| Condition | Points |
|---|---|
| amount > $50,000 | +4 |
| $10,000 < amount <= $50,000 | +3 |
| Transaction hour 02:00–05:00 UTC | +2 |
| metadata.country != "US" | +1 |

| Score Range | Risk Level |
|---|---|
| 0–2 | LOW |
| 3–6 | MEDIUM |
| 7–10 | HIGH |

**Known HIGH-risk case:** TXN005 ($75,000) → score >= 7 → `HIGH`

## Compliance Rules

| Field | Condition | Value |
|---|---|---|
| `ctr_required` | amount > $10,000 | `true` |
| `aml_flag` | fraud_risk_level == "HIGH" OR $9,000 <= amount <= $10,000 | `true` |
| `compliance_status` | aml_flag OR ctr_required | `"REVIEW_REQUIRED"`, else `"CLEAR"` |

**Known CTR cases:** TXN002 ($25,000) and TXN005 ($75,000) → `ctr_required: true`

## Expected Pipeline Results Summary

| TXN | Amount | Currency | Validator | Fraud Level | CTR | AML | Compliance |
|---|---|---|---|---|---|---|---|
| TXN001 | $1,500 | USD | validated | LOW | false | false | CLEAR |
| TXN002 | $25,000 | USD | validated | MEDIUM | true | false | REVIEW_REQUIRED |
| TXN003 | $9,999.99 | USD | validated | LOW | false | false | CLEAR |
| TXN004 | $500 | EUR | validated | MEDIUM (odd hour+foreign) | false | false | CLEAR |
| TXN005 | $75,000 | USD | validated | HIGH | true | true | REVIEW_REQUIRED |
| TXN006 | $200 | XYZ | rejected: INVALID_CURRENCY | — | — | — | — |
| TXN007 | -$100 | GBP | rejected: NEGATIVE_AMOUNT | — | — | — | — |
| TXN008 | $3,200 | USD | validated | LOW | false | false | CLEAR |
