import pytest
import uuid
from datetime import datetime, timezone


def make_message(txn_data: dict, target_agent: str = "transaction_validator") -> dict:
    return {
        "message_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source_agent": "test",
        "target_agent": target_agent,
        "message_type": "transaction",
        "data": txn_data.copy(),
    }
