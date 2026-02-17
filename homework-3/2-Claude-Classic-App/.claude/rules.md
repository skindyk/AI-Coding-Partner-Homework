# Claude Code Rules — Virtual Card Lifecycle API

## Project Identity

This is a **FinTech virtual card management API** built with Node.js and Express.js. The domain is banking/financial services in a regulated environment. All code must prioritize security, auditability, and data protection.

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Route files | `src/routes/<plural-noun>.js` | `cards.js`, `transactions.js` |
| Model files | `src/models/<PascalCase>.js` | `Card.js`, `AuditLog.js` |
| Service files | `src/services/<camelCase>Service.js` | `cardService.js`, `auditService.js` |
| Validator files | `src/validators/<camelCase>Validator.js` | `cardValidator.js` |
| Middleware files | `src/middleware/<camelCase>.js` | `authentication.js`, `rateLimiter.js` |
| Utility files | `src/utils/<camelCase>.js` | `logger.js`, `masking.js` |
| Test files | `tests/<type>/<module>.test.js` | `tests/unit/models/Card.test.js` |
| Variables/functions | `camelCase` | `createCard`, `findById` |
| Classes | `PascalCase` | `Card`, `SpendingLimit` |
| Constants | `UPPER_SNAKE_CASE` | `AUDIT_ACTIONS`, `MAX_LIMIT` |

---

## Patterns to Follow

### Architecture
- **Controller-Service-Model** pattern: routes call services, services call models. Routes must never access models directly.
- Middleware chain order: `requestId` → `express.json()` → `cors` → `authenticateToken` → `rateLimiter` → routes → `errorHandler`.
- API versioning: all routes under `/api/v1/`.

### Response Envelopes

Success:
```json
{ "data": { ... }, "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

Error:
```json
{ "error": { "code": "CARD_NOT_FOUND", "message": "...", "requestId": "uuid" } }
```

Validation error (with field details):
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "field": "...", "message": "...", "value": "..." }] } }
```

### Audit Logging
- Call `auditService.log()` from the service layer after every state-changing operation.
- Every `POST`, `PATCH`, and `DELETE` endpoint must produce exactly one audit record.

### Idempotency
- All mutation endpoints require an `Idempotency-Key` header (UUID v4).
- Duplicate keys return the cached original response.

---

## Things to AVOID

- **NEVER** log or return full PAN, CVV, encryption keys, or JWT secrets in any context.
- **NEVER** use `var` — use `const` (default) or `let` (when reassignment needed).
- **NEVER** use `==` or `!=` — always use `===` and `!==`.
- **NEVER** use floating-point (`Number`) for monetary calculations — always use `Decimal.js`.
- **NEVER** expose stack traces in production error responses.
- **NEVER** allow `AuditLog` records to be updated or deleted.
- **NEVER** store plaintext PAN or CVV in any storage mechanism.
- **NEVER** skip input validation on any endpoint.
- **NEVER** use `console.log` — always use the structured `pino` logger.
- **NEVER** access models directly from route handlers — always go through the service layer.
- **NEVER** hardcode secrets — always load from environment variables.

---

## Domain-Specific Guidance

### Card Numbers
- Must pass Luhn validation.
- Generated with a designated BIN prefix (e.g., `400000`).
- Masked format in responses: `**** **** **** 1234` (last 4 digits only).

### Card Status State Machine
```
active  ↔  frozen     (reversible via freeze/unfreeze)
active  →  cancelled  (irreversible)
frozen  →  cancelled  (irreversible)
```
- Invalid transitions → respond with `409 Conflict`.
- Cancelled cards cannot be reactivated.

### Spending Limits
- Three tiers: `perTransaction <= dailyLimit <= monthlyLimit` (always enforced).
- All amounts in **integer cents**.
- Maximum caps: per-transaction 1,000,000; daily 5,000,000; monthly 50,000,000.

### Timestamps
- All timestamps must be ISO 8601 UTC format.
- Use `new Date().toISOString()` for consistency.

### Audit Hash Chain
- SHA-256 hash chain with genesis hash: 64 zeros (`"0".repeat(64)`).
- Hash input: `${previousHash}|${timestamp}|${cardId}|${action}|${actorId}|${JSON.stringify(newState)}`.
- Chain integrity is verifiable via `auditService.verifyChain(cardId)`.

### Authentication
- JWT Bearer tokens on all endpoints (except `GET /health`).
- Token payload: `{ userId, role }`.
- Missing or invalid token → `401 Unauthorized`.
