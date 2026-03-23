# AI-Powered Multi-Agent Banking Pipeline

**Author:** Serhii Kindyk

This project demonstrates a multi-agent pipeline architecture for automated banking transaction processing. Each agent in the pipeline performs a distinct role — validation, fraud detection, and compliance checking — communicating through file-based JSON message passing via a shared directory tree. The system is designed to process all transactions in `sample-transactions.json`, reject invalid ones early, and produce a complete audit trail with PII masking.

The pipeline was built using a team of AI meta-agents coordinating through Claude Code skills. A spec-writer agent defined the requirements, a code-generator agent produced the implementation, a skills-and-hooks agent wired up the MCP tooling, and this test-and-docs agent wrote the test suite and documentation. All monetary calculations use Python's `decimal.Decimal` to avoid floating-point imprecision.

---

## Agent Responsibilities

### Meta-Agents (Claude Code Skills)

- **spec-writer**: Generates the `specification.md` from high-level requirements, defining rules for validation, fraud scoring, and compliance thresholds.
- **code-generator**: Implements the three pipeline agents (`transaction_validator.py`, `fraud_detector.py`, `compliance_checker.py`) and the `integrator.py` orchestrator based on the specification.
- **skills-and-hooks**: Registers Claude Code skills (`/run-pipeline`, `/validate-transactions`) and configures the MCP server for tool-assisted pipeline execution.
- **test-and-docs**: Writes the pytest test suite, checks coverage, and produces `README.md` and `HOWTORUN.md`.

### Pipeline Agents

- **transaction_validator**: Validates required fields, parses amounts as `Decimal`, checks currency against the ISO 4217 whitelist (USD, EUR, GBP, JPY, CAD, AUD), and rejects invalid transactions to `shared/results/`. Valid transactions proceed to `shared/output/`.
- **fraud_detector**: Applies an additive scoring model (amount thresholds, unusual transaction hours 02:00–05:59 UTC, cross-border indicator) to assign a risk level: LOW (0–2), MEDIUM (3–6), or HIGH (7–10).
- **compliance_checker**: Evaluates CTR requirements (amount > $10,000), AML structuring flags (amount in $9,000–$10,000 range or HIGH fraud risk), and writes the final result with `compliance_status` to `shared/results/`.

---

## Architecture

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

---

## Tech Stack

| Component           | Technology                          |
|---------------------|-------------------------------------|
| Language            | Python 3.10+                        |
| Monetary arithmetic | `decimal.Decimal`                   |
| Message format      | JSON (file-based via `shared/`)     |
| Orchestration       | `integrator.py` (sequential runner) |
| MCP server          | FastMCP 2.0                         |
| Testing             | pytest + pytest-cov                 |
| CLI tools           | argparse (`--dry-run`)              |
| AI tooling          | Claude Code skills / hooks          |

---

## Quick Start

```bash
# 1. Enter the project directory
cd homework-6

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
.venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the full pipeline
python integrator.py

# 5. Inspect results
ls shared/results/

# 6. Run tests with coverage
python -m pytest tests/ --cov=agents --cov-report=term-missing -v

# 7. Start the MCP server
python mcp/server.py
```
