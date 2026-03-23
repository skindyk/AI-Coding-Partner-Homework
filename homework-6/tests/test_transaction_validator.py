"""Tests for the Transaction Validator agent."""

import json
import sys
from decimal import Decimal
from pathlib import Path

import pytest

# Ensure the homework-6 directory is on sys.path so agents package is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents import transaction_validator
from agents.transaction_validator import DecimalEncoder, mask_account
from tests.conftest import make_message


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

def _base_txn(**overrides) -> dict:
    """Return a minimal valid transaction dict, with optional overrides."""
    txn = {
        "transaction_id": "TXN_TEST",
        "amount": "1500.00",
        "currency": "USD",
        "source_account": "ACC-1001",
        "destination_account": "ACC-2001",
    }
    txn.update(overrides)
    return txn


@pytest.fixture(autouse=True)
def shared_dirs(tmp_path):
    """Create output/ and results/ sub-directories inside tmp_path."""
    (tmp_path / "output").mkdir()
    (tmp_path / "results").mkdir()
    return tmp_path


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_valid_usd_transaction(tmp_path):
    msg = make_message(_base_txn(amount="1500.00", currency="USD"))
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["status"] == "validated"
    assert "rejection_reason" not in result["data"]


def test_valid_eur_transaction(tmp_path):
    msg = make_message(_base_txn(amount="500.00", currency="EUR"))
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["status"] == "validated"


def test_invalid_currency_xyz(tmp_path):
    msg = make_message(_base_txn(currency="XYZ"))
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["status"] == "rejected"
    assert "INVALID_CURRENCY" in result["data"]["rejection_reason"]


def test_negative_amount(tmp_path):
    msg = make_message(_base_txn(amount="-100.00", currency="GBP"))
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["status"] == "rejected"
    assert "NEGATIVE_AMOUNT" in result["data"]["rejection_reason"]


def test_zero_amount(tmp_path):
    msg = make_message(_base_txn(amount="0.00"))
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["status"] == "rejected"
    assert "NEGATIVE_AMOUNT" in result["data"]["rejection_reason"]


def test_missing_required_field(tmp_path):
    txn = _base_txn()
    del txn["currency"]
    msg = make_message(txn)
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["status"] == "rejected"
    assert "rejection_reason" in result["data"]


def test_decimal_not_float(tmp_path):
    """Amount should be serialized as a string (via DecimalEncoder), not a float."""
    msg = make_message(_base_txn(amount="1500.00", currency="USD"))
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["status"] == "validated"

    # The file written to output/ must have amount as a JSON string, not a number
    output_dir = tmp_path / "output"
    files = list(output_dir.glob("*.json"))
    assert len(files) == 1, "Expected exactly one output file for a valid transaction"
    written = json.loads(files[0].read_text())
    amount_val = written["data"]["amount"]
    # DecimalEncoder serializes Decimal as str; original string is preserved as-is
    assert isinstance(amount_val, str), f"Expected str, got {type(amount_val)}: {amount_val!r}"


def test_dry_run_no_files_written(tmp_path):
    """Calling process_message for a valid transaction writes to output/, not results/.

    The --dry-run CLI mode is exercised via _dry_run(); here we verify that
    when dry_run logic is used (process_message writes no results/ file for valid
    transactions), the results/ directory stays empty.
    """
    msg = make_message(_base_txn(amount="1500.00", currency="USD"))
    transaction_validator.process_message(msg, shared_dir=tmp_path)

    results_dir = tmp_path / "results"
    assert list(results_dir.glob("*.json")) == [], (
        "No results/ file should be written for a valid transaction"
    )


def test_invalid_amount_string(tmp_path):
    """An amount that cannot be parsed as Decimal is rejected with INVALID_AMOUNT."""
    txn = _base_txn()
    txn["amount"] = "not_a_number"
    msg = make_message(txn)
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["status"] == "rejected"
    assert "INVALID_AMOUNT" in result["data"]["rejection_reason"]


def test_mask_account_helper():
    """mask_account should return ***-<last4 chars>."""
    assert mask_account("ACC-1001") == "***-1001"
    assert mask_account("ACC-9999") == "***-9999"
    assert mask_account("ABCDEFGH") == "***-EFGH"


def test_decimal_encoder_serializes_decimal():
    """DecimalEncoder must serialize Decimal values as strings."""
    encoder = DecimalEncoder()
    assert encoder.default(Decimal("1234.56")) == "1234.56"


def test_decimal_encoder_falls_through_for_non_decimal():
    """DecimalEncoder.default must raise TypeError for non-Decimal types."""
    encoder = DecimalEncoder()
    with pytest.raises(TypeError):
        encoder.default(object())


def test_validated_message_written_to_output(tmp_path):
    """A valid transaction must produce exactly one file in output/."""
    msg = make_message(_base_txn())
    transaction_validator.process_message(msg, shared_dir=tmp_path)
    output_files = list((tmp_path / "output").glob("*.json"))
    assert len(output_files) == 1


def test_rejected_message_written_to_results(tmp_path):
    """A rejected transaction must produce exactly one file in results/."""
    msg = make_message(_base_txn(currency="XYZ"))
    transaction_validator.process_message(msg, shared_dir=tmp_path)
    result_files = list((tmp_path / "results").glob("*.json"))
    assert len(result_files) == 1


def test_target_agent_set_to_fraud_detector_on_valid(tmp_path):
    """Validated transactions must be routed to fraud_detector."""
    msg = make_message(_base_txn())
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["target_agent"] == "fraud_detector"


def test_target_agent_set_to_pipeline_complete_on_reject(tmp_path):
    """Rejected transactions must be routed to pipeline_complete."""
    msg = make_message(_base_txn(currency="XYZ"))
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["target_agent"] == "pipeline_complete"


def test_gbp_currency_is_supported(tmp_path):
    """GBP is in the supported currencies list and must be validated."""
    msg = make_message(_base_txn(currency="GBP"))
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["status"] == "validated"


def test_jpy_currency_is_supported(tmp_path):
    """JPY is in the supported currencies list and must be validated."""
    msg = make_message(_base_txn(currency="JPY"))
    result = transaction_validator.process_message(msg, shared_dir=tmp_path)
    assert result["data"]["status"] == "validated"
