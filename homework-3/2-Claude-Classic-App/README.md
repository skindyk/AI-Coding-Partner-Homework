# Homework 3: Specification-Driven Design

## Student & Task Summary

> **Student Name**: [Serhii Kindyk]
> **Date Submitted**: [02/07/2025]
> **AI Tools Used**: [Claude Code via VS Code IDE extention with Opus 4.6(while it's free :)]

This homework produces a **specification package** (no code) for a **Virtual Card Lifecycle Management** feature in a Node.js/Express.js banking application. The package includes a detailed product specification with 8 AI-actionable implementation tasks, AI agent guidelines, Claude Code editor rules, and this reflection document. The feature covers virtual card creation with tokenized card data, freeze/unfreeze operations, configurable spending limits, filtered transaction history, and immutable audit trails.

---

## Rationale

### Why the Banking-Specific Template

The specification follows the Banking-Specific Specification Template from `specification-TEMPLATE-example.md` rather than the Basic or API templates. Virtual card management operates in a **regulated financial domain** where compliance, security, and auditability are first-class requirements — not features to be added later. The Banking-Specific Template structures mid-level objectives around compliance, security, audit, performance, and integration, which ensures these concerns are addressed from the design phase rather than retrofitted during implementation.

### Why 8 Low-Level Tasks

Each task targets a **single responsibility**: data models, encryption/card generation, route handlers, input validation, security middleware, audit service, tests, and application configuration. This granularity serves two purposes:

1. **AI agent effectiveness** — Each task is independently executable without requiring context from other tasks, reducing prompt complexity and improving output quality.
2. **Separation of concerns** — The task boundaries map directly to the project's architectural layers (models → services → routes → middleware), making the specification both a build plan and an implicit architecture document.

### Why In-Memory Storage

Previous homeworks (homework-1 Banking Transactions API, homework-2 Support Ticket System) used in-memory arrays and Maps for data storage. This specification maintains that convention for **consistency across the course**. The model layer abstracts storage behind classes with CRUD methods, so a real database can be substituted later without changing the service or route layers.

### Why Decimal.js for Monetary Math

JavaScript's `Number` type uses IEEE 754 double-precision floating-point, which produces rounding errors for decimal arithmetic (e.g., `0.1 + 0.2 === 0.30000000000000004`). Financial applications require **exact decimal arithmetic** to avoid accumulating rounding errors across thousands of transactions. The `decimal.js` library provides arbitrary-precision decimal math, which is standard practice in FinTech systems. The specification mandates integer-cent representation as the storage format and Decimal.js for all computations.

### Why Hash-Chained Audit Logs

In regulated environments, audit logs must be **tamper-evident**. A simple append-only log can still be altered if an attacker gains write access to the storage. By including a SHA-256 hash of the previous entry in each new entry, any insertion, deletion, or modification of historical records breaks the chain and becomes detectable. This pattern mirrors blockchain-like integrity verification used in financial and healthcare systems. The specification includes a `verifyChain()` function that validates the entire chain on demand.

### Why CVV Is Returned Exactly Once

PCI DSS Requirement 3.4 mandates that sensitive authentication data (including CVV/CVC) must not be stored after authorization. The specification returns the CVV to the user only at card creation time and stores only a bcrypt hash. This minimizes the **window of exposure** — the CVV exists in plaintext only in the creation response, never in storage, logs, or subsequent API responses.

### Why Claude Code Rules (`.claude/`)

The `.claude/rules.md` format was chosen because this course uses Claude Code as the primary AI coding partner. The rules file provides **project-specific guardrails** that steer Claude's behavior: naming conventions to follow, architectural patterns to enforce, and explicit prohibitions (no plaintext card data, no floating-point money, no console.log) that prevent common mistakes in the banking domain. This is more effective than relying on general-purpose AI knowledge of FinTech conventions.

---

## Industry Best Practices

The table below maps each industry best practice embedded in the specification to its **exact location** across the deliverables.

| Industry Best Practice | Where It Appears | Document & Section |
|---|---|---|
| **PCI DSS Req 3 — Protect Stored Cardholder Data** | PAN tokenization via AES-256-GCM, CVV stored as bcrypt hash only, masked PAN in all API responses | `specification.md` — Mid-Level Objective 2, Task 2 (Encryption Service), Task 1 (Card Model) |
| **PCI DSS Req 6 — Develop Secure Systems** | Input validation with joi, XSS sanitization, SQL injection prevention via parameterized operations | `specification.md` — Implementation Notes (Input Validation), Task 4 (Validators) |
| **PCI DSS Req 10 — Track and Monitor Access** | Immutable hash-chained audit log for every state-changing operation | `specification.md` — Mid-Level Objective 3, Task 6 (Audit Service), Task 1 (AuditLog Model) |
| **GDPR Article 17 — Right to Erasure** | Anonymization endpoint `DELETE /cards/:id/personal-data` that removes PII while retaining audit records | `specification.md` — Mid-Level Objective 1 (Compliance), Implementation Notes (Data Privacy) |
| **GDPR Article 20 — Right to Data Portability** | Data export endpoint `GET /cards/:id/data-export` returning all cardholder data in portable JSON | `specification.md` — Mid-Level Objective 1 (Compliance) |
| **CCPA — Consumer Data Access** | Same data-export endpoint supports CCPA data-access requests | `specification.md` — Mid-Level Objective 1 (Compliance) |
| **Luhn Algorithm for Card Validation** | PAN generation uses Luhn check digit; `validateLuhn()` exported as utility | `specification.md` — Task 2 (Card Number Generator); `agents.md` — Section 2 (Domain Rules) |
| **AES-256-GCM Encryption** | PAN tokenization uses AES-256-GCM with random IV per encryption, key from env variable | `specification.md` — Task 2 (Encryption Service); `.claude/rules.md` — Domain Guidance |
| **Bcrypt for One-Way Hashing** | CVV hashed with bcrypt (salt rounds 12), verified via constant-time comparison | `specification.md` — Task 2 (Encryption Service); `agents.md` — Section 2 (CVV) |
| **Immutable Audit Logs with Hash Chaining** | SHA-256 hash chain with genesis hash; append-only model with no update/delete | `specification.md` — Task 6 (Audit Service), Task 1 (AuditLog Model); `agents.md` — Section 2 (Audit Logs) |
| **Idempotency Keys for Safe Retries** | All mutation endpoints require UUID v4 `Idempotency-Key` header; duplicate keys return cached response | `specification.md` — Task 5 (Idempotency Middleware), Task 3 (Route constraints); `.claude/rules.md` — Patterns |
| **Rate Limiting** | Sliding window algorithm, 100 req/min per user, `429` with `Retry-After` header | `specification.md` — Task 5 (Rate Limiter Middleware); `agents.md` — Section 5 (Rate Limiting) |
| **Structured JSON Logging** | `pino` logger with `timestamp`, `level`, `requestId`, `message`, `context` fields; sensitive data redacted | `specification.md` — Implementation Notes (Error Handling), Task 8; `agents.md` — Section 3 (Logging) |
| **Exact Decimal Arithmetic** | `decimal.js` for all monetary calculations; amounts stored as integer cents or Decimal strings | `specification.md` — Implementation Notes (Monetary Calculations); `agents.md` — Section 2 (Monetary Values) |
| **JWT-Based Authentication** | Bearer token verification on all endpoints (except health), `userId`/`role` claims, configurable expiry | `specification.md` — Mid-Level Objective 2, Task 5 (Authentication Middleware); `agents.md` — Section 5 |
| **API Versioning** | All routes under `/api/v1/` prefix for backward-compatible evolution | `specification.md` — Task 8 (Entry Point); `.claude/rules.md` — Patterns (Architecture) |
| **OpenAPI 3.0 Documentation** | Auto-generated API documentation in `docs/openapi.yaml` | `specification.md` — Mid-Level Objective 5 (Integration), Task 8 |
| **Card Status State Machine** | Defined valid transitions (active ↔ frozen, active/frozen → cancelled); invalid transitions rejected with 409 | `agents.md` — Section 2 (State Machine); `.claude/rules.md` — Domain Guidance |
| **Separation of Concerns (Controller-Service-Model)** | Routes handle HTTP, services contain business logic, models manage data; no layer-skipping | `.claude/rules.md` — Patterns (Architecture); `specification.md` — Task 3 (Routes must call services) |
| **>85% Test Coverage** | Jest configured with 85% threshold across lines, branches, functions, statements | `specification.md` — Task 7 (Test Suite); `agents.md` — Section 4 (Coverage) |
| **Data Masking in Responses** | PAN displayed as `**** **** **** 1234`; CVV never returned after creation | `specification.md` — Mid-Level Objective 2; `.claude/rules.md` — Domain Guidance (Card Numbers) |
| **Environment-Based Configuration** | All secrets and config loaded from env variables via `dotenv`; `.env.example` documents all required vars | `specification.md` — Task 8 (Configuration); `agents.md` — Section 1 (Tech Stack) |
| **Webhook Event Emission** | State changes emit events (`card.created`, `card.frozen`, etc.) via EventEmitter for external integration | `specification.md` — Mid-Level Objective 5, Task 6 (Audit Service EventEmitter) |
