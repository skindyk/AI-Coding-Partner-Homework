# Skill: Unit Tests — FIRST Principles

## Purpose

Defines the FIRST principles for unit test quality. Use this skill when generating or evaluating
unit tests to ensure they meet professional standards.

## FIRST Principles

### F — Fast
- Each test must complete in **< 200ms**
- No network calls, no file I/O in test setup, no real database connections
- Use mocks/stubs for all external dependencies

### I — Independent
- Tests must not share mutable state
- Each test runs in isolation — order must not matter
- Use `beforeEach`/`afterEach` to reset state between tests

### R — Repeatable
- Same result every run, in any environment
- No dependency on environment variables, clocks, or randomness unless mocked
- Mock time-dependent or random functions

### S — Self-Validating
- Tests pass or fail explicitly — no manual inspection required
- Use explicit `expect()` assertions with meaningful messages
- Test must fail meaningfully when the code is broken

### T — Timely
- Test only the **changed or new code** from the bug fix
- Do not add tests for unchanged code paths
- Write tests that would have caught the specific bug being fixed

## Arrange-Act-Assert Template

```javascript
describe('ComponentName', () => {
  describe('methodName()', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Arrange
      const input = ...;
      const expected = ...;

      // Act
      const result = await methodName(input);

      // Assert
      expect(result).toEqual(expected);
    });
  });
});
```

## FIRST Checklist

Before submitting tests, verify each item:

- [ ] **F**: All tests run < 200ms (no external I/O, mocked dependencies)
- [ ] **I**: No shared mutable state between tests (`beforeEach` resets any state)
- [ ] **R**: Same result on every run (no randomness, no environment assumptions)
- [ ] **S**: Each test has at least one `expect()` assertion with clear failure message
- [ ] **T**: Tests cover only the changed code paths from the current bug fix
