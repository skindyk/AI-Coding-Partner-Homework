"""Transaction Validator Agent — first stage in the banking pipeline.

Validates incoming transaction messages for required fields, positive amount,
and supported currency. Writes accepted messages to shared/output/ and rejected
messages to shared/results/.
"""

import argparse
import json
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SUPPORTED_CURRENCIES = {"USD", "EUR", "GBP", "JPY", "CAD", "AUD"}
REQUIRED_FIELDS = [
    "transaction_id",
    "amount",
    "currency",
    "source_account",
    "destination_account",
]

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
    """Validate a single transaction message.

    Parameters
    ----------
    message:
        Standard pipeline message envelope containing a ``data`` payload.
    shared_dir:
        Root of the shared/ directory tree.  Defaults to the sibling
        ``shared/`` directory next to the ``agents/`` package.

    Returns
    -------
    dict
        The (possibly mutated) message with ``data["status"]`` set to either
        ``"validated"`` or ``"rejected"``.
    """
    if shared_dir is None:
        shared_dir = _DEFAULT_SHARED_DIR

    output_dir = Path(shared_dir) / "output"
    results_dir = Path(shared_dir) / "results"

    data = message["data"]
    message_id = message["message_id"]
    transaction_id = data.get("transaction_id", message_id)

    # ------------------------------------------------------------------
    # 1. Required-field check
    # ------------------------------------------------------------------
    missing = [f for f in REQUIRED_FIELDS if f not in data]
    if missing:
        rejection_reason = f"MISSING_FIELDS: {missing}"
        data["status"] = "rejected"
        data["rejection_reason"] = rejection_reason
        message["source_agent"] = "transaction_validator"
        message["target_agent"] = "pipeline_complete"

        _audit_log("transaction_validator", transaction_id, f"rejected: {rejection_reason}")

        results_dir.mkdir(parents=True, exist_ok=True)
        (results_dir / f"{message_id}.json").write_text(
            json.dumps(message, cls=DecimalEncoder, indent=2)
        )
        return message

    # ------------------------------------------------------------------
    # 2. Amount validation
    # ------------------------------------------------------------------
    try:
        amount = Decimal(str(data["amount"]))
    except Exception:
        rejection_reason = "INVALID_AMOUNT"
        data["status"] = "rejected"
        data["rejection_reason"] = rejection_reason
        message["source_agent"] = "transaction_validator"
        message["target_agent"] = "pipeline_complete"

        _audit_log("transaction_validator", transaction_id, f"rejected: {rejection_reason}")

        results_dir.mkdir(parents=True, exist_ok=True)
        (results_dir / f"{message_id}.json").write_text(
            json.dumps(message, cls=DecimalEncoder, indent=2)
        )
        return message

    if amount <= Decimal("0"):
        rejection_reason = "NEGATIVE_AMOUNT"
        data["status"] = "rejected"
        data["rejection_reason"] = rejection_reason
        message["source_agent"] = "transaction_validator"
        message["target_agent"] = "pipeline_complete"

        _audit_log("transaction_validator", transaction_id, f"rejected: {rejection_reason}")

        results_dir.mkdir(parents=True, exist_ok=True)
        (results_dir / f"{message_id}.json").write_text(
            json.dumps(message, cls=DecimalEncoder, indent=2)
        )
        return message

    # ------------------------------------------------------------------
    # 3. Currency validation
    # ------------------------------------------------------------------
    if data["currency"] not in SUPPORTED_CURRENCIES:
        rejection_reason = "INVALID_CURRENCY"
        data["status"] = "rejected"
        data["rejection_reason"] = rejection_reason
        message["source_agent"] = "transaction_validator"
        message["target_agent"] = "pipeline_complete"

        _audit_log("transaction_validator", transaction_id, f"rejected: {rejection_reason}")

        results_dir.mkdir(parents=True, exist_ok=True)
        (results_dir / f"{message_id}.json").write_text(
            json.dumps(message, cls=DecimalEncoder, indent=2)
        )
        return message

    # ------------------------------------------------------------------
    # 4. Validation passed
    # ------------------------------------------------------------------
    data["status"] = "validated"
    message["source_agent"] = "transaction_validator"
    message["target_agent"] = "fraud_detector"

    src = mask_account(data["source_account"])
    dst = mask_account(data["destination_account"])
    _audit_log(
        "transaction_validator",
        transaction_id,
        f"validated (src={src}, dst={dst})",
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / f"{message_id}.json").write_text(
        json.dumps(message, cls=DecimalEncoder, indent=2)
    )
    return message


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------


def _dry_run() -> None:
    """Read sample-transactions.json and print a validation table without writing files."""
    sample_path = Path(__file__).parent.parent / "sample-transactions.json"
    transactions = json.loads(sample_path.read_text())

    header = f"{'transaction_id':<15} {'valid':<8} {'rejection_reason'}"
    print(header)
    print("-" * len(header))

    for txn in transactions:
        transaction_id = txn.get("transaction_id", "<unknown>")

        # Required fields
        missing = [f for f in REQUIRED_FIELDS if f not in txn]
        if missing:
            print(f"{transaction_id:<15} {'False':<8} MISSING_FIELDS: {missing}")
            continue

        # Amount
        try:
            amount = Decimal(str(txn["amount"]))
        except Exception:
            print(f"{transaction_id:<15} {'False':<8} INVALID_AMOUNT")
            continue

        if amount <= Decimal("0"):
            print(f"{transaction_id:<15} {'False':<8} NEGATIVE_AMOUNT")
            continue

        # Currency
        if txn["currency"] not in SUPPORTED_CURRENCIES:
            print(f"{transaction_id:<15} {'False':<8} INVALID_CURRENCY")
            continue

        print(f"{transaction_id:<15} {'True':<8} ")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transaction Validator Agent")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate sample transactions without writing files; print results table.",
    )
    args = parser.parse_args()

    if args.dry_run:
        _dry_run()
    else:
        parser.print_help()
