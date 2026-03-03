---
name: unit-tests-FIRST
description: Defines the FIRST principles (Fast, Independent, Repeatable, Self-validating, Timely) for writing professional unit tests. Use when generating or reviewing unit tests for a bug fix. Provides a checklist, Arrange-Act-Assert template, and compliance criteria.
argument-hint: "path to the changed source file to test"
---

# Unit Tests — FIRST Principles

Use this skill when generating unit tests for a bug fix. Verify every item in the FIRST checklist before submitting tests.

## FIRST Principles

### F — Fast
- Each test must complete in **< 200ms**
- No real network calls, no database connections, no file system I/O in test setup
- Mock or stub all external dependencies

### I — Independent
- Tests must not share mutable state — order must not matter
- Use `beforeEach` / `afterEach` to reset any state between tests
- Each test can run alone and produce the same result

### R — Repeatable
- Identical result on every run in any environment (local, CI, container)
- No dependency on system clocks, randomness, or env variables unless mocked
- No left-over state from previous test runs

### S — Self-Validating
- Tests pass or fail explicitly — no manual inspection required
- Every test must contain at least one `expect()` assertion
- Failure messages must be clear enough to diagnose the problem without reading the code

### T — Timely
- Test **only** the changed or new code from the current bug fix
- Do not add tests for unchanged code paths
- The tests should have caught the specific bug if they had existed before the fix

## Arrange-Act-Assert Template

```javascript
describe('ComponentName', () => {
  describe('methodOrEndpointName()', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Arrange
      const input = ...;
      const expected = ...;

      // Act
      const result = await methodOrEndpointName(input);

      // Assert
      expect(result).toEqual(expected);
    });
  });
});
```

## Express / Supertest Template

```javascript
// Avoid port conflicts when running alongside a live server
process.env.PORT = 0;

const request = require('supertest');
const app = require('../server');

describe('GET /api/resource/:id', () => {
  it('should return 200 with resource for valid id', async () => {
    // Arrange
    const expected = { id: 1, name: 'Example' };

    // Act
    const response = await request(app).get('/api/resource/1');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expected);
  });
});
```

## FIRST Checklist

Verify each item before finalising the test file:

- [ ] **F**: No external I/O — all deps mocked, no real HTTP/DB/FS calls
- [ ] **I**: No shared mutable state — `beforeEach` resets anything shared
- [ ] **R**: Deterministic — passes identically on CI and local without env setup
- [ ] **S**: Every test has at least one `expect()` that fails when the code is broken
- [ ] **T**: Tests cover **only** the changed code path, not unmodified code

## Required Output Section

Include this table in `test-report.md`:

```markdown
## FIRST Compliance

| Principle | Compliant | Evidence |
|-----------|-----------|----------|
| Fast | ✅/❌ | [timing / mocking evidence] |
| Independent | ✅/❌ | [isolation evidence] |
| Repeatable | ✅/❌ | [determinism evidence] |
| Self-validating | ✅/❌ | [assertion evidence] |
| Timely | ✅/❌ | [scope — changed code only] |
```
