# Codebase Research: API-404

## Bug Summary

The `GET /api/users/:id` endpoint returns a 404 "User not found" response for every valid user ID because `req.params.id` in Express always yields a string (e.g., `"123"`), while the in-memory `users` array stores IDs as JavaScript numbers (e.g., `123`). The lookup in `getUserById` uses strict equality (`===`), which evaluates `"123" === 123` as `false` without any type coercion, so `Array.prototype.find` never matches any record and the controller unconditionally returns a 404. The bug affects 100% of single-user lookups; `GET /api/users` is unaffected because it returns the entire array without any ID comparison.

## Code Flow Trace

### 1. Entry Point (server.js)
- **File**: `server.js:16`
- **Code**:
```javascript
app.use(userRoutes);
```

### 2. Route Definition (src/routes/users.js)
- **File**: `src/routes/users.js:14`
- **Code**:
```javascript
router.get('/api/users/:id', userController.getUserById);
```

### 3. Controller Function (src/controllers/userController.js)
- **File**: `src/controllers/userController.js:18`
- **Code**:
```javascript
async function getUserById(req, res) {
```

### 4. Root Cause
- **File**: `src/controllers/userController.js:23`
- **Buggy Code**:
```javascript
const user = users.find(u => u.id === userId);
```
- **Explanation**: `userId` is assigned from `req.params.id` on line 19, which Express always provides as a `string` (e.g., `"123"`). The `users` array (lines 7-11) stores `id` values as JavaScript `number` literals (e.g., `123`). The strict equality operator `===` performs no type coercion, so the comparison `123 === "123"` evaluates to `false` for every element. `Array.prototype.find` therefore never returns a match and `user` is always `undefined`, causing the controller to fall through to the 404 branch on line 26 for every possible ID value.

## Affected Files

| File | Line(s) | Issue |
|------|---------|-------|
| `src/controllers/userController.js` | 19 | `req.params.id` captured as string with no conversion |
| `src/controllers/userController.js` | 23 | Strict equality comparison of string `userId` to numeric `u.id` always returns `false` |
| `src/controllers/userController.js` | 26 | 404 response returned unconditionally due to failed lookup |

## Reproduction Steps

```bash
# Install dependencies
cd homework-4/demo-bug-fix && npm install

# Start server
node server.js

# In another terminal:
curl http://localhost:3000/api/users/123
# Expected: {"id":123,"name":"Alice Smith","email":"alice@example.com"}
# Actual: {"error":"User not found"} with 404 status
```

## References

- `server.js:16` — Mounts the user router on the Express application with `app.use(userRoutes)`
- `src/routes/users.js:14` — Defines the parameterised route `GET /api/users/:id` and binds it to `userController.getUserById`
- `src/controllers/userController.js:7-11` — In-memory `users` array where all `id` fields are JavaScript `number` literals
- `src/controllers/userController.js:18` — Declaration of the `getUserById` async controller function
- `src/controllers/userController.js:19` — `const userId = req.params.id;` — captures the route parameter as a `string`
- `src/controllers/userController.js:23` — `users.find(u => u.id === userId)` — strict equality between `number` and `string` always fails
- `src/controllers/userController.js:25-27` — Guard clause that returns 404 whenever `user` is falsy (always, due to the type mismatch on line 23)
