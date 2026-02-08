# Claude Code Rules — The Financial Exorcist

## Project Overview
This is a gamified personal-finance Node.js/Express application themed around demonic possession. The code must be production-quality despite the humorous theme.

## Language & Runtime
- JavaScript only (ES2022+, strict mode). No TypeScript.
- CommonJS modules (`require` / `module.exports`). No ES module syntax.
- Node.js LTS. Express v5.

## File Naming
- Modules: `camelCase.js` (e.g., `validators.js`, `money.js`)
- Classes: `PascalCase.js` (e.g., `InMemoryStore.js`, `PossessionEngine.js`)
- Tests: `<module>.test.js` inside `tests/unit/` or `tests/integration/`
- CSS: `lowercase.css` (e.g., `sanctuary.css`, `possessed.css`)

## Monetary Values — CRITICAL
- ALWAYS store as integers representing cents. Never use `parseFloat` for money.
- Conversion helpers live in `src/utils/money.js` — always use them.
- Display formatting (`$xx.xx`) happens only in frontend JS or API response serialisation.
- Example: `$12.99` is stored as `1299`.

## Data Models
- Use factory functions that return `Object.freeze(obj)`, not classes.
- Every model has a `create(data)` function that validates inputs and throws `ValidationError` on failure.
- IDs are generated with `uuid.v4()`.

## Enums
- Define as frozen objects: `const SIN_CATEGORIES = Object.freeze({ GLUTTONY: 'GLUTTONY', ... })`.
- Always validate against enum values before accepting input.

## Express Patterns
- `app.js` exports the app (no `.listen()`). `server.js` calls `.listen()`.
- Route handlers: thin — validate input, call service, format response.
- All business logic lives in `src/services/`.
- Error flow: `throw new ValidationError(msg)` → caught by error middleware → JSON response.

## Security — Non-Negotiable
- Sanitise all string inputs with `validator.escape()`.
- Set CSP, X-Content-Type-Options, X-Frame-Options headers on every response.
- Rate-limit POST/PUT/DELETE to 30 req/min per session.
- Never expose stack traces to the client.
- Never log raw monetary amounts — mask as `$**.**` by default.

## Audit Trail — Non-Negotiable
- Every state mutation emits an AuditEvent.
- Audit log is append-only: no update, no delete endpoints.
- Events include `beforeSnapshot` and `afterSnapshot`.
- Mask monetary values in snapshots by default.

## Testing
- Jest + Supertest. Minimum 85% coverage (branches, functions, lines, statements).
- Deterministic: no `Math.random()` without seeding; no `Date.now()` without mocking.
- Reset all stores in `beforeEach`.
- Mock timers with `jest.useFakeTimers()` for wait-based rituals.
- Use fixtures from `tests/fixtures/` — do not inline large test data.

## What to Avoid
- Do NOT add npm packages beyond: express, jest, supertest, uuid, validator, nodemon.
- Do NOT create a database or persistent file storage.
- Do NOT use `async/await` where synchronous code suffices (in-memory store is sync).
- Do NOT add JSDoc comments to every function — only add comments where logic is non-obvious.
- Do NOT refactor or "improve" code that is not part of the current task.
- Do NOT use `var`. Always use `const`; use `let` only when reassignment is necessary.
- Do NOT use `==` or `!=`. Always use strict equality (`===`, `!==`).

## Git Commits
- Format: `type: short description` (e.g., `feat: add possession engine`, `test: add demon trigger tests`).
- Types: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`.
- One logical change per commit.

## Response Format
All API endpoints return:
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```
