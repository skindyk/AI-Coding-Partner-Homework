# Test Report: API-404

## Summary

- **Tests Run**: 5
- **Passed**: 5
- **Failed**: 0
- **Test file**: `tests/userController.test.js`
- **Test framework**: Jest 29.7 + Supertest 6.3

## FIRST Compliance

| Principle | Compliant | Evidence |
|-----------|-----------|----------|
| Fast | ✅ | All tests complete in < 200ms (slowest: 50ms). In-memory data only — no network, no DB, no file I/O. Total suite: 0.987s |
| Independent | ✅ | No shared mutable state. The `users` array in `userController.js` is never mutated; each HTTP request is fully isolated. `beforeEach`/`afterEach` not needed. |
| Repeatable | ✅ | In-memory static data; no env vars, clocks, or randomness. `process.env.PORT = 0` ensures no port conflicts. Produces identical results on every run in any environment. |
| Self-validating | ✅ | Every test uses explicit `expect(response.status).toBe()` and `expect(response.body).toEqual()` assertions. Tests fail clearly with meaningful messages when code is broken. |
| Timely | ✅ | Tests cover only `getUserById` / `GET /api/users/:id` — exactly the function changed in fix API-404 (line 19 of `userController.js`). `getAllUsers` is not tested. |

## Test Output

```
> demo-bug-fix@1.0.0 test
> jest --verbose

  console.log
    Demo API server running on http://localhost:0

  console.log
    Try:

  console.log
        GET http://localhost:0/api/users

  console.log
        GET http://localhost:0/api/users/123

PASS tests/userController.test.js
  GET /api/users/:id
    valid user IDs
      √ should return Alice Smith (200) for id 123 (50 ms)
      √ should return Bob Johnson (200) for id 456 (10 ms)
      √ should return Charlie Brown (200) for id 789 (4 ms)
    invalid user IDs
      √ should return 404 with error body for non-existent numeric id 999 (3 ms)
      √ should return 404 for non-numeric id "abc" (parseInt returns NaN, no match found) (3 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.987 s
Ran all test suites.
```

## Tests Generated

| Test Name | What It Verifies |
|-----------|-----------------|
| should return Alice Smith (200) for id 123 | `parseInt("123",10) === 123` matches user; correct object + status 200 returned. Directly validates the bug fix: type coercion enables strict equality. |
| should return Bob Johnson (200) for id 456 | `parseInt("456",10) === 456` matches user; correct object + status 200 returned. |
| should return Charlie Brown (200) for id 789 | `parseInt("789",10) === 789` matches user; correct object + status 200 returned. |
| should return 404 for non-existent id 999 | `parseInt("999",10) === 999` but no user with id 999 exists; controller returns 404 + `{"error":"User not found"}`. |
| should return 404 for non-numeric id "abc" | `parseInt("abc",10) === NaN`; NaN is never `===` to any id; controller gracefully returns 404 + `{"error":"User not found"}`. |

## Root Cause Regression Coverage

The key regression test is **test 1** (`id 123`). Before the fix, this test would have failed:
- Before: `req.params.id` = `"123"` (string), `"123" === 123` is `false` → 404 returned
- After: `parseInt("123", 10)` = `123` (number), `123 === 123` is `true` → user returned with 200
