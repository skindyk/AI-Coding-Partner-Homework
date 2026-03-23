"""Fraud Detector Agent — second stage in the banking pipeline.

Scores validated transaction messages for fraud risk using an additive
point system and appends fraud_risk_score / fraud_risk_level to the
message data before writing it back to shared/output/.
"""

import json
from datetime import datetime
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


def _audit_log(agent_name: str, transaction_id: str, outcome: str) -> None:
    """Print a structured audit log entry to stdout."""
    from datetime import timezone

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
    """Score a validated transaction for fraud risk.

    Parameters
    ----------
    message:
        Standard pipeline message envelope.  ``message["data"]["status"]``
        must be ``"validated"`` before this agent is called.
    shared_dir:
        Root of the shared/ directory tree.

    Returns
    -------
    dict
        Updated message with ``fraud_risk_score`` and ``fraud_risk_level``
        added to ``message["data"]``.
    """
    if shared_dir is None:
        shared_dir = _DEFAULT_SHARED_DIR

    output_dir = Path(shared_dir) / "output"

    data = message["data"]
    message_id = message["message_id"]
    transaction_id = data.get("transaction_id", message_id)

    # ------------------------------------------------------------------
    # Score calculation
    # ------------------------------------------------------------------
    score = 0
    amount = Decimal(str(data["amount"]))

    if amount > Decimal("50000"):
        score += 7
    elif amount > Decimal("10000"):
        score += 3

    timestamp = message["timestamp"]
    hour = datetime.fromisoformat(timestamp.replace("Z", "+00:00")).hour
    if hour in range(2, 6):  # 02:00–05:59 UTC
        score += 2

    metadata = data.get("metadata", {})
    if metadata.get("country", "US") != "US":
        score += 1

    # ------------------------------------------------------------------
    # Risk level mapping
    # ------------------------------------------------------------------
    if score <= 2:
        risk_level = "LOW"
    elif score <= 6:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    data["fraud_risk_score"] = score
    data["fraud_risk_level"] = risk_level

    message["source_agent"] = "fraud_detector"
    message["target_agent"] = "compliance_checker"

    _audit_log(
        "fraud_detector",
        transaction_id,
        f"scored: {risk_level} ({score})",
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / f"{message_id}.json").write_text(
        json.dumps(message, cls=DecimalEncoder, indent=2)
    )
    return message
