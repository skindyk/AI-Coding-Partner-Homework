#!/usr/bin/env python3
"""Coverage gate hook: blocks git push if test coverage is below 80%."""
import sys
import json
import subprocess

data = json.load(sys.stdin)
cmd = data.get("tool_input", {}).get("command", "")

if "git push" not in cmd:
    sys.exit(0)

result = subprocess.run(
    [
        "python", "-m", "pytest", "tests/",
        "--cov=agents", "--cov=integrator",
        "--cov-fail-under=80",
        "-q", "--no-header",
    ],
    capture_output=True,
    text=True,
)

if result.returncode != 0:
    output = (result.stdout + result.stderr).strip()[-500:]
    print(json.dumps({
        "continue": False,
        "stopReason": (
            "Coverage gate failed: test coverage is below 80%.\n"
            "Run `python -m pytest tests/ --cov=agents --cov=integrator --cov-report=term-missing` to check.\n\n"
            + output
        ),
    }))
    sys.exit(1)
