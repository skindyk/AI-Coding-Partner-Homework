"""Tests for the Fraud Detector agent."""

import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import fraud_detector
from tests.conftest import make_message


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _validated_txn(**overrides) -> dict:
    """Return a minimal validated transaction data dict."""
    txn = {
        "transaction_id": "TXN_TEST",
        "amount": "1500.00",
        "currency": "USD",
        "source_account": "ACC-1001",
        "destination_account": "ACC-2001",
        "status": "validated",
        "metadata": {"channel": "online", "country": "US"},
    }
    txn.update(overrides)
    return txn


def _make_msg_at_hour(hour: int, txn_data: dict) -> dict:
    """Create a message whose timestamp has the given UTC hour."""
    ts = datetime(2026, 3, 16, hour, 0, 0, tzinfo=timezone.utc).isoformat()
    msg = make_message(txn_data, target_agent="fraud_detector")
    msg["timestamp"] = ts
    return msg


@pytest.fixture(autouse=True)
def shared_dirs(tmp_path):
    (tmp_path / "output").mkdir()
    (tmp_path / "results").mkdir()
    return tmp_path


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_high_risk_75k(tmp_path):
    """$75,000 at 02:47 UTC from Germany → score=10 → HIGH risk.

    Score breakdown: +7 (>50k) + +2 (hour 2) + +1 (cross-border) = 10.
    """
    txn = _validated_txn(
        amount="75000.00",
        metadata={"channel": "branch", "country": "DE"},
    )
    msg = make_message(txn, target_agent="fraud_detector")
    msg["timestamp"] = "2026-03-16T02:47:00+00:00"
    result = fraud_detector.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["fraud_risk_level"] == "HIGH"
    assert result["data"]["fraud_risk_score"] >= 7


def test_medium_risk_25k(tmp_path):
    """$25,000 during business hours → MEDIUM risk."""
    txn = _validated_txn(amount="25000.00")
    msg = _make_msg_at_hour(9, txn)
    result = fraud_detector.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["fraud_risk_level"] == "MEDIUM"


def test_low_risk_1500(tmp_path):
    """$1,500 during business hours → LOW risk."""
    txn = _validated_txn(amount="1500.00")
    msg = _make_msg_at_hour(9, txn)
    result = fraud_detector.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["fraud_risk_level"] == "LOW"
    assert result["data"]["fraud_risk_score"] <= 2


def test_unusual_hour_adds_score(tmp_path):
    """Timestamp at 02:47 UTC (hour=2) adds +2 to score."""
    # $1500 US → base score 0, then +2 for unusual hour → total 2
    txn = _validated_txn(amount="1500.00")
    msg = make_message(txn, target_agent="fraud_detector")
    msg["timestamp"] = "2026-03-16T02:47:00+00:00"
    result = fraud_detector.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["fraud_risk_score"] == 2


def test_cross_border_adds_score(tmp_path):
    """metadata.country='DE' adds +1 to the score."""
    txn = _validated_txn(amount="1500.00", metadata={"channel": "api", "country": "DE"})
    msg = _make_msg_at_hour(9, txn)
    result = fraud_detector.process_message(msg, shared_dir=tmp_path)
    # base 0 + 1 cross-border = 1
    assert result["data"]["fraud_risk_score"] == 1
    assert result["data"]["fraud_risk_level"] == "LOW"


def test_combined_score_02_47_germany(tmp_path):
    """TXN004 pattern: $500 EUR at 02:47 UTC, country=DE → score=3, MEDIUM."""
    txn = _validated_txn(
        transaction_id="TXN004",
        amount="500.00",
        currency="EUR",
        metadata={"channel": "api", "country": "DE"},
    )
    msg = make_message(txn, target_agent="fraud_detector")
    msg["timestamp"] = "2026-03-16T02:47:00+00:00"
    result = fraud_detector.process_message(msg, shared_dir=tmp_path)
    # +2 unusual hour + 1 cross-border = 3
    assert result["data"]["fraud_risk_score"] == 3
    assert result["data"]["fraud_risk_level"] == "MEDIUM"
