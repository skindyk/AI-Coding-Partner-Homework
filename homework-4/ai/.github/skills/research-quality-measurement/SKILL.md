---
name: research-quality-measurement
description: Defines quality levels and scoring criteria for evaluating codebase bug research reports. Use when verifying a research document and assigning a quality score to bug research. Provides a standardised 1–5 scale with per-criterion breakdown.
argument-hint: "path to codebase-research.md to evaluate"
---

# Research Quality Measurement

Use this skill to score a `codebase-research.md` document before writing `verified-research.md`.

## Quality Levels

| Score | Label | Description |
|-------|-------|-------------|
| 5/5 | **Excellent** | All file:line refs verified, all snippets exact, root cause correctly identified, complete coverage, valid reproduction steps |
| 4/5 | **Good** | Minor inaccuracies (<10%), root cause correct, good coverage, reproduction steps valid |
| 3/5 | **Adequate** | Some refs wrong (<30%), root cause partially correct, some coverage gaps |
| 2/5 | **Poor** | Multiple wrong refs (>30%), root cause unclear, significant gaps |
| 1/5 | **Insufficient** | Most refs wrong, root cause incorrect, cannot be used by Bug Planner |

## Evaluation Criteria

### 1. File Reference Accuracy (0–2 pts)
- **2 pts** — All file:line references match the current source
- **1 pt** — <20% of references are wrong or off-by-one
- **0 pts** — >20% of references are wrong or unverifiable

### 2. Code Snippet Fidelity (0–1 pt)
- **1 pt** — Every quoted code snippet matches the source character-for-character
- **0 pts** — Any snippet differs from source (even whitespace)

### 3. Root Cause Correctness (0–1 pt)
- **1 pt** — Root cause correctly identified and technically explained
- **0 pts** — Root cause missing, vague, or incorrect

### 4. Completeness (0–0.5 pts)
- **0.5 pts** — All affected files and call paths documented
- **0 pts** — Missing files or incomplete call chain

### 5. Reproduction Validity (0–0.5 pts)
- **0.5 pts** — Reproduction steps are valid and reproducible
- **0 pts** — Steps missing or non-reproducible

## How to Score

1. Open the `codebase-research.md` being evaluated.
2. For each file:line reference, open the file and check the line. Mark ✅ or ❌.
3. Compare every quoted code snippet against the source character-by-character.
4. Verify the root cause explanation is technically sound.
5. Check that all affected files are listed and the call chain is complete.
6. Check that reproduction steps can be executed.
7. Sum the points and map to a quality level.

## Required Output Block

Include this section verbatim in `verified-research.md`:

```markdown
## Research Quality Assessment

- **Score**: X/5
- **Level**: [Excellent | Good | Adequate | Poor | Insufficient]
- **Criteria Breakdown**:
  - File Reference Accuracy: X/2
  - Code Snippet Fidelity: X/1
  - Root Cause Correctness: X/1
  - Completeness: X/0.5
  - Reproduction Validity: X/0.5
- **Reasoning**: [1–3 sentences explaining the score]
```
