# The Financial Exorcist — Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

---

## High-Level Objective

- Build a gamified personal-finance web application ("The Financial Exorcist") that tracks spending as "Sins," triggers humorous demonic-possession events on irresponsible transactions, and forces the user to complete digital "Rituals" before regaining access — all while enforcing FinTech-grade data handling, auditability, and client-side security.

---

## Mid-Level Objectives

1. **Transaction Ledger (CRUD)** — Provide a full create / read / update / delete interface for personal transactions stored in a server-side in-memory store (with optional localStorage mirror for offline resilience).
2. **Sin Classification Engine** — Automatically categorise every transaction into one of six Sin categories (`GLUTTONY`, `VANITY`, `SLOTH`, `GREED`, `LUST`, `WRATH`) based on amount, time-of-day, description keywords, and transaction history.
3. **Possession Detection** — Evaluate each new transaction against a registry of 10 configurable Demon trigger rules; when a rule fires, lock the UI into "Possessed Mode."
4. **Ritual Chamber** — Render a full-screen modal with one of four mini-game types (Mantra, Math, Wait, Shame) that the user must complete before the possession is cleared and normal operation resumes.
5. **Audit Trail & Compliance Logging** — Record every state-changing event (transaction created/edited/deleted, possession triggered, ritual started/completed/failed) in an append-only audit log exposed via a REST endpoint.
6. **Soul Purity Dashboard** — Display an aggregated financial-health score ("Soul Purity %") derived from total spend, sin distribution, and exorcism success rate, with a breakdown chart.
7. **Security & Data Privacy** — Sanitise all user input, enforce Content-Security-Policy headers, mask sensitive amounts in logs, and provide a one-click data-export / data-purge flow for GDPR-style compliance.
8. **Comprehensive Testing** — Achieve ≥ 85 % code coverage with Jest + Supertest across unit, integration, and API tests, including edge-case and security-focused test scenarios.

---

## Implementation Notes

### Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | Node.js (LTS) | Consistent with previous homework projects |
| Server framework | Express.js v5 | REST API + static file serving; same as HW-1 & HW-2 |
| Language | JavaScript (ES2022+, strict mode) | Matches existing codebase; JSDoc type annotations for IDE support |
| Frontend | Vanilla HTML / CSS / JS served from `public/` | No build step required; keeps stack simple |
| State persistence | Server-side in-memory store (Map) + optional `localStorage` client mirror | Enables audit logging on the server while keeping offline UX |
| Testing | Jest v30 + Supertest | Same tooling as HW-2; 85 % coverage threshold enforced |
| Validation | `validator` npm package | Reuse from HW-2 for input sanitisation |
| IDs | `uuid` v8 | Reuse from HW-2 for transaction and audit-event identifiers |
| Dev tooling | Nodemon | Auto-reload during development |

### Coding Standards

- **Naming:** camelCase for variables/functions, PascalCase for classes, UPPER_SNAKE for constants/enums.
- **Modules:** CommonJS (`require`/`module.exports`) to match previous projects.
- **Error handling:** Express error-handling middleware; all errors return structured JSON `{ success: false, error: { code, message } }`.
- **Monetary values:** Store as integers (cents) to avoid floating-point rounding; display conversion happens only in the presentation layer.
- **Logging:** Structured JSON logs to stdout with timestamp, event type, and correlation ID.

### Security Considerations

- All user-supplied strings run through `validator.escape()` before storage.
- HTTP headers hardened with `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`.
- Amount values in audit logs are masked (e.g., `$**.**`) unless the caller has the `ops` role header.
- No secrets stored client-side; server enforces all business rules.
- Rate-limit transaction creation to 30 requests/minute per session to prevent abuse.

### Compliance & Audit

- Every mutation emits an `AuditEvent` with: `eventId`, `timestamp`, `action`, `entityType`, `entityId`, `beforeSnapshot`, `afterSnapshot`, `sessionId`.
- Audit log is append-only; no update or delete endpoints exposed.
- Data-export endpoint (`GET /api/v1/export`) returns all user data as JSON (GDPR Art. 20 portability).
- Data-purge endpoint (`DELETE /api/v1/purge`) irreversibly deletes all user data and writes a purge audit event.

### Performance Requirements

- API response time ≤ 100 ms for CRUD operations under 1 000 stored transactions.
- Ritual Chamber animations run at ≥ 30 fps on mid-range hardware.
- Client JS bundle (unminified) ≤ 150 KB.

---

## Context

### Beginning Context

- Empty `homework-3/` project directory (ignoring `Classic-app/`).
- Node.js and npm available on developer machine.
- Previous homework Express.js patterns available for reference (`homework-1/`, `homework-2/`).
- Specification and agent-rules documents delivered alongside this file.

### Ending Context

| Path | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts (`start`, `dev`, `test`) |
| `jest.config.js` | Jest configuration with 85 % coverage thresholds |
| `src/app.js` | Express app setup, middleware, route mounting |
| `src/server.js` | HTTP server entry point |
| `src/routes/transactions.js` | CRUD endpoints for Offerings |
| `src/routes/audit.js` | Read-only audit-log endpoint |
| `src/routes/dashboard.js` | Soul Purity score endpoint |
| `src/routes/compliance.js` | Data-export and data-purge endpoints |
| `src/models/Offering.js` | Transaction data model and validation |
| `src/models/Demon.js` | Demon registry with trigger functions |
| `src/models/AuditEvent.js` | Audit-event data model |
| `src/services/PossessionEngine.js` | Core detection logic |
| `src/services/RitualService.js` | Ritual state machine |
| `src/services/SoulPurityCalculator.js` | Dashboard scoring algorithm |
| `src/services/AuditLogger.js` | Append-only event writer |
| `src/middleware/errorHandler.js` | Centralised error formatting |
| `src/middleware/security.js` | CSP headers, rate limiting |
| `src/middleware/inputSanitiser.js` | Request body sanitisation |
| `src/store/InMemoryStore.js` | Server-side Map-based data store |
| `src/utils/money.js` | Cents ↔ display conversion helpers |
| `src/utils/validators.js` | Domain validation rules |
| `public/index.html` | Single-page frontend shell |
| `public/css/sanctuary.css` | Default (clean) theme |
| `public/css/possessed.css` | Dark/red possessed theme |
| `public/js/app.js` | Client-side application logic |
| `public/js/ritualChamber.js` | Ritual mini-game UI logic |
| `public/js/dashboard.js` | Soul Purity chart rendering |
| `tests/unit/offering.test.js` | Offering model unit tests |
| `tests/unit/demon.test.js` | Demon trigger-rule unit tests |
| `tests/unit/possessionEngine.test.js` | Possession detection tests |
| `tests/unit/ritualService.test.js` | Ritual state-machine tests |
| `tests/unit/soulPurity.test.js` | Dashboard scoring tests |
| `tests/unit/money.test.js` | Money utility tests |
| `tests/unit/sanitiser.test.js` | Input sanitisation tests |
| `tests/integration/api.transactions.test.js` | Transaction API integration tests |
| `tests/integration/api.audit.test.js` | Audit endpoint integration tests |
| `tests/integration/api.compliance.test.js` | Export/purge integration tests |
| `tests/integration/possession-flow.test.js` | End-to-end possession → ritual → exorcism flow |
| `tests/fixtures/demons.fixture.js` | Reusable demon test data |
| `tests/fixtures/offerings.fixture.js` | Reusable transaction test data |

---

## Low-Level Tasks

### 1. Project Initialisation & Configuration

**What prompt would you run to complete this task?**
Initialise a Node.js project with Express v5, Jest v30, Supertest, uuid, and validator. Create `package.json` with `start`, `dev`, and `test` scripts. Create `jest.config.js` enforcing 85 % coverage thresholds on branches, functions, lines, and statements. Add a `.gitignore` for `node_modules/`.

**What file do you want to CREATE or UPDATE?**
`package.json`, `jest.config.js`, `.gitignore`

**What function do you want to CREATE or UPDATE?**
N/A — configuration files only.

**What are details you want to add to drive the code changes?**
- `start` script: `node src/server.js`
- `dev` script: `npx nodemon src/server.js`
- `test` script: `jest --coverage`
- Jest `testMatch`: `["**/tests/**/*.test.js"]`
- Coverage collection from `src/**/*.js` excluding `src/server.js`
- Coverage thresholds: `{ global: { branches: 85, functions: 85, lines: 85, statements: 85 } }`

---

### 2. Data Models — Offering, Demon, AuditEvent

**What prompt would you run to complete this task?**
Create three data-model modules. `Offering` represents a financial transaction with fields: `id` (UUID), `amount` (integer cents), `description` (sanitised string), `category` (one of six SinCategory values), `timestamp` (Unix ms), `isExorcised` (boolean). `Demon` represents a possession trigger with: `id`, `name`, `title`, `triggerFn(offering, history) → boolean`, `ritualType` (MANTRA | MATH | WAIT | SHAME), `ritualConfig`, `punishmentMessage`. `AuditEvent` represents a log entry with: `eventId`, `timestamp`, `action`, `entityType`, `entityId`, `beforeSnapshot`, `afterSnapshot`, `sessionId`. Each module exports a `create()` factory function that validates inputs and returns a frozen object.

**What file do you want to CREATE or UPDATE?**
`src/models/Offering.js`, `src/models/Demon.js`, `src/models/AuditEvent.js`

**What function do you want to CREATE or UPDATE?**
`Offering.create(data)`, `Demon.create(config)`, `AuditEvent.create(data)`

**What are details you want to add to drive the code changes?**
- SinCategory enum: `{ GLUTTONY: 'GLUTTONY', VANITY: 'VANITY', SLOTH: 'SLOTH', GREED: 'GREED', LUST: 'LUST', WRATH: 'WRATH' }`
- RitualType enum: `{ MANTRA: 'MANTRA', MATH: 'MATH', WAIT: 'WAIT', SHAME: 'SHAME' }`
- `amount` must be a positive integer (cents); reject negative or zero values.
- `description` max length 200 characters; strip HTML tags.
- `category` must be one of the six SinCategory values.
- All factory functions throw descriptive `ValidationError` on invalid input.
- Objects are frozen with `Object.freeze()` to enforce immutability.

---

### 3. In-Memory Store

**What prompt would you run to complete this task?**
Create a generic in-memory data store backed by a JavaScript `Map`. It should support `getAll()`, `getById(id)`, `create(entity)`, `update(id, patch)`, `delete(id)`, and `clear()`. The store must be injectable (constructor accepts a store name) so separate instances can hold Offerings, AuditEvents, and Ritual sessions independently.

**What file do you want to CREATE or UPDATE?**
`src/store/InMemoryStore.js`

**What function do you want to CREATE or UPDATE?**
`class InMemoryStore { constructor(name), getAll(), getById(id), create(entity), update(id, patch), delete(id), clear(), count() }`

**What are details you want to add to drive the code changes?**
- `create()` throws if entity lacks an `id` field.
- `update()` returns the merged entity; throws if `id` not found.
- `delete()` returns the deleted entity; throws if `id` not found.
- `getAll()` returns a shallow-copied array (not a reference to internal Map values).
- Include a `count()` method returning current size.
- Thread-safe is not required (single-threaded Node.js), but operations must be synchronous and deterministic.

---

### 4. Demon Registry Configuration

**What prompt would you run to complete this task?**
Create a configuration module that exports an array of 10 Demon objects, each with a unique trigger function. Demons map to the specification table: Vogue-Zul, Gluttonous Rex, Uber-Lich, Latte-Lucifer, Sub-Succubus, Amazonian Imp, Stream-O-Phobia, Hoard-Wraith, Penny-Poltergeist, Debt-Diablo.

**What file do you want to CREATE or UPDATE?**
`src/models/demons.config.js`

**What function do you want to CREATE or UPDATE?**
`module.exports = [/* 10 Demon objects */]`

**What are details you want to add to drive the code changes?**

| # | Demon Name | Category | Trigger Condition | Ritual Type | Ritual Config |
|---|------------|----------|-------------------|-------------|---------------|
| 1 | Vogue-Zul | VANITY | `amount > 5000` (cents) on VANITY | MANTRA | `{ targetString: "I am not my fabric", repetitions: 30 }` |
| 2 | Gluttonous Rex | GLUTTONY | Transaction hour between 01:00–04:00 | MATH | `{ difficulty: 2, problemCount: 3 }` |
| 3 | Uber-Lich | SLOTH | `amount < 1500` (cents) on SLOTH | WAIT | `{ durationSeconds: 300 }` |
| 4 | Latte-Lucifer | GLUTTONY | Description contains "coffee" (case-insensitive) AND `amount > 600` | MANTRA | `{ targetString: "It is just bean water", repetitions: 10 }` |
| 5 | Sub-Succubus | LUST | 5th active LUST-category transaction in history | WAIT | `{ durationSeconds: 60 }` |
| 6 | Amazonian Imp | GREED | Transaction hour ≥ 23:00 | MATH | `{ difficulty: 3, problemCount: 1 }` |
| 7 | Stream-O-Phobia | LUST | `amount > 1500` (cents) on LUST | SHAME | `{ message: "Name a book you have not read" }` |
| 8 | Hoard-Wraith | GLUTTONY | `amount > 20000` (cents) | MANTRA | `{ targetString: "List every item", repetitions: 1 }` |
| 9 | Penny-Poltergeist | GREED | `amount % 100 === 99` (ends in .99) | MATH | `{ difficulty: 1, problemCount: 5 }` |
| 10 | Debt-Diablo | WRATH | Description contains "interest" (case-insensitive) | MANTRA | `{ targetString: "I am a slave to APR", repetitions: 50 }` |

- Trigger functions receive `(offering, history)` and return `boolean`.
- All string comparisons must be case-insensitive.
- Time-based triggers use the transaction's `timestamp` field, not `Date.now()`.

---

### 5. Possession Engine Service

**What prompt would you run to complete this task?**
Create a service that accepts a new Offering and the current Offering history, iterates through the Demon Registry, and returns the first Demon whose trigger fires (or `null` if none). The service must also manage the "active possession" state — only one demon can possess the user at a time.

**What file do you want to CREATE or UPDATE?**
`src/services/PossessionEngine.js`

**What function do you want to CREATE or UPDATE?**
`checkPossession(offering, history)`, `getActivePossession()`, `clearPossession()`, `isCurrentlyPossessed()`

**What are details you want to add to drive the code changes?**
- If a demon is already active, `checkPossession` skips evaluation and returns the current demon.
- `checkPossession` evaluates demons in registry order (index 0 first); first match wins.
- Each possession trigger emits an `AuditEvent` with action `POSSESSION_TRIGGERED`.
- `clearPossession()` emits an `AuditEvent` with action `POSSESSION_CLEARED`.
- The engine is stateful: maintain a `currentDemon` variable.
- Export a factory function so a fresh instance can be created for testing.

---

### 6. Ritual Service (State Machine)

**What prompt would you run to complete this task?**
Create a service that manages the lifecycle of a ritual: `start(demon) → inProgress → validate(input) → complete | fail`. Each ritual type has its own validation logic. The service tracks attempts and completion status.

**What file do you want to CREATE or UPDATE?**
`src/services/RitualService.js`

**What function do you want to CREATE or UPDATE?**
`startRitual(demon)`, `submitMantra(input)`, `submitMathAnswer(answer)`, `checkWaitComplete()`, `submitShameResponse(text)`, `getRitualState()`, `resetRitual()`

**What are details you want to add to drive the code changes?**
- **MANTRA:** User must type the exact `targetString` N times. Track a `completedCount`. A typo resets the count to 0. Emit audit event on reset.
- **MATH:** Generate `problemCount` random arithmetic problems at the given difficulty. Difficulty 1 = addition/subtraction up to 100; difficulty 2 = multiplication up to 12×12; difficulty 3 = percentage calculation (e.g., "15% of 8500"). All answers must be correct.
- **WAIT:** Record `startedAt` timestamp; `checkWaitComplete()` returns `true` only if `Date.now() - startedAt >= durationSeconds * 1000`.
- **SHAME:** User must submit a non-empty string of ≥ 10 characters.
- Ritual completion emits `AuditEvent` with action `RITUAL_COMPLETED`.
- Ritual failure (mantra typo, wrong math answer) emits `AuditEvent` with action `RITUAL_FAILED`.

---

### 7. Soul Purity Calculator

**What prompt would you run to complete this task?**
Create a service that computes a "Soul Purity" percentage from the user's transaction history and exorcism record. The score should be a number between 0 and 100.

**What file do you want to CREATE or UPDATE?**
`src/services/SoulPurityCalculator.js`

**What function do you want to CREATE or UPDATE?**
`calculatePurity(offerings, auditEvents)`, `getBreakdown(offerings)`

**What are details you want to add to drive the code changes?**
- **Base score:** Start at 100.
- **Deductions:** −5 per unexorcised offering, −2 per exorcised offering, −10 for any offering over $100, −15 for any late-night transaction (23:00–04:00).
- **Bonuses:** +3 per successfully completed ritual (from audit log), +5 if no possession in the last 7 days.
- **Floor:** Score cannot drop below 0.
- `getBreakdown(offerings)` returns an object with per-category totals: `{ GLUTTONY: 4500, VANITY: 12000, ... }` (in cents).
- All monetary calculations use integer arithmetic (cents).

---

### 8. Audit Logger Service

**What prompt would you run to complete this task?**
Create an append-only audit logging service. Every business action writes an AuditEvent to the audit store. Provide a query interface for retrieving events filtered by action type, entity type, or date range.

**What file do you want to CREATE or UPDATE?**
`src/services/AuditLogger.js`

**What function do you want to CREATE or UPDATE?**
`log(action, entityType, entityId, before, after, sessionId)`, `getEvents(filters)`, `getEventsByEntity(entityId)`, `exportAll()`

**What are details you want to add to drive the code changes?**
- `log()` creates an `AuditEvent` via the model factory and stores it in the audit `InMemoryStore`.
- `log()` is synchronous and never throws; errors are caught internally and printed to stderr.
- `getEvents(filters)` supports: `{ action, entityType, from, to }` — all optional.
- Amount values in `beforeSnapshot` / `afterSnapshot` are masked by default (`"$**.**"`); an `unmask: true` option reveals actual values.
- `exportAll()` returns a deep copy of all events (for the GDPR export endpoint).
- No delete or update methods exposed — append-only by design.

---

### 9. Express App Setup & Security Middleware

**What prompt would you run to complete this task?**
Create the Express application with security middleware (CSP headers, rate limiting, input sanitisation), error-handling middleware, and route mounting. Serve static files from `public/`.

**What file do you want to CREATE or UPDATE?**
`src/app.js`, `src/server.js`, `src/middleware/security.js`, `src/middleware/inputSanitiser.js`, `src/middleware/errorHandler.js`

**What function do you want to CREATE or UPDATE?**
`createApp()` in `app.js`; `setSecurityHeaders(req, res, next)`, `rateLimiter(maxRequests, windowMs)` in `security.js`; `sanitiseBody(req, res, next)` in `inputSanitiser.js`; `errorHandler(err, req, res, next)` in `errorHandler.js`

**What are details you want to add to drive the code changes?**
- `app.js` exports the configured Express app (no `.listen()`); `server.js` calls `.listen()` — this separation enables Supertest testing.
- Security headers: `Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.
- Rate limiter: simple in-memory counter per session; 30 requests/minute for POST/PUT/DELETE.
- `sanitiseBody` runs `validator.escape()` on all string fields in `req.body` recursively.
- `errorHandler` formats all errors as `{ success: false, error: { code: string, message: string } }`.
- Mount routes at `/api/v1/transactions`, `/api/v1/audit`, `/api/v1/dashboard`, `/api/v1/compliance`.

---

### 10. Transaction CRUD Routes

**What prompt would you run to complete this task?**
Create RESTful routes for managing Offerings (transactions): list all, get by ID, create, update, and delete. On create/update, run the Possession Engine check and return possession status in the response.

**What file do you want to CREATE or UPDATE?**
`src/routes/transactions.js`

**What function do you want to CREATE or UPDATE?**
`GET /` (list), `GET /:id`, `POST /` (create), `PUT /:id` (update), `DELETE /:id`

**What are details you want to add to drive the code changes?**
- `POST /` body: `{ amount, description, category, timestamp? }`. If `timestamp` is omitted, use `Date.now()`. `amount` is in cents (integer).
- After creating an Offering, call `possessionEngine.checkPossession(offering, allOfferings)`.
- Response shape for create: `{ success: true, data: { offering, possession: demon | null } }`.
- `PUT /:id` — only `description` and `category` can be changed post-creation (amount and timestamp are immutable for audit integrity).
- `DELETE /:id` — soft-delete is not required; hard-delete is fine but must emit an audit event with the deleted offering as `beforeSnapshot`.
- Validate all inputs; return 400 with descriptive error on validation failure.
- Return 404 for unknown IDs.

---

### 11. Audit, Dashboard & Compliance Routes

**What prompt would you run to complete this task?**
Create three additional route modules: audit log viewer, soul-purity dashboard, and GDPR compliance endpoints (export + purge).

**What file do you want to CREATE or UPDATE?**
`src/routes/audit.js`, `src/routes/dashboard.js`, `src/routes/compliance.js`

**What function do you want to CREATE or UPDATE?**
Audit: `GET /` with query filters. Dashboard: `GET /` returns soul purity score and breakdown. Compliance: `GET /export`, `DELETE /purge`.

**What are details you want to add to drive the code changes?**
- **Audit** `GET /api/v1/audit?action=POSSESSION_TRIGGERED&from=1700000000000&to=1700099999999` — returns filtered events; amounts masked unless `?unmask=true` is passed with `x-role: ops` header.
- **Dashboard** `GET /api/v1/dashboard` — returns `{ soulPurity: 72, breakdown: { GLUTTONY: 4500, ... }, totalOfferings: 15, totalPossessions: 3 }`.
- **Compliance** `GET /api/v1/compliance/export` — returns `{ offerings: [...], auditEvents: [...] }` as a JSON download (Content-Disposition header).
- **Compliance** `DELETE /api/v1/compliance/purge` — clears all stores, writes a final `DATA_PURGED` audit event, returns `{ success: true, message: "All data purged" }`.
- Purge endpoint requires confirmation header: `x-confirm-purge: yes`.

---

### 12. Frontend — Sanctuary & Possessed Modes

**What prompt would you run to complete this task?**
Create the client-side HTML, CSS, and JavaScript. The page has two visual modes: Sanctuary (default, clean finance UI) and Possessed (dark/red theme with screen shake). The JS communicates with the Express API via `fetch()`.

**What file do you want to CREATE or UPDATE?**
`public/index.html`, `public/css/sanctuary.css`, `public/css/possessed.css`, `public/js/app.js`

**What function do you want to CREATE or UPDATE?**
`renderTransactions()`, `handleAddTransaction()`, `enterPossessedMode(demon)`, `exitPossessedMode()`, `updateDashboard()`

**What are details you want to add to drive the code changes?**
- **Sanctuary Mode:** White/gold/grey palette; clean sans-serif font (system font stack); card-based transaction list; floating "+" button.
- **Possessed Mode:** Toggle CSS class `possessed` on `<body>`; deep red (#4a0000) background, neon red (#ff0033) text, Gothic serif font (via Google Fonts: Creepster); CSS `@keyframes jitter` animation on body (random translate ±3px every 2 s); vignette overlay via `::after` pseudo-element with radial-gradient.
- All API calls go through a `fetchApi(method, path, body?)` helper that handles errors consistently.
- On 201 response from POST `/api/v1/transactions`, check `data.possession`; if not null, call `enterPossessedMode(demon)`.
- Dashboard section at the top shows Soul Purity as a circular progress indicator.

---

### 13. Frontend — Ritual Chamber Modal

**What prompt would you run to complete this task?**
Create the Ritual Chamber as a full-screen modal overlay. Implement the four mini-game types: Mantra (typing), Math (equation solver), Wait (countdown), and Shame (text input). The modal blocks all other interaction until the ritual is completed.

**What file do you want to CREATE or UPDATE?**
`public/js/ritualChamber.js`

**What function do you want to CREATE or UPDATE?**
`openRitualChamber(demon)`, `renderMantra(config)`, `renderMath(config)`, `renderWait(config)`, `renderShame(config)`, `completeRitual()`, `updateProgress(percent)`

**What are details you want to add to drive the code changes?**
- Modal has three sections: **Header** (demon name + title), **Body** (mini-game), **Footer** (progress bar + disabled "Exorcise" button).
- "Exorcise" button becomes enabled only when progress reaches 100 %.
- **Mantra:** Large textarea; on each Enter, compare trimmed input to `targetString` (case-insensitive). Match → increment counter and clear field. Mismatch → reset counter to 0, flash the screen red, show `"THE DEMON LAUGHS AT YOUR WEAKNESS"`.
- **Math:** Display one problem at a time; input field + "Submit" button. Correct → next problem. Wrong → regenerate the same problem with different numbers.
- **Wait:** Full-screen countdown timer in large Gothic numerals. No interactive elements; just the passage of time.
- **Shame:** Textarea with minimum 10-character requirement; "Confess" button enabled when met.
- On completion, POST to a `/api/v1/transactions/:id/exorcise` endpoint (or handle client-side) to mark the offering as exorcised, then call `exitPossessedMode()`.

---

### 14. Unit Tests — Models & Services

**What prompt would you run to complete this task?**
Write Jest unit tests for all models (Offering, Demon, AuditEvent) and services (PossessionEngine, RitualService, SoulPurityCalculator, AuditLogger). Test happy paths, edge cases, and error conditions.

**What file do you want to CREATE or UPDATE?**
`tests/unit/offering.test.js`, `tests/unit/demon.test.js`, `tests/unit/possessionEngine.test.js`, `tests/unit/ritualService.test.js`, `tests/unit/soulPurity.test.js`, `tests/unit/money.test.js`, `tests/unit/sanitiser.test.js`

**What function do you want to CREATE or UPDATE?**
Test suites for each module.

**What are details you want to add to drive the code changes?**
- **Offering tests:** Valid creation, missing fields, negative amount, zero amount, invalid category, description too long, HTML in description stripped.
- **Demon tests:** Each of the 10 demons' trigger functions tested with a matching and non-matching offering.
- **PossessionEngine tests:** No possession when no triggers match; first-match-wins ordering; blocked when already possessed; audit events emitted.
- **RitualService tests:** Mantra correct/incorrect/reset; Math correct/incorrect/regenerate; Wait not-yet/complete; Shame too-short/valid.
- **SoulPurityCalculator tests:** Score 100 with no offerings; deductions applied correctly; floor at 0; bonuses applied; breakdown totals.
- **Money tests:** Cents-to-display, display-to-cents, rounding edge cases.
- **Sanitiser tests:** HTML tags stripped, special characters escaped, clean strings unchanged.
- Use test fixtures from `tests/fixtures/`.

---

### 15. Integration Tests — API Endpoints

**What prompt would you run to complete this task?**
Write Supertest integration tests for all API routes. Test request validation, successful operations, error responses, and the full possession-exorcism flow end-to-end.

**What file do you want to CREATE or UPDATE?**
`tests/integration/api.transactions.test.js`, `tests/integration/api.audit.test.js`, `tests/integration/api.compliance.test.js`, `tests/integration/possession-flow.test.js`

**What function do you want to CREATE or UPDATE?**
Integration test suites.

**What are details you want to add to drive the code changes?**
- **Transaction API:** POST valid offering → 201; POST invalid → 400; GET all → 200 array; GET by ID → 200 | 404; PUT valid → 200; PUT immutable field → 400; DELETE → 200 | 404.
- **Possession flow:** POST an offering that triggers Vogue-Zul → response includes `possession` object → verify audit log contains `POSSESSION_TRIGGERED` event.
- **Audit API:** GET with filters returns correct subset; masked amounts by default; unmasked with `x-role: ops`.
- **Compliance:** GET export returns all data; DELETE purge without confirmation header → 400; DELETE purge with header → 200 and stores empty.
- Each test suite uses `beforeEach` to reset all stores.
- Test fixtures in `tests/fixtures/offerings.fixture.js` and `tests/fixtures/demons.fixture.js`.

---

### 16. Test Fixtures

**What prompt would you run to complete this task?**
Create reusable test data fixtures for offerings and demons. Include a variety of transactions that trigger different demons and some that trigger none.

**What file do you want to CREATE or UPDATE?**
`tests/fixtures/offerings.fixture.js`, `tests/fixtures/demons.fixture.js`

**What function do you want to CREATE or UPDATE?**
`module.exports` exporting arrays/factories.

**What are details you want to add to drive the code changes?**
- At least 15 sample offerings covering all 6 sin categories.
- At least 5 offerings guaranteed to trigger specific demons (one per ritual type).
- At least 5 offerings guaranteed to trigger no demon.
- Timestamps should use fixed dates (not `Date.now()`) for deterministic testing.
- Include edge-case offerings: amount exactly at thresholds, description with special characters, boundary timestamps (exactly 01:00, exactly 04:00).
