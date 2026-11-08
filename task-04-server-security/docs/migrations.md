# Migrations — Task 4

## Applied migration history

The initial migration created the five application tables and Prisma's `_prisma_migrations` ledger:

- `20261103170003_init`
- `20261103172059_add_account_status_optional`
- `20261103173255_make_account_status_required`

The intentional required-column attempt did not create or apply a migration. Prisma stopped during preflight because `accounts` already contained one row and the new `account_status` value had no default. The error is captured in `evidence/04-required-column-failure.txt`.

The recovery followed three stages, all now complete:

1. Add `account_status` as optional so existing records can remain null temporarily.
2. Backfill it from the account's verification state: verified accounts become `ACTIVE`; unverified accounts become `PENDING_VERIFICATION`.
3. Make the field required. Prisma rebuilt the SQLite table and copied its data; the demo account remains present with `PENDING_VERIFICATION` and the column is `NOT NULL`.

Evidence for the optional migration, backfill check and required migration is in `evidence/05-required-column-three-steps.txt`. The first backfill run changed the row, but its output was not captured because a malformed `Tee-Object` command failed. A repeat run confirmed the final value and reported zero additional rows changed; this evidence note is explicit about that limitation.

## Why migrations are forward-only

An applied migration is part of the shared record of how the database reached its current structure. Later changes should be new migrations that move the schema forward. A rollback is also a new migration that deliberately restores an earlier shape while preserving the history of what happened.

Editing an applied migration would make the checked-in instructions disagree with databases that already ran the previous version. New installations might then build a different database from existing installations. The initial and successful Task 4 migrations are therefore left unchanged.

## Why the learner runs them manually

Each migration changes a real database file. Running it manually gives the learner a chance to inspect the proposed change, use the intended Task 4 database, capture the machine-specific output and check the result before continuing. `AGENTS.md` prohibits the agent from running migrations.

The cost is extra time and a greater chance of forgetting a required migration or running commands in the wrong order. Manual control is useful for this learning exercise, but a team workflow would need review gates and deployment automation so every environment receives the same reviewed migrations.

## Drift exercise

The drift was introduced by adding optional `last_login_at` to the Prisma schema and regenerating Prisma Client without migrating the database. The read-only query in `tools/probe-schema-drift.mjs` failed with Prisma error `P2022`: the client requested `main.accounts.last_login_at`, but SQLite did not contain that column. Evidence: `evidence/06-drift-error.txt`.

The two states out of step were the Prisma schema/generated client, which expected `last_login_at`, and the SQLite database, whose structure still matched only the earlier applied migrations. Client generation changes generated code; it does not change the database. The repair migration `20261103174000_add_last_login_at` added the optional sign-in timestamp without losing the demo account. The read-only database check confirms the new column exists, and the rerun of the probe succeeds with `lastLoginAt: null`. Evidence: `evidence/06b-drift-fixed.txt`.
