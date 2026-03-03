# Security Report: API-404

## Scope

- **Reviewed files**:
  - `bugs/API-404/fix-summary.md`
  - `src/controllers/userController.js`
  - `src/routes/users.js`
  - `server.js`
  - `package.json`
- **Review date**: 2026-02-22
- **Reviewer**: Security Verifier Agent

## Executive Summary

The fix applied in API-404 is a targeted, one-line change that converts a URL path parameter from a string to an integer using `parseInt(req.params.id, 10)`. The change is correct and resolves the strict-equality comparison failure that caused the 404 bug. From a security standpoint the change is a net positive: typed numeric comparison is safer than loose string-based lookups.

The overall security posture of this codebase is acceptable within its stated scope as an in-memory demo. There are no hardcoded credentials, no database back-end, no authentication layer, and no external service integrations — so the attack surface is narrow. Several findings are noted below; most are LOW or INFO and directly relate to the demo nature of the project. One MEDIUM finding (missing NaN guard on `parseInt`) is the only item that would require attention before promoting this pattern to production code.

## Findings

### Finding 1: `parseInt` Result Is Not Guarded Against NaN

- **Severity**: MEDIUM
- **File**: `src/controllers/userController.js:19`
- **Code**:
```javascript
const userId = parseInt(req.params.id, 10);
const user = users.find(u => u.id === userId);
```
- **Description**: When `req.params.id` is a non-numeric string (e.g., `GET /api/users/abc`), `parseInt` returns `NaN`. Because `NaN !== NaN` in JavaScript, the strict equality `u.id === userId` will never match and the handler silently returns 404. The degradation is accidental, not intentional. In a real database-backed application, passing `NaN` to a query layer can trigger unhandled errors or, in some ORMs, a full-table scan. Callers also receive no useful signal distinguishing "user not found" from "you sent an invalid ID".
- **Remediation**: Add an explicit `isNaN` guard after the `parseInt` call and return `400 Bad Request` for non-numeric input.

---

### Finding 2: No Rate Limiting or Request Throttling

- **Severity**: LOW
- **File**: `server.js:9–16`
- **Code**:
```javascript
const app = express();
app.use(express.json());
app.use(userRoutes);
```
- **Description**: No rate-limiting middleware is registered. Any caller can send an unlimited number of requests. Inconsequential for the demo; a concern for production.
- **Remediation**: Add `express-rate-limit` (or equivalent) before route handlers in production.

---

### Finding 3: No Authentication or Authorization on User Endpoints

- **Severity**: LOW
- **File**: `src/routes/users.js:11–14`
- **Code**:
```javascript
router.get('/api/users', userController.getAllUsers);
router.get('/api/users/:id', userController.getUserById);
```
- **Description**: Both endpoints are publicly accessible with no token, key, or session requirement. The mock data contains names and email addresses (PII). Acceptable for a demo; not acceptable with real user data.
- **Remediation**: Apply an authentication middleware (e.g., JWT verification) to all `/api/users` routes before handling real data.

---

### Finding 4: PII-Style Data in Mock Fixtures

- **Severity**: LOW
- **File**: `src/controllers/userController.js:7–11`
- **Code**:
```javascript
const users = [
  { id: 123, name: 'Alice Smith', email: 'alice@example.com' },
  { id: 456, name: 'Bob Johnson', email: 'bob@example.com' },
  { id: 789, name: 'Charlie Brown', email: 'charlie@example.com' }
];
```
- **Description**: Realistic-looking names and email addresses in fixtures create a habit that risks accidental inclusion of real PII in future iterations.
- **Remediation**: Use clearly synthetic identifiers, e.g., `user1@example.invalid` (RFC 2606 reserved TLD).

---

### Finding 5: No Route-Level Input Type Constraint on `:id`

- **Severity**: LOW
- **File**: `src/routes/users.js:14`
- **Code**:
```javascript
router.get('/api/users/:id', userController.getUserById);
```
- **Description**: The route accepts any string of any length as `:id`. While `parseInt` truncates non-numeric input, there is no enforcement at the routing layer. A regex constraint would reject non-numeric IDs before the controller is invoked.
- **Remediation**: Apply a numeric-only route constraint: `router.get('/api/users/:id(\\d+)', ...)`.

---

### Finding 6: No Helmet or Security-Header Middleware

- **Severity**: LOW
- **File**: `server.js:9–16`
- **Description**: No `helmet` middleware is applied. Express default headers include `X-Powered-By: Express`, which is a minor information disclosure. Security headers such as `X-Content-Type-Options` and `X-Frame-Options` are absent.
- **Remediation**: Add `helmet` as a dependency and apply it as the first middleware: `app.use(require('helmet')())`.

---

### Finding 7: Dependency Versions Use Caret Ranges

- **Severity**: INFO
- **File**: `package.json:15–21`
- **Code**:
```json
"dependencies": { "express": "^4.18.2" },
"devDependencies": { "jest": "^29.7.0", "nodemon": "^3.0.1", "supertest": "^6.3.4" }
```
- **Description**: Caret ranges allow minor/patch version float. Express 4.x has no known critical CVEs as of the review date. Dev dependencies do not ship to production.
- **Remediation**: Commit `package-lock.json`, run `npm audit` periodically, and pin exact versions in production deployments.

---

### Finding 8: Stale In-Code Comment Describes Bug as Still Present

- **Severity**: INFO
- **File**: `src/controllers/userController.js:21–22`
- **Code**:
```javascript
// BUG: req.params.id returns a string, but users array uses numeric IDs
// Strict equality (===) comparison will always fail: "123" !== 123
```
- **Description**: After the fix was applied these comments still describe the original bug as active. Not a security issue, but a documentation accuracy problem that could confuse future maintainers.
- **Remediation**: Update or remove the stale comment to reflect the fixed state.

---

## Summary Table

| # | Finding | Severity | File:Line | Status |
|---|---------|----------|-----------|--------|
| 1 | `parseInt` result not guarded against NaN | MEDIUM | `src/controllers/userController.js:19` | Open |
| 2 | No rate limiting or request throttling | LOW | `server.js:9–16` | Open |
| 3 | No authentication or authorization on user endpoints | LOW | `src/routes/users.js:11–14` | Open |
| 4 | PII-style data in mock fixtures | LOW | `src/controllers/userController.js:7–11` | Open |
| 5 | No route-level input type constraint on `:id` | LOW | `src/routes/users.js:14` | Open |
| 6 | No Helmet or security-header middleware | LOW | `server.js:9–16` | Open |
| 7 | Dependency caret ranges — no pinned versions | INFO | `package.json:15–21` | Open |
| 8 | Stale in-code comment describes bug as still present | INFO | `src/controllers/userController.js:21–22` | Open |

## Conclusion

The API-404 fix is **safe to ship within the scope of this demo project**. The change is minimal, well-targeted, and introduces no new attack vectors. The single MEDIUM finding (NaN not explicitly handled) is a code-quality concern rather than an exploitable vulnerability in the current in-memory context: a non-numeric ID simply returns 404, which is an acceptable accidental degradation. It must be addressed before this pattern is reused against a real data store.

The LOW findings (no auth, no rate limiting, no helmet, PII-style fixture data, no route-level type constraint) are all expected omissions for a deliberate demo scaffold. They do not block this fix from being accepted.

No CRITICAL or HIGH severity issues were identified. The dependency set is clean with no known critical CVEs as of the review date.

**Recommendation: APPROVE the fix for the demo pipeline. Flag the NaN guard (Finding 1) and the route regex constraint (Finding 5) as the two highest-priority items to address in any production hardening effort.**
