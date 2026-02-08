# Homework 3: Specification-Driven Design — The Financial Exorcist

## Student & Task Summary

> **Student Name**: [Serhii Kindyk]
> **Date Submitted**: [02/08/2025]
> **AI Tools Used**: [Gemini for app idea and brief spec generation. Claude Code via VS Code IDE extention with Opus 4.6(while it's free :) for detailed spec set implementation. Claude Code CLI agent teams for implementation]

**Application:** "The Financial Exorcist" — a gamified personal-finance tracker that frames spending habits as demonic possession. Users log transactions categorised as "Sins." When a transaction matches a demon's trigger rule, the UI locks into a gothic "Possessed Mode" and the user must complete a digital ritual (typing challenges, math puzzles, wait timers) to regain control. Under the horror-comedy surface, the application enforces real FinTech practices: audit logging, input sanitisation, monetary precision, GDPR-style data rights, and security headers.

**Tech Stack:** Node.js, Express.js v5, Jest v30, Supertest, vanilla HTML/CSS/JS — consistent with Homework 1 and Homework 2.

---

## Deliverables

| File | Purpose |
|------|---------|
| [`specification.md`](specification.md) | Full product spec: objectives, implementation notes, context, and 16 low-level tasks |
| [`agents.md`](agents.md) | AI agent behaviour rules: tech stack constraints, domain rules, testing expectations |
| [`.claude/rules.md`](.claude/rules.md) | Claude Code editor rules: naming, patterns, security, what to avoid |
| [`README.md`](README.md) | This file — rationale and industry best-practices mapping |

---

## Rationale

### Why This Structure

The specification follows the **Banking-Specific Specification Template** provided in `specification-TEMPLATE-example.md`. This template was chosen over the generic template because the homework requires reflecting FinTech/banking best practices, and the banking template explicitly includes sections for compliance, security, audit, and data handling.

The spec is organized in a **top-down decomposition**:

1. **High-Level Objective** — one sentence capturing the entire product vision.
2. **Mid-Level Objectives** — eight testable outcomes that collectively fulfil the high-level goal.
3. **Implementation Notes** — constraints and standards that every task must respect.
4. **Context** — a before/after snapshot so an AI agent knows exactly what files exist at the start and what files should exist at the end.
5. **Low-Level Tasks** — sixteen step-by-step prompts, each specifying the exact file, function, and acceptance criteria for an AI to implement.

This hierarchy serves the learning objective of structuring *"high-level goals, mid-level objectives, and low-level tasks for AI-driven implementation."* An AI agent can read the spec top-to-bottom and execute tasks sequentially without ambiguity.

### Why Three Separate Documents

- **`specification.md`** is the *what* — product requirements and implementation tasks.
- **`agents.md`** is the *how* — behavioural guardrails for an AI coding partner (tech stack lock-in, code style, domain rules, testing standards).
- **`.claude/rules.md`** is the *quick-reference* — a concise set of rules that an editor-integrated AI (Claude Code, Copilot, Cursor) can load on every interaction without reading the full spec.

This separation mirrors real-world practice where product specs, engineering standards, and IDE configurations are maintained independently by different stakeholders.

### Why the Same Tech Stack

The homework states to use the same tech stack as previous assignments. Homeworks 1 and 2 used Node.js + Express.js + Jest. Reusing this stack means:
- The AI agent can reference existing patterns from previous homework code.
- The specification demonstrates that good architecture is achievable without trendy frameworks.
- The deliverable is directly comparable to previous work for grading consistency.

The original IDEA.md suggested TypeScript + React + Vite. The spec adapts the concept to the required stack: vanilla frontend served from `public/`, Express API routes, in-memory data stores, and Jest tests — all patterns already established in HW-1 and HW-2.

---

## Industry Best Practices

The table below maps each practice to its location in the specification package.

| # | Best Practice | Where It Appears | Details |
|---|---------------|------------------|---------|
| 1 | **Integer arithmetic for money** | `specification.md` → Implementation Notes → Coding Standards; `agents.md` § 4 Monetary Values; `.claude/rules.md` → Monetary Values | Storing currency as cents (integers) eliminates floating-point rounding errors. This is standard at Stripe, Square, and every payment processor. `$12.99` → `1299`. |
| 2 | **Append-only audit trail** | `specification.md` → Mid-Level Objective #5, Implementation Notes → Compliance & Audit, Task #8; `agents.md` § 4 Audit Trail | Every state mutation writes an immutable event with before/after snapshots. This mirrors SOX-compliant audit logging in banking systems and enables forensic investigation without data loss. |
| 3 | **Input sanitisation** | `specification.md` → Implementation Notes → Security, Task #9; `agents.md` § 4 Input Validation; `.claude/rules.md` → Security | All user-supplied strings pass through `validator.escape()` before storage. Protects against XSS and injection — a fundamental OWASP Top 10 control. |
| 4 | **Security headers (CSP, X-Frame-Options)** | `specification.md` → Implementation Notes → Security, Task #9; `agents.md` § 4 Security Headers; `.claude/rules.md` → Security | Content-Security-Policy prevents inline script injection; X-Frame-Options blocks clickjacking; X-Content-Type-Options prevents MIME sniffing. These are baseline requirements for any web application handling financial data. |
| 5 | **Data portability (GDPR Art. 20)** | `specification.md` → Implementation Notes → Compliance, Task #11; `agents.md` § 4 Data Privacy | A `/export` endpoint lets users download all their data as JSON. Required under GDPR for EU citizens and increasingly expected as a trust signal globally. |
| 6 | **Right to erasure (GDPR Art. 17)** | `specification.md` → Implementation Notes → Compliance, Task #11; `agents.md` § 4 Data Privacy | A `/purge` endpoint irreversibly deletes all user data, with a confirmation safeguard header. The purge itself is recorded as a final audit event (logging the act of deletion, not the deleted data). |
| 7 | **Rate limiting** | `specification.md` → Implementation Notes → Security, Task #9; `agents.md` § 4 Security Headers; `.claude/rules.md` → Security | Mutating endpoints are rate-limited to 30 req/min. Prevents brute-force abuse and aligns with OWASP API Security guidelines. |
| 8 | **Amount masking in logs** | `specification.md` → Task #8; `agents.md` § 4 Audit Trail | Monetary values in audit events are masked (`$**.**`) by default. Unmasking requires an ops-role header. This follows the principle of least privilege for sensitive financial data in logs — a practice mandated in PCI-DSS environments. |
| 9 | **Immutable transaction fields** | `specification.md` → Task #10; `agents.md` § 6 rule 9 | Once created, an offering's `amount` and `timestamp` cannot be changed. Only `description`, `category`, and `isExorcised` are mutable. This preserves the integrity of the financial record — a core requirement in double-entry bookkeeping and regulatory reporting. |
| 10 | **Structured error responses** | `specification.md` → Implementation Notes → Coding Standards; `agents.md` § 3 Error Handling; `.claude/rules.md` → Response Format | All errors return `{ success: false, error: { code, message } }`. No stack traces leak to the client. This pattern enables consistent error handling on the frontend and prevents information disclosure (OWASP A01:2021). |
| 11 | **App/server separation** | `specification.md` → Task #9; `agents.md` § 3 Patterns; `.claude/rules.md` → Express Patterns | `app.js` exports the Express app without calling `.listen()`. `server.js` starts the server. This allows Supertest to test the app without binding a port — a well-established pattern from the Express testing documentation. |
| 12 | **85% test coverage threshold** | `specification.md` → Mid-Level Objective #8, Implementation Notes; `agents.md` § 5 Coverage; `.claude/rules.md` → Testing | Enforced via `jest.config.js`. The 85% threshold (matching HW-2) balances thoroughness with pragmatism — covering critical paths without demanding 100% coverage of presentation code. |
| 13 | **Deterministic testing** | `agents.md` § 5 Test Principles; `.claude/rules.md` → Testing | No random data in tests; fixed timestamps in fixtures; `jest.useFakeTimers()` for time-dependent logic. Flaky tests are a top engineering-productivity killer — determinism is non-negotiable. |
| 14 | **Dependency injection** | `agents.md` § 3 Patterns | Services receive dependencies via constructor/factory parameters. No hidden global state. This enables isolated unit testing and is a cornerstone of testable architecture in any language. |
| 15 | **Frozen objects for immutability** | `agents.md` § 3 Patterns; `.claude/rules.md` → Data Models | Data model factories return `Object.freeze(obj)`. Prevents accidental mutation of records after creation — an inexpensive safety net that catches bugs at the point of occurrence rather than downstream. |

---

## Summary

This specification package demonstrates that a playful product concept ("demonic possession as budgeting feedback") can coexist with rigorous engineering standards. The gothic theme is confined to the UI layer and string constants; underneath, the architecture follows the same patterns used in real-world FinTech systems: immutable audit trails, integer currency, sanitised inputs, security headers, GDPR compliance, and high test coverage. The three documents together give an AI coding agent everything it needs to implement the application without ambiguity — and without compromising on quality.
