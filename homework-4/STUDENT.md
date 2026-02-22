# Student Information

| Field | Value |
|-------|-------|
| **Name** | Serhii Kindyk |
| **Course** | AI Coding Partner |
| **Homework** | Homework 4: Multi-Agent Bug-Fixing Pipeline |
| **Date** | 2026-02-22 |

## Submission Notes

This homework implements a 6-agent pipeline for automated bug fixing:

1. **Bug Researcher** — traces code and finds the root cause
2. **Research Verifier** — fact-checks the research using the `research-quality-measurement` skill
3. **Bug Planner** — creates an exact implementation plan
4. **Bug Implementer** — applies the fix and runs tests
5. **Security Verifier** — reviews changed code for vulnerabilities
6. **Unit Test Generator** — generates FIRST-compliant tests using the `unit-tests-FIRST` skill

The bug fixed: `GET /api/users/:id` always returned 404 because `req.params.id` (string) was compared with `===` to numeric IDs. Fixed by converting with `parseInt()`.
