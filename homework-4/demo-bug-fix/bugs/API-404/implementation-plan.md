# Implementation Plan: API-404

## Summary

The bug is a type mismatch in `src/controllers/userController.js`. At line 19, Express stores the route parameter `:id` as a JavaScript string (e.g., `"123"`), but the in-memory `users` array (lines 7-11) stores `id` fields as numeric literals (`123`, `456`, `789`). When the strict equality operator `===` at line 23 compares the string `userId` against each numeric `u.id`, it always evaluates to `false` because no type coercion is performed, causing `Array.prototype.find` to return `undefined` for every valid request and the controller to unconditionally respond with a 404. The fix is a single-line change at line 19: wrap `req.params.id` with `parseInt(req.params.id, 10)` to convert the string to a base-10 integer before the comparison, so that `===` succeeds when the IDs match numerically.

## Changes

### Change 1: Convert req.params.id to number

- **File**: `src/controllers/userController.js`
- **Line(s)**: 19
- **Before**:
```javascript
  const userId = req.params.id;
```
- **After**:
```javascript
  const userId = parseInt(req.params.id, 10);
```
- **Reason**: `req.params.id` is always a string. The users array stores numeric IDs. `parseInt(x, 10)` converts the string to a base-10 integer so `===` comparison works correctly. The radix `10` prevents octal interpretation.

## Test Commands

```bash
# Run automated tests
cd homework-4/demo-bug-fix && npm test

# Manual verification (requires running server)
curl http://localhost:3000/api/users/123
# Expected: {"id":123,"name":"Alice Smith","email":"alice@example.com"}

curl http://localhost:3000/api/users/456
# Expected: {"id":456,"name":"Bob Johnson","email":"bob@example.com"}

curl http://localhost:3000/api/users/999
# Expected: {"error":"User not found"} with 404 status

curl http://localhost:3000/api/users
# Expected: array of all 3 users
```

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `parseInt("abc", 10)` returns `NaN` | Low — non-numeric URLs go to different route or 404 | `NaN === 123` is `false`, existing 404 handles it gracefully |
| Breaking `GET /api/users` | Very Low — different function | Change is isolated to `getUserById` only |
| Breaking other endpoints | None | Only `getUserById` is modified |

## Acceptance Criteria

- [ ] `GET /api/users/123` returns 200 with `{"id":123,"name":"Alice Smith","email":"alice@example.com"}`
- [ ] `GET /api/users/456` returns 200 with `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}`
- [ ] `GET /api/users/789` returns 200 with `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}`
- [ ] `GET /api/users/999` returns 404 with `{"error":"User not found"}`
- [ ] `GET /api/users` still returns all 3 users
- [ ] All automated tests pass

## References

- `src/controllers/userController.js:19` — line to change
- `src/controllers/userController.js:23` — comparison that now works with numeric userId
- `research/verified-research.md` — root cause confirmation
