# Database state before migrations — Task 4

**Captured:** 2026-11-03T09:07:13Z (before any Task 4 migration, seed or server command)
**Target database:** `task-04-server-security/data/kobo-watt-04.db`
**Evidence:** [`../evidence/02-database-state-before.png`](../evidence/02-database-state-before.png)

## What was found

The Task 4 database does **not exist yet**.

| Check | Result |
| :--- | :--- |
| `data/kobo-watt-04.db` on disk | **No** |
| File size | — |
| SQLite connection | Not opened — `fileMustExist` would fail |
| Application tables | **0** |
| Migration ledger (`schema_migrations`, `_migrations`, etc.) | **Absent** |
| `user_version` | — |
| `journal_mode` | — |
| `foreign_keys` | — |
| `integrity_check` | — |
| Tables required by `docs/schema.md` | `accounts`, `sessions`, `payments`, `payment_attempts`, `knowledge_chunks` — **all missing** |

The five-table design currently exists only in [`docs/schema.md`](schema.md) and the hand-drawn design in [`evidence/01-schema-drawing.jpg`](../evidence/01-schema-drawing.jpg). There are no tables, rows, indexes, foreign keys or migration history to inspect. This is the empty-database state the task warns about, one step earlier than the class example: the design document exists, but the database has not been created.

## How it was verified

The inspection was done with the repository's own read-only inspector:

```powershell
cd task-04-server-security
node tools/inspect-db.mjs
```

The tool checks for the file with `fs.existsSync` before opening anything. If the file exists, it opens it with SQLite's read-only mode and `fileMustExist`, then queries `sqlite_master`, `PRAGMA table_info`, `PRAGMA index_list`, `PRAGMA foreign_key_list`, `PRAGMA user_version` and `PRAGMA integrity_check`. It never runs `CREATE`, `ALTER`, `INSERT` or a migration runner. When the file is absent it records the absence and exits without creating an empty database.

The exact output at capture time was:

```text
Kobo Watt — Task 4 database state
Target: C:\Users\LENOVO PC\Documents\kobo-watt\task-04-server-security\data\kobo-watt-04.db
File exists: NO
File size: —
Opened read-only: no
Tables: 0
Migration ledger: ABSENT
user_version: —
journal_mode: —
foreign_keys: —
integrity_check: —
Expected Task 4 tables:
  - accounts: MISSING
  - sessions: MISSING
  - payments: MISSING
  - payment_attempts: MISSING
  - knowledge_chunks: MISSING
```

The screenshot was regenerated from the same inspection with:

```powershell
node tools/capture-db-state.mjs
```

## Repository context — the Task 3 database is not the Task 4 database

The repository does contain one older SQLite file at `task-03-client-validation/data/kobo-watt-03.db`. It was also opened read-only so its state could not be confused with Task 4's:

| Check | Result |
| :--- | :--- |
| File size | 16,384 bytes |
| Tables | 1 — `accounts` |
| Rows in `accounts` | 1 |
| Columns in `accounts` | 8 |
| Migration ledger | Absent |
| `user_version` | 0 |
| `integrity_check` | ok |
| Task 4 tables missing | 4 of 5 (`sessions`, `payments`, `payment_attempts`, `knowledge_chunks`) |

That file belongs to the Task 3 application. It is not connected to Task 4 and is not evidence that the Task 4 schema exists. Its `accounts` table also has the Task 3 shape (`name`, `phone`, `email`, `address`, `password_hash`, `terms_accepted`, `created_at`), not the shape specified in `docs/schema.md`.

## Why this matters

Recording the absence prevents a false claim later that the schema was "already there" or that a migration was run when it was not. The next step is the initial Task 4 migration, which should create the database and the five designed tables. That migration has not been run yet, and the Task 4 server must not start against a missing database.
