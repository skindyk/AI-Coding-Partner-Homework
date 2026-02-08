# Virtual Card Lifecycle Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective

Build a secure RESTful API for managing the complete virtual card lifecycle — including card creation with tokenized card data, freeze/unfreeze operations, configurable spending limits, filtered transaction history, and status management — all compliant with PCI DSS data-handling requirements and producing immutable audit trails for every state change.

## Mid-Level Objectives

### 1. Compliance and Regulatory Requirements

- All card data (PAN, CVV, expiry) must be stored only in encrypted or tokenized form, never in plaintext, conforming to PCI DSS Requirement 3 (Protect Stored Cardholder Data).
- The system must support GDPR right-to-erasure: a `DELETE /api/v1/cards/:id/personal-data` endpoint that anonymizes cardholder PII while retaining transaction audit records.
- CCPA data-access: a `GET /api/v1/cards/:id/data-export` endpoint returns all data associated with a cardholder in a portable JSON format.
- **Measurable criterion**: Zero instances of plaintext PAN or CVV in logs, database, or API responses. Verified by automated tests scanning all response bodies and log output.

### 2. Security and Data Protection

- Card numbers (PAN) must be generated following the Luhn algorithm with a designated BIN prefix (e.g., `4000 00XX XXXX XXXX`).
- CVV must be generated as a cryptographically random 3-digit number and stored only as a bcrypt hash; it is returned to the user exactly once at creation and never again.
- All API endpoints require authentication via Bearer JWT tokens; card-mutation endpoints additionally require idempotency keys.
- Sensitive fields in API responses must be masked (e.g., PAN shown as `**** **** **** 1234`).
- **Measurable criterion**: A security test suite that attempts to retrieve raw PAN/CVV from all endpoints returns zero matches.

### 3. Audit and Logging

- Every state-changing operation (create, freeze, unfreeze, limit change, status change) must produce an immutable audit log entry containing: timestamp (ISO 8601 UTC), actor ID, action type, previous state, new state, IP address, and idempotency key.
- Audit logs must be append-only (no update or delete operations exposed).
- A `GET /api/v1/cards/:id/audit-log` endpoint returns the full history with pagination.
- **Measurable criterion**: For every `POST`/`PUT`/`PATCH`/`DELETE` request, exactly one corresponding audit record exists in the audit store. Verified by integration tests.

### 4. Performance and Scalability

- Card creation endpoint must respond within 200 ms at the 95th percentile under a load of 100 concurrent requests.
- Transaction listing with filters must respond within 150 ms for datasets up to 10,000 transactions per card.
- The system must handle 500 requests/second without error rate exceeding 0.1%.
- All monetary values must use integer-cent representation (or `Decimal.js`) to avoid floating-point errors.
- **Measurable criterion**: Performance test suite in Jest validates p95 latency and throughput targets.

### 5. Integration Requirements

- The API must expose OpenAPI 3.0-compliant documentation auto-generated from route definitions.
- Webhook support: the system must emit events (`card.created`, `card.frozen`, `card.unfrozen`, `card.limit.updated`, `card.status.changed`) to a configurable webhook URL.
- Health-check endpoint (`GET /health`) must return service status, uptime, and dependency health.
- **Measurable criterion**: OpenAPI spec validates without errors using `swagger-cli validate`; webhook delivery is testable via a mock server in integration tests.

## Implementation Notes

### Data Privacy (GDPR / CCPA)

- Personal data fields (cardholder name, email, phone) must be flagged with a `@personalData` JSDoc annotation in the model for automated discovery.
- Data retention policy: card data marked as deleted must be fully anonymized within 72 hours (configurable via environment variable `DATA_RETENTION_HOURS`).
- All API responses returning personal data must include a `X-Data-Classification: PII` response header.

### Audit Trail Requirements

- Use a dedicated `AuditLog` model stored in a separate in-memory collection.
- Each audit entry is immutable: the model exposes only `create` and `findByCardId` operations, never `update` or `delete`.
- Audit entries must include a SHA-256 hash of the previous entry to form a verifiable chain (tamper-evidence).

### Error Handling and Logging

- Use structured JSON logging via `pino` with fields: `timestamp`, `level`, `requestId`, `message`, `context`.
- Never log sensitive data: PAN, CVV, full card numbers, or bearer tokens must be redacted in all log output.
- All errors must return a standard envelope:
  ```json
  {
    "error": {
      "code": "CARD_NOT_FOUND",
      "message": "The requested card does not exist.",
      "requestId": "uuid-here"
    }
  }
  ```
- HTTP status codes: `201` creation, `200` retrieval/updates, `400` validation errors, `401` auth failures, `403` forbidden operations (e.g., operating on a cancelled card), `404` not found, `409` idempotency conflicts or invalid state transitions, `429` rate limiting, `500` internal errors.

### Input Validation and Sanitization

- Use `joi` for request body and query parameter validation.
- All string inputs must be trimmed and sanitized against XSS (using `xss-filters` or equivalent).
- Monetary amounts must be validated as positive integers representing cents.
- Spending limits must satisfy: `perTransaction <= dailyLimit <= monthlyLimit` (logical consistency rule).
- Card ID format: UUID v4.

### Monetary Calculations

- Use the `decimal.js` npm package for all monetary arithmetic.
- Store amounts as strings in the model to preserve precision; convert to `Decimal` for computation.
- Never use native JavaScript floating-point for money.

### Node.js / Express.js Specifics

- Express.js 4.x with `express.json()` middleware.
- Middleware ordering: CORS → request-ID generation → body parsing → authentication → rate limiting → route handlers → error handler.
- Use `express.Router()` to modularize routes into `routes/cards.js`, `routes/transactions.js`, `routes/audit.js`.
- Use `async/await` with `express-async-errors` or a wrapper to catch unhandled promise rejections in route handlers.
- Environment configuration via `dotenv` with a `.env.example` file documenting all required variables.

## Context

### Beginning Context

The project starts with the specification documents already in place:

```
homework-3/
├── specification.md                    # This specification (already written)
├── agents.md                           # Agent guidelines (already written)
├── .claude/
│   └── rules.md                        # Claude Code rules (already written)
├── README.md                           # Reflection README (already written)
├── TASKS.md                            # Assignment instructions (provided)
└── specification-TEMPLATE-example.md   # Template reference (provided)
```

The previous homeworks established this Node.js/Express convention:

```
src/
├── index.js          # Express app entry point
├── routes/           # API route handlers
├── models/           # Data models (in-memory storage)
├── validators/       # Input validation
└── utils/            # Helper functions
```

### Ending Context

After implementation of this specification, the project will contain:

```
homework-3/
├── specification.md
├── agents.md
├── .claude/
│   └── rules.md
├── README.md
├── TASKS.md
├── specification-TEMPLATE-example.md
├── package.json
├── .env.example
├── .gitignore
├── src/
│   ├── index.js                            # Express app entry point
│   ├── config/
│   │   └── index.js                        # Environment config loader
│   ├── middleware/
│   │   ├── authentication.js               # JWT Bearer token verification
│   │   ├── rateLimiter.js                  # Rate limiting middleware
│   │   ├── requestId.js                    # UUID request-ID injection
│   │   ├── idempotency.js                  # Idempotency key handling
│   │   └── errorHandler.js                 # Centralized error handler
│   ├── routes/
│   │   ├── cards.js                        # Virtual card CRUD + freeze/unfreeze
│   │   ├── transactions.js                 # Transaction listing with filters
│   │   └── audit.js                        # Audit log retrieval
│   ├── models/
│   │   ├── Card.js                         # Virtual card data model
│   │   ├── Transaction.js                  # Transaction data model
│   │   ├── AuditLog.js                     # Immutable audit log model
│   │   └── SpendingLimit.js                # Spending limit model
│   ├── services/
│   │   ├── cardService.js                  # Card business logic
│   │   ├── transactionService.js           # Transaction query logic
│   │   ├── auditService.js                 # Audit logging service
│   │   └── encryptionService.js            # PAN tokenization, CVV hashing
│   ├── validators/
│   │   ├── cardValidator.js                # Card creation/update validation
│   │   ├── spendingLimitValidator.js       # Spending limit validation
│   │   └── transactionQueryValidator.js    # Query parameter validation
│   └── utils/
│       ├── cardNumberGenerator.js          # Luhn-compliant PAN generation
│       ├── masking.js                      # PAN/CVV masking utilities
│       ├── logger.js                       # Structured JSON logger (pino)
│       └── decimal.js                      # Decimal.js wrapper for money
├── tests/
│   ├── unit/
│   │   ├── models/
│   │   │   ├── Card.test.js
│   │   │   ├── Transaction.test.js
│   │   │   ├── AuditLog.test.js
│   │   │   └── SpendingLimit.test.js
│   │   ├── services/
│   │   │   ├── cardService.test.js
│   │   │   ├── encryptionService.test.js
│   │   │   └── auditService.test.js
│   │   ├── validators/
│   │   │   ├── cardValidator.test.js
│   │   │   └── spendingLimitValidator.test.js
│   │   └── utils/
│   │       ├── cardNumberGenerator.test.js
│   │       └── masking.test.js
│   ├── integration/
│   │   ├── cardLifecycle.test.js            # Full lifecycle integration
│   │   ├── spendingLimits.test.js           # Limit enforcement integration
│   │   └── auditTrail.test.js               # Audit completeness verification
│   ├── security/
│   │   └── dataLeakage.test.js              # Scans for plaintext PAN/CVV
│   ├── performance/
│   │   └── loadTest.test.js                 # p95 latency verification
│   └── fixtures/
│       ├── sampleCards.json
│       └── sampleTransactions.json
└── docs/
    └── openapi.yaml                         # OpenAPI 3.0 specification
```

## Low-Level Tasks

### 1. Data Models (Card, Transaction, SpendingLimit, AuditLog)

**What prompt would you run to complete this task?**

Create four data model modules for a virtual card management system using in-memory storage (JavaScript arrays/Maps). The `Card` model must store: `id` (UUID v4), `cardholderName`, `maskedPan` (last 4 digits only), `panToken` (encrypted/tokenized PAN), `cvvHash` (bcrypt hash), `expiryMonth`, `expiryYear`, `status` (enum: active, frozen, cancelled, expired), `createdAt`, `updatedAt`. The `Transaction` model must store: `id` (UUID v4), `cardId`, `merchantName`, `merchantCategory`, `amount` (string for Decimal.js), `currency` (ISO 4217), `type` (purchase, refund, fee), `status` (pending, completed, declined, reversed), `timestamp`, `declineReason` (nullable). The `SpendingLimit` model must store: `cardId`, `perTransaction`, `dailyLimit`, `monthlyLimit`, `dailySpent`, `monthlySpent`, `lastResetDate`. The `AuditLog` model must store: `id`, `cardId`, `action`, `actorId`, `previousState`, `newState`, `ipAddress`, `idempotencyKey`, `timestamp`, `previousHash`, `hash`. Each model must expose CRUD methods (AuditLog: create and read-only, no update/delete). Use the `uuid` package for IDs. Include JSDoc comments on every method.

**What file do you want to CREATE or UPDATE?**
- `src/models/Card.js`
- `src/models/Transaction.js`
- `src/models/SpendingLimit.js`
- `src/models/AuditLog.js`

**What function do you want to CREATE or UPDATE?**
- `Card` class — `create(data)`, `findById(id)`, `findAll(filters)`, `updateStatus(id, status)`, `updateField(id, field, value)`, `softDelete(id)`
- `Transaction` class — `create(data)`, `findById(id)`, `findByCardId(cardId, filters)`, `countByCardId(cardId)`
- `SpendingLimit` class — `create(data)`, `findByCardId(cardId)`, `update(cardId, limits)`, `incrementSpent(cardId, amount, type)`, `resetDaily(cardId)`, `resetMonthly(cardId)`
- `AuditLog` class — `create(entry)`, `findByCardId(cardId, pagination)`, `computeHash(entry, previousHash)`

**What are details you want to add to drive the code changes?**
- All monetary fields stored as strings and computed with `Decimal.js`.
- `AuditLog.create()` must compute SHA-256 hash chaining automatically.
- No model exposes raw PAN or CVV — only `maskedPan` and `cvvHash`.
- Each model file must export a singleton instance for in-memory storage.
- Card status enum values: `active`, `frozen`, `cancelled`, `expired`.

---

### 2. Encryption and Card Number Generation Services

**What prompt would you run to complete this task?**

Create two service modules: (1) `encryptionService.js` that provides `tokenizePan(pan)` returning a reversible AES-256-GCM encrypted token, `detokenizePan(token)` for authorized internal use only, `hashCvv(cvv)` using bcrypt with salt rounds 12, and `verifyCvv(cvv, hash)`. The encryption key must be loaded from environment variable `CARD_ENCRYPTION_KEY` (32-byte hex string). (2) `cardNumberGenerator.js` that provides `generatePan(binPrefix)` producing a 16-digit Luhn-valid card number with the given BIN prefix, `generateCvv()` producing a cryptographically random 3-digit string, and `generateExpiry()` producing an expiry date 3 years from now. Use Node.js `crypto` module for all cryptographic operations. Include `validateLuhn(pan)` as an exported utility.

**What file do you want to CREATE or UPDATE?**
- `src/services/encryptionService.js`
- `src/utils/cardNumberGenerator.js`

**What function do you want to CREATE or UPDATE?**
- `tokenizePan(pan)`, `detokenizePan(token)`, `hashCvv(cvv)`, `verifyCvv(cvv, hash)`
- `generatePan(binPrefix)`, `generateCvv()`, `generateExpiry()`, `validateLuhn(pan)`

**What are details you want to add to drive the code changes?**
- The `detokenizePan` function must log a warning-level audit event every time it is called (indicating PAN was accessed in plaintext internally).
- AES-256-GCM must use a random IV per encryption; store IV alongside ciphertext as `iv:authTag:ciphertext` in hex.
- Luhn algorithm implementation must be from scratch (no npm package) to demonstrate understanding.
- `CARD_ENCRYPTION_KEY` missing at startup must cause a fatal error preventing the application from starting.

---

### 3. API Route Handlers (Cards, Transactions, Audit)

**What prompt would you run to complete this task?**

Create Express.js route modules for virtual card management:

(A) `routes/cards.js`:
- `POST /cards` — creates a card, generates PAN/CVV/expiry, returns masked PAN and CVV exactly once; requires `Idempotency-Key` header.
- `GET /cards` — lists all cards for the authenticated user (masked PAN only).
- `GET /cards/:id` — single card detail (masked PAN).
- `PATCH /cards/:id/freeze` — sets status to `frozen`.
- `PATCH /cards/:id/unfreeze` — sets status to `active` (only if currently `frozen`).
- `PATCH /cards/:id/limits` — updates spending limits with body `{ perTransaction, dailyLimit, monthlyLimit }`.
- `DELETE /cards/:id` — sets status to `cancelled` (irreversible).

(B) `routes/transactions.js`:
- `GET /cards/:id/transactions` with query params: `status`, `type`, `merchantCategory`, `fromDate`, `toDate`, `minAmount`, `maxAmount`, `page`, `limit` (default 20, max 100).

(C) `routes/audit.js`:
- `GET /cards/:id/audit-log` with pagination (`page`, `limit`).

All routes must call the corresponding service layer (never contain business logic directly). All mutation routes must call `auditService.log()` after successful operations.

**What file do you want to CREATE or UPDATE?**
- `src/routes/cards.js`
- `src/routes/transactions.js`
- `src/routes/audit.js`

**What function do you want to CREATE or UPDATE?**
- Route handlers: `createCard`, `listCards`, `getCard`, `freezeCard`, `unfreezeCard`, `updateLimits`, `cancelCard`
- `listTransactions`
- `getAuditLog`

**What are details you want to add to drive the code changes?**
- `POST /cards` response must include the full (unmasked) PAN and CVV in the response body exactly once; all subsequent GET requests return only masked versions.
- `PATCH /cards/:id/freeze` must reject if card status is `cancelled` or `expired` (return `403`).
- `PATCH /cards/:id/unfreeze` must reject if card status is not `frozen` (return `409`).
- `DELETE /cards/:id` must be idempotent: calling on an already-cancelled card returns `200`.
- Transaction filtering must support combining all filters simultaneously.
- Pagination response format: `{ data: [...], pagination: { page, limit, total, totalPages } }`.

---

### 4. Input Validation Middleware

**What prompt would you run to complete this task?**

Create validation middleware modules using `joi` for all virtual card API endpoints:

(1) `cardValidator.js` — validate `POST /cards` body requiring `cardholderName` (string, 2–100 chars, alphabetic with spaces), optional `currency` (ISO 4217, default USD); validate `PATCH /cards/:id/limits` body requiring at least one of `perTransaction`, `dailyLimit`, `monthlyLimit` (all positive integers representing cents, with logical constraint `perTransaction <= dailyLimit <= monthlyLimit`).

(2) `spendingLimitValidator.js` — standalone validation that spending limits are logically consistent and within allowed maximums (per-transaction max 1,000,000 cents = $10,000; daily max 5,000,000 cents = $50,000; monthly max 50,000,000 cents = $500,000).

(3) `transactionQueryValidator.js` — validate query parameters for `GET /cards/:id/transactions`: `page` (positive integer), `limit` (1–100), `fromDate`/`toDate` (ISO 8601, `fromDate` must be before `toDate`), `minAmount`/`maxAmount` (positive integers, `minAmount <= maxAmount`), `status` and `type` (enum values).

**What file do you want to CREATE or UPDATE?**
- `src/validators/cardValidator.js`
- `src/validators/spendingLimitValidator.js`
- `src/validators/transactionQueryValidator.js`

**What function do you want to CREATE or UPDATE?**
- `validateCreateCard(req, res, next)`, `validateUpdateLimits(req, res, next)`
- `validateSpendingLimits(limits)` — pure function returning `{ valid, errors }`
- `validateTransactionQuery(req, res, next)`

**What are details you want to add to drive the code changes?**
- Validation errors must return `400` with the standard error envelope containing field-level errors: `{ error: { code: "VALIDATION_ERROR", message: "...", details: [{ field, message, value }] } }`.
- The logical constraint `perTransaction <= dailyLimit <= monthlyLimit` must produce a clear error message naming both fields involved.
- Date range validation: `toDate` defaults to now if omitted; `fromDate` defaults to 30 days before `toDate` if omitted.

---

### 5. Security Middleware (Authentication, Rate Limiting, Idempotency)

**What prompt would you run to complete this task?**

Create Express.js middleware modules for security concerns:

(1) `authentication.js` — extract Bearer token from `Authorization` header, verify as JWT using `jsonwebtoken` with secret from `JWT_SECRET` env var, attach decoded payload (`userId`, `role`) to `req.user`. Return `401` for missing/invalid tokens.

(2) `rateLimiter.js` — implement in-memory rate limiting using a sliding window algorithm. Limits: 100 requests per minute per user (`req.user.userId`). Return `429` with `Retry-After` header.

(3) `idempotency.js` — for POST/PATCH/DELETE requests, require `Idempotency-Key` header (UUID v4 format). Store request-response pairs in memory keyed by `(userId + idempotencyKey)`. If the same key is received within 24 hours, return the cached response with `200`. Return `400` if header is missing on mutation endpoints.

(4) `requestId.js` — generate a UUID v4 `X-Request-ID` for every incoming request; attach to `req.requestId` and include in all responses.

(5) `errorHandler.js` — centralized Express error handler that catches all thrown errors, logs with the structured logger, and returns the standard error envelope. Must sanitize error messages in production (no stack traces).

**What file do you want to CREATE or UPDATE?**
- `src/middleware/authentication.js`
- `src/middleware/rateLimiter.js`
- `src/middleware/idempotency.js`
- `src/middleware/requestId.js`
- `src/middleware/errorHandler.js`

**What function do you want to CREATE or UPDATE?**
- `authenticateToken(req, res, next)`
- `rateLimiter(options)` — factory function returning middleware
- `idempotencyCheck(req, res, next)`
- `attachRequestId(req, res, next)`
- `errorHandler(err, req, res, next)`

**What are details you want to add to drive the code changes?**
- JWT payload must contain `userId` and `role` (at minimum); tokens should have a configurable expiry (`JWT_EXPIRES_IN` env var, default `1h`).
- Rate limiter must clean up expired entries periodically (every 60 seconds) to prevent memory leaks.
- Idempotency store must also clean up entries older than 24 hours.
- Error handler must never expose `CARD_ENCRYPTION_KEY`, JWT secrets, or internal file paths in error responses.

---

### 6. Audit Logging Service

**What prompt would you run to complete this task?**

Create an audit logging service (`auditService.js`) that provides:

- `log(cardId, action, actorId, previousState, newState, ipAddress, idempotencyKey)` — fetches the most recent audit entry for the card to get its hash, computes a SHA-256 hash of the new entry concatenated with the previous hash (chain integrity), persists via `AuditLog.create()`, and emits an event via Node.js `EventEmitter` for webhook integration.
- `verifyChain(cardId)` — reads all audit entries for a card and verifies the hash chain is intact, returning `{ valid: boolean, brokenAtIndex: number | null }`.
- `getLog(cardId, page, limit)` — paginated audit log retrieval.

Use an action enum: `CARD_CREATED`, `CARD_FROZEN`, `CARD_UNFROZEN`, `CARD_CANCELLED`, `LIMITS_UPDATED`, `STATUS_CHANGED`, `DATA_ACCESSED`, `DATA_DELETED`.

**What file do you want to CREATE or UPDATE?**
- `src/services/auditService.js`

**What function do you want to CREATE or UPDATE?**
- `log(cardId, action, actorId, previousState, newState, ipAddress, idempotencyKey)`
- `verifyChain(cardId)`
- `getLog(cardId, page, limit)`
- `AUDIT_ACTIONS` enum object

**What are details you want to add to drive the code changes?**
- Hash chain uses `crypto.createHash('sha256')` from Node.js.
- Hash input format: `${previousHash}|${timestamp}|${cardId}|${action}|${actorId}|${JSON.stringify(newState)}`.
- The first entry in a chain uses a genesis hash: `"0000000000000000000000000000000000000000000000000000000000000000"` (64 zeros).
- The `EventEmitter` must be exported so webhook integration can subscribe to `'audit.entry.created'` events.

---

### 7. Comprehensive Test Suite

**What prompt would you run to complete this task?**

Create a comprehensive Jest test suite for the virtual card lifecycle API achieving >85% code coverage. Organize tests into `tests/unit/`, `tests/integration/`, `tests/security/`, and `tests/performance/` directories.

**Unit tests** must cover:
- All four data models (CRUD operations, validation, edge cases — ~15 tests each)
- `cardNumberGenerator` (Luhn validation, BIN prefix, CVV randomness — 8 tests)
- `encryptionService` (tokenize/detokenize round-trip, CVV hash/verify, missing key behavior — 10 tests)
- All three validators (valid inputs, every invalid field, logical constraints — 12 tests each)
- `auditService` (logging, hash chain verification, chain tampering detection — 10 tests)

**Integration tests** must cover:
- Full card lifecycle: create → freeze → unfreeze → set limits → cancel (5 tests)
- Spending limit enforcement against transactions (4 tests)
- Audit trail completeness verification — every API call produces exactly one audit entry (3 tests)
- Authentication and rate limiting behavior (4 tests)

**Security tests**: Scan all API responses for plaintext PAN/CVV patterns (regex `/\b\d{16}\b/` for PAN, `/\b\d{3}\b/` for standalone CVV in card-related responses).

**Performance tests**: Measure p95 response time for card creation and transaction listing under concurrent load.

Use `supertest` for HTTP testing, `jest.mock()` for isolation. Create fixture files.

**What file do you want to CREATE or UPDATE?**
- `tests/unit/models/Card.test.js`, `Transaction.test.js`, `AuditLog.test.js`, `SpendingLimit.test.js`
- `tests/unit/services/cardService.test.js`, `encryptionService.test.js`, `auditService.test.js`
- `tests/unit/validators/cardValidator.test.js`, `spendingLimitValidator.test.js`
- `tests/unit/utils/cardNumberGenerator.test.js`, `masking.test.js`
- `tests/integration/cardLifecycle.test.js`, `spendingLimits.test.js`, `auditTrail.test.js`
- `tests/security/dataLeakage.test.js`
- `tests/performance/loadTest.test.js`
- `tests/fixtures/sampleCards.json`, `sampleTransactions.json`

**What function do you want to CREATE or UPDATE?**
- `describe` and `it`/`test` blocks for each test category as listed above.

**What are details you want to add to drive the code changes?**
- Mock the encryption key env variable in test setup: `process.env.CARD_ENCRYPTION_KEY = '0'.repeat(64)`.
- Use `beforeEach` to reset in-memory stores between tests.
- Integration tests must use `supertest(app)` where `app` is the Express application exported from `src/index.js`.
- Security tests must use regex patterns to scan response bodies returned by `supertest`.
- Coverage configuration in `package.json` Jest config: `collectCoverage: true`, threshold `{ global: { branches: 85, functions: 85, lines: 85, statements: 85 } }`.

---

### 8. Application Entry Point, Configuration, and Documentation

**What prompt would you run to complete this task?**

Create the Express.js application entry point (`src/index.js`) that:
1. Loads environment variables via `dotenv`.
2. Validates required env vars (`CARD_ENCRYPTION_KEY`, `JWT_SECRET`) exist or exits with a clear error.
3. Initializes Express with middleware in correct order: `requestId`, `express.json()`, `cors`, `authenticateToken`, `rateLimiter`.
4. Mounts route modules: `/api/v1/cards` → `routes/cards.js`, with nested transaction and audit routes.
5. Adds `GET /health` returning `{ status: "ok", uptime, timestamp }` (unauthenticated).
6. Adds the centralized `errorHandler` as the last middleware.
7. Exports `app` for testing and starts listening only when not in test mode (`NODE_ENV !== 'test'`).

Also create:
- `src/config/index.js` — exports a frozen configuration object with all env variables and defaults.
- `.env.example` — documents all required environment variables with descriptions.
- `docs/openapi.yaml` — full OpenAPI 3.0 specification for all endpoints.
- `package.json` — all dependencies, devDependencies, scripts (`start`, `dev`, `test`, `test:coverage`), and Jest configuration.

**What file do you want to CREATE or UPDATE?**
- `src/index.js`
- `src/config/index.js`
- `.env.example`
- `docs/openapi.yaml`
- `package.json`

**What function do you want to CREATE or UPDATE?**
- `startServer(port)` in `index.js`
- `config` frozen object in `config/index.js`

**What are details you want to add to drive the code changes?**
- API versioning: all routes under `/api/v1/`.
- `app` must be exported separately from `startServer` so `supertest` can use it without binding to a port.
- The health endpoint must be unauthenticated (placed before auth middleware).
- `package.json` must include `"engines": { "node": ">=18.0.0" }`.
- `.env.example` must list every variable with a description comment and a placeholder value.
- Dependencies: `express`, `joi`, `jsonwebtoken`, `bcryptjs`, `decimal.js`, `uuid`, `cors`, `pino`, `dotenv`, `xss-filters`.
- Dev dependencies: `jest`, `supertest`, `eslint`.
