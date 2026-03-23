---
name: write-spec
description: Generates specification.md following the 5-section banking pipeline template when invoked as a slash command
argument-hint: "optional: path to template file (default: specification-TEMPLATE-hint.md)"
---

# Write Spec Skill

Use when generating or regenerating the project specification. Follows the template exactly.

## Steps

1. Read `specification-TEMPLATE-hint.md` from the homework-6 directory
2. Read `sample-transactions.json` to ground the spec in real input data
3. Fill each of the 5 sections — do not skip any section:
   - **Section 1**: One sentence high-level objective
   - **Section 2**: At least 5 testable mid-level objectives
   - **Section 3**: Implementation notes (decimal.js, ISO 4217, PII masking, logging)
   - **Section 4**: Beginning state and ending state
   - **Section 5**: Low-level task entry for each pipeline agent
4. Create `specification.md` in the homework-6 directory
5. Create `agents.md` in the homework-6 directory

## Validation Checklist

Before completing, verify:
- [ ] Section 1: exactly one sentence
- [ ] Section 2: at least 5 testable requirements with measurable outcomes
- [ ] Section 3: includes decimal.js, ISO 4217 whitelist, PII masking, ISO 8601 timestamps
- [ ] Section 4: beginning state AND ending state both described
- [ ] Section 5: all 3 pipeline agents have Task/Prompt/File/Function/Details entries

## Low-Level Task Format

Each entry in Section 5 must follow this exact format:
```
Task: [Agent Name]
Prompt: "[Exact prompt to give the AI agent]"
File to CREATE: src/agents/[name].js
Function to CREATE: processMessage(message)
Details: [What the agent checks, transforms, or decides]
```
