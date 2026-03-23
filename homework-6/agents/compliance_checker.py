"""Compliance Checker Agent — third and final stage in the banking pipeline.

Applies regulatory rules (CTR threshold and AML structuring detection) to
fraud-scored transactions and writes the terminal result to shared/results/.
"""

import json
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

_DEFAULT_SHARED_DIR = Path(__file__).parent.parent / "shared"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


class DecimalEncoder(json.JSONEncoder):
    """Serialize Decimal values as strings so they round-trip losslessly."""

    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)


def mask_account(acct: str) -> str:
    """Return a masked account string: ***-<last 4 chars>."""
    return "***-" + acct[-4:]


def _audit_log(agent_name: str, transaction_id: str, outcome: str) -> None:
    """Print a structured audit log entry to stdout."""
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_name": agent_name,
        "transaction_id": transaction_id,
        "outcome": outcome,
    }
    print(json.dumps(entry, cls=DecimalEncoder))


# ---------------------------------------------------------------------------
# Core processing
# ---------------------------------------------------------------------------


def process_message(message: dict, shared_dir: Path = None) -> dict:
    """Perform compliance checks on a fraud-scored transaction.

    Parameters
    ----------
    message:
        Standard pipeline message envelope.  ``message["data"]`` must already
        contain ``fraud_risk_score`` and ``fraud_risk_level`` from the Fraud
        Detector agent.
    shared_dir:
        Root of the shared/ directory tree.

    Returns
    -------
    dict
        Updated message with ``ctr_required``, ``aml_flag``, and
        ``compliance_status`` added to ``message["data"]``.  The terminal
        result file is written to ``shared/results/``.
    """
    if shared_dir is None:
        shared_dir = _DEFAULT_SHARED_DIR

    results_dir = Path(shared_dir) / "results"

    data = message["data"]
    message_id = message["message_id"]
    transaction_id = data.get("transaction_id", message_id)

    amount = Decimal(str(data["amount"]))

    # ------------------------------------------------------------------
    # Regulatory rule evaluation
    # ------------------------------------------------------------------
    ctr_required = amount > Decimal("10000")

    aml_flag = (data.get("fraud_risk_level") == "HIGH") or (
        Decimal("9000") <= amount <= Decimal("10000")
    )

    compliance_status = "REVIEW_REQUIRED" if (aml_flag or ctr_required) else "CLEAR"

    data["ctr_required"] = ctr_required
    data["aml_flag"] = aml_flag
    data["compliance_status"] = compliance_status
    data["status"] = "validated"

    message["source_agent"] = "compliance_checker"
    message["target_agent"] = "pipeline_complete"

    # Masked account numbers for log
    src = mask_account(data.get("source_account", "????"))
    dst = mask_account(data.get("destination_account", "????"))

    _audit_log(
        "compliance_checker",
        transaction_id,
        f"{compliance_status} (src={src}, dst={dst})",
    )

    results_dir.mkdir(parents=True, exist_ok=True)
    (results_dir / f"{message_id}.json").write_text(
        json.dumps(message, cls=DecimalEncoder, indent=2)
    )
    return message
