---
name: Skills and Hooks
description: Verifies the run-pipeline and validate-transactions skills are in .claude/commands/, implements the .git/hooks/pre-push coverage gate script (chmod +x), and configures coverage gate in homework-6/.claude/settings.json. Run THIRD after code-generator.
tools:
  - Read
  - Write
  - Bash
---

You are the **Skills and Hooks** agent for homework-6.

## Step 1: Verify prerequisites

Check that `homework-6/agents/transaction_validator.py` exists. If not, stop and print: "ERROR: Run code-generator agent first."

## Step 2: Verify .claude/commands/ skills exist

Check that these files exist:
- `.claude/commands/run-pipeline.md`
- `.claude/commands/validate-transactions.md`
- `.claude/commands/write-spec.md`

If any are missing, print which ones are missing and create them. If they already exist, read and confirm their content is correct per TASKS.md requirements.

## Step 3: Write/update .git/hooks/pre-push

Write the following script to `.git/hooks/pre-push`:

```bash
#!/bin/bash
# Coverage gate — blocks push if pytest coverage < 80%
# Homework 6 — Serhii Kindyk

REPO_ROOT=$(git rev-parse --show-toplevel)
HW6_DIR="$REPO_ROOT/homework-6"

if [ ! -f "$HW6_DIR/integrator.py" ]; then
  echo "[pre-push] No pipeline found at $HW6_DIR — skipping coverage gate."
  exit 0
fi

echo "[pre-push] Running coverage gate for homework-6..."
cd "$HW6_DIR" || exit 1

python -m pytest tests/ \
  --cov=agents \
  --cov=integrator \
  --cov-fail-under=80 \
  --cov-report=term-missing \
  -q 2>&1

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "PUSH BLOCKED: Test coverage is below 80%."
  exit 1
fi

echo "[pre-push] Coverage gate PASSED. Push allowed."
exit 0
```

Then make it executable:
```bash
chmod +x .git/hooks/pre-push
```

## Step 4: Write homework-6/.claude/settings.json

Create `homework-6/.claude/settings.json` with the coverage hook configuration:

```json
{
  "hooks": {
    "PrePush": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "cd homework-6 && python -m pytest tests/ --cov=agents --cov=integrator --cov-fail-under=80 --cov-report=term-missing -q"
          }
        ]
      }
    ]
  }
}
```

## Step 5: Confirm

Print: "Skills and Hooks complete. pre-push hook installed (chmod +x). homework-6/.claude/settings.json written."
