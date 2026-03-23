"""Tests for the Compliance Checker agent."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import compliance_checker
from tests.conftest import make_message


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fraud_scored_txn(amount: str, fraud_risk_level: str = "LOW") -> dict:
    """Return transaction data as if it has been through fraud_detector."""
    return {
        "transaction_id": "TXN_TEST",
        "amount": amount,
        "currency": "USD",
        "source_account": "ACC-1001",
        "destination_account": "ACC-2001",
        "status": "validated",
        "metadata": {"channel": "online", "country": "US"},
        "fraud_risk_score": 0,
        "fraud_risk_level": fraud_risk_level,
    }


@pytest.fixture(autouse=True)
def shared_dirs(tmp_path):
    (tmp_path / "output").mkdir()
    (tmp_path / "results").mkdir()
    return tmp_path


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_ctr_required_above_10k(tmp_path):
    txn = _fraud_scored_txn(amount="25000.00", fraud_risk_level="MEDIUM")
    msg = make_message(txn, target_agent="compliance_checker")
    result = compliance_checker.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["ctr_required"] is True


def test_ctr_not_required_below_10k(tmp_path):
    txn = _fraud_scored_txn(amount="1500.00", fraud_risk_level="LOW")
    msg = make_message(txn, target_agent="compliance_checker")
    result = compliance_checker.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["ctr_required"] is False


def test_ctr_boundary_10001(tmp_path):
    """Amount just above $10,000 must require a CTR."""
    txn = _fraud_scored_txn(amount="10000.01", fraud_risk_level="LOW")
    msg = make_message(txn, target_agent="compliance_checker")
    result = compliance_checker.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["ctr_required"] is True


def test_ctr_boundary_9999(tmp_path):
    """Amount just below $10,000 must NOT require a CTR."""
    txn = _fraud_scored_txn(amount="9999.99", fraud_risk_level="LOW")
    msg = make_message(txn, target_agent="compliance_checker")
    result = compliance_checker.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["ctr_required"] is False


def test_aml_flag_high_risk_fraud(tmp_path):
    """HIGH fraud risk level triggers aml_flag regardless of amount."""
    txn = _fraud_scored_txn(amount="1500.00", fraud_risk_level="HIGH")
    msg = make_message(txn, target_agent="compliance_checker")
    result = compliance_checker.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["aml_flag"] is True


def test_aml_structuring_range(tmp_path):
    """Amount in [9000, 10000] triggers AML structuring flag."""
    txn = _fraud_scored_txn(amount="9500.00", fraud_risk_level="LOW")
    msg = make_message(txn, target_agent="compliance_checker")
    result = compliance_checker.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["aml_flag"] is True


def test_clear_status_normal(tmp_path):
    """$1500 LOW risk transaction → compliance_status='CLEAR'."""
    txn = _fraud_scored_txn(amount="1500.00", fraud_risk_level="LOW")
    msg = make_message(txn, target_agent="compliance_checker")
    result = compliance_checker.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["compliance_status"] == "CLEAR"


def test_review_required_when_flagged(tmp_path):
    """$25000 MEDIUM risk triggers REVIEW_REQUIRED (ctr_required=True)."""
    txn = _fraud_scored_txn(amount="25000.00", fraud_risk_level="MEDIUM")
    msg = make_message(txn, target_agent="compliance_checker")
    result = compliance_checker.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["compliance_status"] == "REVIEW_REQUIRED"
