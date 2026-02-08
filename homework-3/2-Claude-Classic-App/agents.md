# Virtual Card Lifecycle — AI Agent Guidelines

This document defines the rules, conventions, and constraints that any AI coding agent must follow when implementing the Virtual Card Lifecycle specification.

---

## 1. Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | >= 18.x |
| Framework | Express.js | 4.x |
| Testing | Jest + supertest | Jest 29.x |
| Validation | joi | 17.x |
| Logging | pino | 8.x |
| Authentication | jsonwebtoken | 9.x |
| Hashing | bcryptjs | 2.x |
| Encryption | Node.js built-in `crypto` | (built-in) |
| Monetary math | decimal.js | 10.x |
| UUIDs | uuid | 9.x |
| CORS | cors | 2.x |
| Environment | dotenv | 16.x |
| Input sanitization | xss-filters | 1.x |

- **Language**: Plain JavaScript (ES2022+) with JSDoc type annotations. No TypeScript.
- **ORM/Database**: None. Use in-memory storage with plain JavaScript classes. The model layer must abstract storage so a database can be substituted later without changing services or routes.

---

## 2. Domain Rules (Banking / FinTech)

### Card Numbers
- All PANs (Primary Account Numbers) must be 16-digit numbers valid under the Luhn algorithm.
- Use a designated BIN prefix (e.g., `400000`) for generated cards.
- PANs are tokenized via AES-256-GCM before storage; only the last 4 digits are stored as `maskedPan`.
- Full PANs must never appear in logs, error messages, or API responses (except the single creation response).

### CVV
- Generated as a cryptographically random 3-digit string.
- Stored only as a bcrypt hash (salt rounds: 12).
- Returned to the user exactly once at card creation; never retrievable afterward.

### Monetary Values
- All amounts are stored and transmitted as **integer cents** (e.g., `$12.50` = `1250`).
- Use `Decimal.js` for all arithmetic to avoid IEEE 754 floating-point errors.
- Never use native JavaScript `Number` for monetary calculations.

### Card Status State Machine
Valid transitions:

```
active  ──→  frozen      (reversible)
frozen  ──→  active      (unfreeze)
active  ──→  cancelled   (irreversible)
frozen  ──→  cancelled   (irreversible)
any     ──→  expired     (system-only, scheduled — out of scope for API)
```

Invalid transitions must be rejected with `409 Conflict`.

### Spending Limits
- Three tiers: `perTransaction`, `dailyLimit`, `monthlyLimit`.
- Invariant: `perTransaction <= dailyLimit <= monthlyLimit` — always enforced.
- Maximum caps: per-transaction $10,000 (1,000,000 cents), daily $50,000, monthly $500,000.

### Audit Logs
- Every state-changing operation produces an immutable, hash-chained audit entry.
- Audit records are append-only: `create` and `read` only, no `update` or `delete`.
- Hash chain uses SHA-256 with a well-known genesis hash (64 zeros).

---

## 3. Code Style Guidelines

### Naming
- **Variables and functions**: `camelCase` (e.g., `createCard`, `findById`).
- **Classes**: `PascalCase` (e.g., `Card`, `AuditLog`, `SpendingLimit`).
- **Files**: `camelCase.js` for modules, `PascalCase.js` for model classes.
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `AUDIT_ACTIONS`, `MAX_DAILY_LIMIT`).
- **Test files**: `<ModuleName>.test.js` in a parallel directory under `tests/`.

### Declarations
- Use `const` by default.
- Use `let` only when reassignment is necessary.
- Never use `var`.

### Comparisons
- Always use strict equality (`===` and `!==`).
- Never use `==` or `!=`.

### Async Patterns
- Prefer `async/await` over `.then()` chains.
- Always handle promise rejections — use `express-async-errors` or try/catch with `next(err)`.

### Documentation
- Every exported function must have a JSDoc comment with `@param`, `@returns`, and `@throws` tags.
- Internal helper functions should have a brief `/** ... */` description.

### Module Exports
- Use named exports for all modules: `module.exports = { functionA, functionB }`.
- Exception: `src/index.js` may use `module.exports = app` for supertest compatibility.

### Logging
- Never use `console.log`, `console.error`, or `console.warn`.
- Always use the structured `pino` logger from `src/utils/logger.js`.

---

## 4. Testing Expectations

### Coverage
- Minimum **85%** across lines, branches, functions, and statements.
- Configured in `package.json` Jest `coverageThreshold`.

### Organization
```
tests/
├── unit/          # Isolated tests with mocked dependencies
├── integration/   # Full request-response cycle via supertest
├── security/      # Data leakage and access control tests
├── performance/   # Load and latency benchmarking
└── fixtures/      # Shared test data (JSON)
```

### Test Requirements per Function
Every public function must have at minimum:
1. One **happy-path** test (valid input → expected output).
2. One **invalid-input** test (bad data → appropriate error).
3. One **edge-case** test (boundary values, empty collections, etc.).

### State Management
- Use `beforeEach` to reset in-memory stores between tests. Never rely on test execution order.
- Mock external dependencies (crypto randomness, time) where deterministic output is needed.

### Integration Tests
- Use `supertest(app)` where `app` is exported from `src/index.js`.
- Test full request-response cycles including middleware (auth, validation, error handling).
- Verify audit log entries exist after every mutation endpoint call.

### Security Tests
- Scan all API response bodies for plaintext PAN patterns (`/\b\d{16}\b/`).
- Scan for standalone CVV patterns in card-related responses.
- Verify that masked PAN format (`**** **** **** XXXX`) is used consistently.

---

## 5. Security and Compliance Constraints

### PCI DSS (Payment Card Industry Data Security Standard)
- **Req 3 — Protect Stored Data**: Never store plaintext PAN or CVV. Tokenize PAN, hash CVV.
- **Req 6 — Secure Development**: Validate all input, sanitize against XSS/injection, use parameterized operations.
- **Req 10 — Track Access**: Log every state change with actor, timestamp, and action in the immutable audit trail.

### GDPR (General Data Protection Regulation)
- Support right-to-erasure via anonymization endpoint.
- Support data portability via data-export endpoint.
- Tag personal data fields with `@personalData` JSDoc annotations.
- Include `X-Data-Classification: PII` header on responses containing personal data.

### CCPA (California Consumer Privacy Act)
- Provide data-access endpoint returning all cardholder data in portable JSON.

### Authentication & Authorization
- JWT Bearer tokens required on all endpoints except `GET /health`.
- Tokens must contain `userId` and `role` claims.
- Token expiry configurable via `JWT_EXPIRES_IN` environment variable.

### Rate Limiting
- 100 requests per minute per authenticated user.
- Return `429 Too Many Requests` with `Retry-After` header when exceeded.

### Idempotency
- All mutation endpoints (POST, PATCH, DELETE) require an `Idempotency-Key` header (UUID v4).
- Duplicate keys within 24 hours return the cached original response.

### Error Responses
- Never include stack traces, internal file paths, encryption keys, or JWT secrets in error responses.
- All errors use the standard envelope format with an error `code`, human-readable `message`, and `requestId`.
