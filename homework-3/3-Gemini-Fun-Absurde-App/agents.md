# Agent Configuration — The Financial Exorcist

> This file defines how an AI coding agent should behave when implementing The Financial Exorcist application. Feed this document to your AI assistant before beginning any implementation work.

---

## 1. Project Identity

- **Project name:** The Financial Exorcist
- **Domain:** Personal Finance / FinTech (gamified)
- **Tone of product:** Gothic, satirical, absurdist — but the **code** must be production-grade and serious.
- **Regulatory context:** Treat this as a regulated finance application. Even though it is a personal tracker, apply FinTech best practices: audit logging, input sanitisation, data portability, and secure defaults.

---

## 2. Tech Stack (Strict)

The agent must use **exactly** these technologies. Do not introduce alternatives.

| Concern | Technology | Version |
|---------|-----------|---------|
| Runtime | Node.js | LTS (≥ 18) |
| Server framework | Express.js | v5.x |
| Language | JavaScript (ES2022+) | Strict mode (`'use strict'`) |
| Module system | CommonJS | `require` / `module.exports` |
| Testing | Jest | v30.x |
| HTTP testing | Supertest | v7.x |
| ID generation | uuid | v8.x |
| Input validation | validator | latest |
| Dev reload | Nodemon | latest |
| Frontend | Vanilla HTML + CSS + JS | No frameworks, no bundlers |

**Do NOT:**
- Introduce TypeScript, Babel, or any transpiler.
- Add React, Vue, Svelte, or any frontend framework.
- Add a database (SQLite, Postgres, MongoDB, etc.) — use in-memory stores only.
- Add packages not listed above without explicit user approval.

---

## 3. Code Style & Conventions

### Naming
- **Variables & functions:** `camelCase` — e.g., `checkPossession`, `soulPurity`
- **Classes:** `PascalCase` — e.g., `InMemoryStore`, `PossessionEngine`
- **Constants & enums:** `UPPER_SNAKE_CASE` — e.g., `SIN_CATEGORIES`, `RITUAL_TYPES`
- **Files:** `camelCase.js` for modules, `PascalCase.js` for classes — e.g., `validators.js`, `InMemoryStore.js`
- **Test files:** `<module>.test.js` — e.g., `offering.test.js`

### Structure
```
src/
  app.js              # Express app factory (no .listen())
  server.js           # Entry point (.listen())
  models/             # Data models and config
  services/           # Business logic
  routes/             # Express route handlers
  middleware/         # Express middleware
  store/              # In-memory data store
  utils/              # Pure utility functions
public/
  index.html
  css/
  js/
tests/
  unit/
  integration/
  fixtures/
```

### Patterns
- **Factory functions over classes** for data models — return `Object.freeze(obj)`.
- **Dependency injection** — services receive their dependencies via constructor/factory parameters; no global singletons outside of `app.js`.
- **Separation of concerns** — route handlers must not contain business logic; delegate to services.
- **Single responsibility** — one module, one purpose. If a file exceeds ~150 lines, consider splitting.
- **No magic numbers** — extract thresholds and configuration values into named constants.

### Error Handling
- All Express routes use `try/catch` and pass errors to `next(err)`.
- Custom error classes: `ValidationError` (400), `NotFoundError` (404), `ConflictError` (409).
- Error middleware returns: `{ success: false, error: { code: "VALIDATION_ERROR", message: "..." } }`.
- Never expose stack traces to the client.

---

## 4. Domain Rules (Finance / Banking)

These rules are non-negotiable and must be followed in every code change.

### Monetary Values
- **Always store money as integers (cents).** Never use floating-point for currency.
- Conversion to display format (`$xx.xx`) happens only in presentation layer (frontend JS or response formatting).
- Use a `money.js` utility module for all conversions: `toCents(dollarString)`, `toDisplay(cents)`.

### Audit Trail
- **Every state mutation** must produce an `AuditEvent`: transaction CRUD, possession trigger/clear, ritual start/complete/fail, data purge.
- Audit log is **append-only**. No update or delete operations on audit events.
- Audit events include `beforeSnapshot` and `afterSnapshot` for traceability.
- Monetary values in audit snapshots are **masked by default** (`$**.**`); unmasking requires an explicit ops-role header.

### Data Privacy (GDPR-aligned)
- Provide a data-export endpoint returning all user data as JSON.
- Provide a data-purge endpoint that irreversibly clears all stores.
- The purge endpoint must require an explicit confirmation header.
- Never log raw monetary amounts to stdout/stderr; use masked values.

### Input Validation & Sanitisation
- Sanitise all string inputs with `validator.escape()` before storage.
- Validate category values against the SinCategory enum — reject unknowns.
- Enforce max lengths: `description` ≤ 200 chars, `name` ≤ 100 chars.
- Strip HTML tags from all text fields.
- Reject negative or zero monetary amounts.

### Security Headers
- Set `Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'`.
- Set `X-Content-Type-Options: nosniff`.
- Set `X-Frame-Options: DENY`.
- Rate-limit mutating endpoints (POST/PUT/DELETE) to 30 requests/minute.

---

## 5. Testing Expectations

### Coverage
- **Minimum 85 %** on branches, functions, lines, and statements.
- Coverage is enforced via `jest.config.js` thresholds — builds fail below this.

### Test Organisation
- `tests/unit/` — test individual functions and modules in isolation; mock dependencies.
- `tests/integration/` — test API endpoints via Supertest; test multi-service flows.
- `tests/fixtures/` — reusable test data; never generate random data in tests (deterministic only).

### Test Principles
- Each test file has a `beforeEach` that resets all stores to empty state.
- Tests must be independent — no shared mutable state between `it()` blocks.
- Test both happy path and error cases for every function.
- For demons: test one offering that triggers and one that does not, per demon.
- For rituals: test success, failure, and edge cases (e.g., mantra typo reset).
- Never use `setTimeout` in tests; mock time with `jest.useFakeTimers()` for Wait rituals.

### Naming Convention
```javascript
describe('PossessionEngine', () => {
  describe('checkPossession', () => {
    it('should return Vogue-Zul when VANITY offering exceeds $50', () => { ... });
    it('should return null when no demon triggers match', () => { ... });
  });
});
```

---

## 6. Agent Behaviour Rules

1. **Read before writing.** Always read the target file before editing it. Understand existing patterns.
2. **Follow existing patterns.** If the codebase uses factory functions, do not introduce classes. If it uses CommonJS, do not use ES modules.
3. **One task at a time.** Complete a low-level task fully (including tests) before moving to the next.
4. **Run tests after every change.** If tests fail, fix them before proceeding.
5. **Do not refactor unprompted.** Only change code that is directly related to the current task.
6. **Ask when ambiguous.** If a requirement is unclear, ask the user rather than guessing.
7. **Commit messages.** Use conventional format: `feat:`, `fix:`, `test:`, `docs:`, `chore:`. Keep messages under 72 characters.
8. **No secrets in code.** Never hardcode API keys, passwords, or sensitive values. This project has no secrets, but the habit must be enforced.
9. **Respect immutability.** Once an Offering is created, `amount` and `timestamp` are immutable. Only `description`, `category`, and `isExorcised` may be updated.
10. **Log everything.** If it changes state, it gets an audit event. No exceptions.
