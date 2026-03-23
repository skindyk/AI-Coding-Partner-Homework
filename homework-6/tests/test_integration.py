"""Integration tests: full 3-agent pipeline using sample-transactions.json."""

import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import compliance_checker, fraud_detector, transaction_validator

SAMPLE_TRANSACTIONS_PATH = Path(__file__).parent.parent / "sample-transactions.json"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_envelope(txn: dict) -> dict:
    """Wrap a raw transaction dict in a standard pipeline message envelope."""
    return {
        "message_id": str(uuid.uuid4()),
        "timestamp": txn.get("timestamp", datetime.now(timezone.utc).isoformat()),
        "source_agent": "integrator",
        "target_agent": "transaction_validator",
        "message_type": "transaction",
        "data": dict(txn),
    }


def _run_pipeline(transactions: list, shared_dir: Path) -> list:
    """Run all 3 agents on a list of raw transaction dicts; return result messages."""
    results = []
    for txn in transactions:
        message = _make_envelope(txn)

        result = transaction_validator.process_message(message, shared_dir=shared_dir)
        if result["data"]["status"] != "rejected":
            result = fraud_detector.process_message(result, shared_dir=shared_dir)
        if result["data"]["status"] != "rejected":
            result = compliance_checker.process_message(result, shared_dir=shared_dir)

        results.append(result)
    return results


@pytest.fixture()
def pipeline_env(tmp_path):
    """Create the shared directory tree and return (tmp_path, transactions, results)."""
    (tmp_path / "input").mkdir()
    (tmp_path / "processing").mkdir()
    (tmp_path / "output").mkdir()
    (tmp_path / "results").mkdir()

    transactions = json.loads(SAMPLE_TRANSACTIONS_PATH.read_text())
    results = _run_pipeline(transactions, shared_dir=tmp_path)
    return tmp_path, transactions, results


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_full_pipeline_8_results(pipeline_env):
    """All 8 transactions produce exactly 8 result files in results/."""
    tmp_path, _, _ = pipeline_env
    result_files = list((tmp_path / "results").glob("*.json"))
    assert len(result_files) == 8


def test_txn006_rejected_invalid_currency(pipeline_env):
    """TXN006 (currency=XYZ) must be rejected with INVALID_CURRENCY."""
    tmp_path, _, _ = pipeline_env
    result_files = list((tmp_path / "results").glob("*.json"))

    txn006_result = None
    for f in result_files:
        data = json.loads(f.read_text())
        if data["data"].get("transaction_id") == "TXN006":
            txn006_result = data
            break

    assert txn006_result is not None, "TXN006 result file not found"
    assert txn006_result["data"]["status"] == "rejected"
    assert "INVALID_CURRENCY" in txn006_result["data"]["rejection_reason"]


def test_txn007_rejected_negative_amount(pipeline_env):
    """TXN007 (amount=-100.00) must be rejected."""
    tmp_path, _, _ = pipeline_env
    result_files = list((tmp_path / "results").glob("*.json"))

    txn007_result = None
    for f in result_files:
        data = json.loads(f.read_text())
        if data["data"].get("transaction_id") == "TXN007":
            txn007_result = data
            break

    assert txn007_result is not None, "TXN007 result file not found"
    assert txn007_result["data"]["status"] == "rejected"


def test_txn001_passes_pipeline(pipeline_env):
    """TXN001 ($1500 USD) must pass all stages and have compliance_status set."""
    tmp_path, _, _ = pipeline_env
    result_files = list((tmp_path / "results").glob("*.json"))

    txn001_result = None
    for f in result_files:
        data = json.loads(f.read_text())
        if data["data"].get("transaction_id") == "TXN001":
            txn001_result = data
            break

    assert txn001_result is not None, "TXN001 result file not found"
    assert txn001_result["data"]["status"] == "validated"
    assert "compliance_status" in txn001_result["data"]
