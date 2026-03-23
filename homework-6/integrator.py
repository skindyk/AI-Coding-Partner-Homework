"""Banking Pipeline Integrator.

Reads all transactions from sample-transactions.json, wraps each one in a
standard message envelope, and passes it through the 3-agent pipeline:

    transaction_validator → fraud_detector → compliance_checker

Results are written to shared/results/.  A summary table is printed when
all transactions have been processed.
"""

import json
import sys
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

# ---------------------------------------------------------------------------
# Path setup — ensure the agents package is importable
# ---------------------------------------------------------------------------

_HERE = Path(__file__).parent
sys.path.insert(0, str(_HERE))

from agents import compliance_checker, fraud_detector, transaction_validator  # noqa: E402

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


class DecimalEncoder(json.JSONEncoder):
    """Serialize Decimal values as strings so they round-trip losslessly."""

    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)


# ---------------------------------------------------------------------------
# Pipeline execution
# ---------------------------------------------------------------------------


def run_pipeline() -> None:
    """Execute the full 3-agent pipeline for all sample transactions."""

    shared_dir = _HERE / "shared"

    # Ensure all shared sub-directories exist
    for sub in ("input", "processing", "output", "results"):
        (shared_dir / sub).mkdir(parents=True, exist_ok=True)

    sample_path = _HERE / "sample-transactions.json"
    transactions = json.loads(sample_path.read_text())

    results: list[dict] = []

    for txn in transactions:
        # Build standard message envelope
        message = {
            "message_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_agent": "integrator",
            "target_agent": "transaction_validator",
            "message_type": "transaction",
            "data": txn,
        }

        # Stage 1 — Transaction Validator
        result = transaction_validator.process_message(message, shared_dir)

        # Stage 2 — Fraud Detector (only for non-rejected messages)
        if result["data"]["status"] != "rejected":
            result = fraud_detector.process_message(result, shared_dir)

        # Stage 3 — Compliance Checker (only for non-rejected messages)
        if result["data"]["status"] != "rejected":
            result = compliance_checker.process_message(result, shared_dir)

        results.append(result)

    # ------------------------------------------------------------------
    # Summary table
    # ------------------------------------------------------------------
    print()
    header = (
        f"{'transaction_id':<15} "
        f"{'status':<12} "
        f"{'fraud_risk_level':<18} "
        f"{'ctr_required':<14} "
        f"{'compliance_status'}"
    )
    print(header)
    print("-" * len(header))

    for res in results:
        data = res["data"]
        txn_id = data.get("transaction_id", res["message_id"])
        status = data.get("status", "")
        risk_level = data.get("fraud_risk_level", "N/A")
        ctr = str(data.get("ctr_required", "N/A"))
        compliance = data.get("compliance_status", "N/A")

        print(
            f"{txn_id:<15} "
            f"{status:<12} "
            f"{risk_level:<18} "
            f"{ctr:<14} "
            f"{compliance}"
        )


if __name__ == "__main__":
    run_pipeline()
