# Task 4 — Server security

Status: **complete, pending final review.** Steps 1-12 have been implemented. Required documentation, the 19 interview answers, and the required evidence-name versions are present. The Task 4 changes remain uncommitted until the learner completes a final review.

## Step 5 — Normalization

The Task 4 API and shared normalization functions are in place. Historical registration/login proof is retained in `evidence/09-normalization.txt`. Current screenshots, captured after email verification was added, are `evidence/09-email-case-normalised.png` and `evidence/10-password-trim-working.png`; valid sign-in details reach the expected email-verification gate. The learner's explanation is in `docs/normalization.md`.

## Step 6 progress

Zod 4.6.7 schemas guard registration, login and reset in `src/validation.js`. The pre-validation signup took 538.989 ms; the post-validation signup took 468.270 ms. Both outputs and the measurement limits are documented in `docs/validation-placement.md` and `evidence/10-validation-timing-*.txt`.

## Step 7 — Server enforcement

Server-side constraints from the Task 3 forms are mapped in `docs/server-validation.md` and enforced by the Zod request schemas. The original direct request, accepted by Task 3 with HTTP 201, was refused by Task 4 with HTTP 400; see `evidence/11-task3-attack-vs-task4.txt`.

## Step 8 — Rate limiting

The 15-minute per-IP limits are 10 registrations, 20 logins, and 5 password resets. The implementation is in `server.js`; chosen limits, trade-offs, lockout results and the local interface-path IP bypass are documented in `docs/rate-limiting.md` and `evidence/12-rate-limit-trigger.txt` / `evidence/13-rate-limit-ip-change.txt`.

## Step 9 progress

Registration uses the HIBP range API before bcrypt or account creation. The expected HTTP 422 rejection is captured in `evidence/14-breached-password-rejected.txt`; the implementation, learner's explanation and privacy trade-off are documented in `docs/breach-check.md`.

## Step 10 progress

I selected and defended a seven-minute verification-code lifetime. I applied the `verification_codes` migration, generated the Prisma Client, registered a fictional test account, and completed the email-verification flow. Gmail accepted the verification email for delivery, I received it, I submitted the newest code once, and a read-only database check returned `isVerified: true` and `accountStatus: ACTIVE`. The redacted completion evidence is in `evidence/16-smtp-verification-complete.txt` and its paired screenshots.

SMTP settings are read from a local `.env` file using the names in [`.env.example`](.env.example). Keep actual credentials in `.env`; never copy them into evidence or commit them. The default mail mode is `background`; `inline` is reserved for the before-timing measurement.

## Completed so far

### Step 1 — Design the schema before writing it

- [`docs/schema.md`](docs/schema.md) documents the original five tables and the Step 10 `verification_codes` table, every column and nullability, the one-to-many relationships, every index with its write cost, the accepted denormalisation, and the two written reasons for keeping a separate money-attempts table.
- [`evidence/01-schema-drawing.jpg`](evidence/01-schema-drawing.jpg) is the hand-drawn schema captured before the code.

### Step 2 — Discover what state the database is actually in

- **Finding:** the Task 4 database does **not exist yet**. There are no tables, rows, indexes, foreign keys, migration ledger or `user_version` to inspect. The five-table schema exists only in `docs/schema.md` and the hand-drawn design.
- **Evidence:** [`evidence/02-database-state-before.png`](evidence/02-database-state-before.png).
- **Written record and method:** [`docs/database-state.md`](docs/database-state.md).
- **Inspector (read-only, never creates a database):** [`tools/inspect-db.mjs`](tools/inspect-db.mjs). Reproduce with `node tools/inspect-db.mjs`.
- **Screenshot generator:** [`tools/capture-db-state.mjs`](tools/capture-db-state.mjs). Reproduce with `node tools/capture-db-state.mjs`.
- The inspector also opened the older Task 3 database read-only for context. It has one `accounts` table, one row, no migration ledger and four of the five Task 4 tables missing. It is not the Task 4 database.

## Still to do

Steps 11–12 remain, including email design, deferred security controls, and final documentation.

The initial migration is recorded in [`evidence/03-initial-migration.txt`](evidence/03-initial-migration.txt). The populated-table fixture and its output are in [`tools/seed-migration-demo.mjs`](tools/seed-migration-demo.mjs) and [`evidence/03b-populated-table.txt`](evidence/03b-populated-table.txt). The task requires migrations to be run deliberately by hand, not by the agent. `AGENTS.md` records that boundary; the learner runs each migration and saves its full terminal output.

The migration decisions and the current drift-exercise status are recorded in [`docs/migrations.md`](docs/migrations.md).
