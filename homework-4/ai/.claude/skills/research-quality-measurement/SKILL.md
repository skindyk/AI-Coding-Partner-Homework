# Skill: Research Quality Measurement

## Purpose

This skill defines standardized quality levels for evaluating codebase research reports.
Use it when writing `verified-research.md` to assign an objective quality score.

## Quality Levels

| Score | Label | Description |
|-------|-------|-------------|
| 5/5 | **Excellent** | All file:line refs verified, all code snippets accurate, root cause correctly identified, complete coverage, valid reproduction steps |
| 4/5 | **Good** | Minor inaccuracies in snippets or refs (<10%), root cause correct, good coverage, reproduction steps valid |
| 3/5 | **Adequate** | Some file:line refs wrong or stale (<30%), root cause partially correct, some gaps in coverage |
| 2/5 | **Poor** | Multiple wrong refs (>30%), root cause unclear or partially wrong, significant coverage gaps |
| 1/5 | **Insufficient** | Most refs wrong, root cause incorrect or missing, cannot be used by planner |

## Evaluation Criteria

### 1. File Reference Accuracy (0–2 pts)
- **2 pts**: All file:line references verified against current source
- **1 pt**: <20% discrepancy in references
- **0 pts**: >20% wrong or unverifiable references

### 2. Code Snippet Fidelity (0–1 pt)
- **1 pt**: All quoted code matches source exactly (character-for-character)
- **0 pts**: Any snippet differs from source

### 3. Root Cause Correctness (0–1 pt)
- **1 pt**: Root cause correctly identified and clearly explained
- **0 pts**: Root cause missing, vague, or wrong

### 4. Completeness (0–0.5 pts)
- **0.5 pts**: All affected files and call paths documented
- **0 pts**: Missing affected files or incomplete call chain

### 5. Reproduction Validity (0–0.5 pts)
- **0.5 pts**: Reproduction steps are valid and reproducible
- **0 pts**: Steps missing or non-reproducible

## Required Output Format

When writing `verified-research.md`, include this section:

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
