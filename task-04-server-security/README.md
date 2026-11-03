# Task 4 — Server security

Status: **in progress.** Step 1 (schema design) and Step 2 (discover the real database state) are complete. No Task 4 database has been migrated yet.

## Completed so far

### Step 1 — Design the schema before writing it

- [`docs/schema.md`](docs/schema.md) documents five tables (`accounts`, `sessions`, `payments`, `payment_attempts`, `knowledge_chunks`), every column and nullability, the one-to-many relationships, every index with its write cost, the accepted denormalisation, and the two written reasons for keeping a separate money-attempts table.
- [`evidence/01-schema-drawing.jpg`](evidence/01-schema-drawing.jpg) is the hand-drawn schema captured before the code.

### Step 2 — Discover what state the database is actually in

- **Finding:** the Task 4 database does **not exist yet**. There are no tables, rows, indexes, foreign keys, migration ledger or `user_version` to inspect. The five-table schema exists only in `docs/schema.md` and the hand-drawn design.
- **Evidence:** [`evidence/02-database-state-before.png`](evidence/02-database-state-before.png).
- **Written record and method:** [`docs/database-state.md`](docs/database-state.md).
- **Inspector (read-only, never creates a database):** [`tools/inspect-db.mjs`](tools/inspect-db.mjs). Reproduce with `node tools/inspect-db.mjs`.
- **Screenshot generator:** [`tools/capture-db-state.mjs`](tools/capture-db-state.mjs). Reproduce with `node tools/capture-db-state.mjs`.
- The inspector also opened the older Task 3 database read-only for context. It has one `accounts` table, one row, no migration ledger and four of the five Task 4 tables missing. It is not the Task 4 database.

## Still to do

Steps 3–12 of the task, including the deliberate migration failure, hashing timing comparison, server-side validation, rate limiting, breach checks, email verification and documentation. The initial migration has **not** been run.

The task requires migrations to be run deliberately by hand, not by the agent. The next step is therefore a proposed migration for review, not an automatic `db:migrate`.
