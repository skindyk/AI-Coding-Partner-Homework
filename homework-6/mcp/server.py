from fastmcp import FastMCP
from pathlib import Path
import json
from datetime import datetime, timezone

mcp = FastMCP("Banking Pipeline MCP Server")

RESULTS_DIR = Path(__file__).parent.parent / "shared" / "results"


def _get_all_results() -> list[dict]:
    if not RESULTS_DIR.exists():
        return []
    results = []
    for path in RESULTS_DIR.glob("*.json"):
        try:
            results.append(json.loads(path.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError):
            pass
    return results


@mcp.tool()
def get_transaction_status(transaction_id: str) -> dict:
    """Return current status of a transaction by transaction_id."""
    for result in _get_all_results():
        data = result.get("data", {})
        if data.get("transaction_id") == transaction_id:
            return {
                "transaction_id": transaction_id,
                "status": data.get("status", "unknown"),
                "fraud_risk_level": data.get("fraud_risk_level"),
                "ctr_required": data.get("ctr_required"),
                "compliance_status": data.get("compliance_status"),
                "rejection_reason": data.get("rejection_reason"),
                "message_id": result.get("message_id"),
            }
    return {"transaction_id": transaction_id, "status": "not_found"}


@mcp.tool()
def list_pipeline_results() -> dict:
    """Return summary of all processed transactions."""
    results = _get_all_results()
    summary = {
        "total": len(results),
        "validated": 0,
        "rejected": 0,
        "high_risk": 0,
        "ctr_required": 0,
        "transactions": [],
    }
    for result in results:
        data = result.get("data", {})
        status = data.get("status", "unknown")
        if status == "validated":
            summary["validated"] += 1
        elif status == "rejected":
            summary["rejected"] += 1
        if data.get("fraud_risk_level") == "HIGH":
            summary["high_risk"] += 1
        if data.get("ctr_required"):
            summary["ctr_required"] += 1
        summary["transactions"].append({
            "transaction_id": data.get("transaction_id"),
            "status": status,
            "fraud_risk_level": data.get("fraud_risk_level"),
            "ctr_required": data.get("ctr_required"),
        })
    return summary


@mcp.resource("pipeline://summary")
def pipeline_summary() -> str:
    """Return latest pipeline run summary as formatted text."""
    results = _get_all_results()
    if not results:
        return "No pipeline results found. Run `python integrator.py` first."
    validated = sum(1 for r in results if r.get("data", {}).get("status") == "validated")
    rejected = len(results) - validated
    high_risk = sum(1 for r in results if r.get("data", {}).get("fraud_risk_level") == "HIGH")
    ctr = sum(1 for r in results if r.get("data", {}).get("ctr_required"))
    lines = [
        f"Pipeline Summary — {datetime.now(timezone.utc).isoformat()}",
        f"Total: {len(results)} | Validated: {validated} | Rejected: {rejected}",
        f"High-risk: {high_risk} | CTR required: {ctr}",
        "",
        f"{'transaction_id':<12} {'status':<12} {'risk':<8} {'ctr'}",
        "-" * 45,
    ]
    for r in results:
        d = r.get("data", {})
        lines.append(
            f"{d.get('transaction_id','?'):<12} {d.get('status','?'):<12} "
            f"{d.get('fraud_risk_level','N/A'):<8} {d.get('ctr_required','N/A')}"
        )
    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run()
