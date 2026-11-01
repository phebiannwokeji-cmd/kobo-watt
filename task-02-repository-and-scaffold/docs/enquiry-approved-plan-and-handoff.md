# Approved enquiry feature plan and handoff

Recorded before implementation at UTC: 2026-11-01T12:10:35.086394+00:00

The user authorised Codex to implement this plan in the current chat. This file is a faithful scope summary of that handoff, not a claim that it was saved before the user's approval.

Antigravity built the scaffold. Codex now implements a later fictional enquiry feature. Preserve Task 1, existing uncommitted work, historical evidence and Git history. No commit, merge or push.

Use pinned better-sqlite3 13.0.3, verify registry engines and local runtime, then separately test installation and database writes. Keep certificate verification enabled. Add name, fictional phone and business-type fields using existing colour, typography and layout tokens. Validate on the server, insert using parameters, generate IDs and UTC timestamps on the server/database, and show success only after INSERT and HTTP 201. Keep input on failure; generic browser errors, no request-body logging.

Initialise the schema separately. Ignore runtime SQLite databases and sidecars; never expose them through static routes. Add a read-only Node inspection tool. Capture two actual submissions minutes apart, query persisted rows and capture a screenshot. Run the existing database read-only, verify the page remains available, capture INSERT rejection and HTTP 500, prove the row count is unchanged, then restore writable operation and verify another save. Identify any process before restarting it; use separate owned test servers where possible.

Produce success/failure logs, database-row screenshot, false-success explanation and an honest tool/model comparison. Existing evidence must not be overwritten. No authentication or real payments. Report changed files, tests and limits.

Verified prerequisite lookup: Node v24.19.0, npm 11.17.0; npm view better-sqlite3@13.0.3 returned version 13.0.3 and engines node >=22. Installation and smoke test are separate pending steps.

## Implementation handoff recorded for this run

Recorded at (UTC): 2026-11-01T13:39:50Z

This section records the handoff received at the start of the implementation and evidence run that followed the approved plan above. It is a faithful summary, saved at the time shown; it is not backdated and does not claim to have been written before the handoff.

The handoff required:

- Implement the revised fictional enquiry database feature inside `task-02-repository-and-scaffold`, without authentication, real payments, merging, committing or pushing.
- Preserve Task 1, existing uncommitted work, existing evidence and Git history. Do not overwrite unrelated changes.
- Verify `better-sqlite3@13.0.3` and its Node.js requirements from reliable sources against the actual Node version before installing. Pin the dependency and update the lockfile. Keep TLS verification enabled.
- Treat dependency installation and a database smoke test as separate checks and report each result separately.
- Use existing design tokens and the approved Task 2 layout tokens. Add the fictional enquiry form and a clear demonstration notice.
- Add the SQLite schema, a parameterised INSERT, server-side validation, server/database-generated IDs and UTC timestamps, and initialise the schema separately from server startup.
- Explicitly allow the new browser script through the existing route whitelist.
- Keep submitted values after a failed save, show a clear generic error, and never show success unless the INSERT succeeds and the server responds with HTTP 201.
- Ensure invalid input creates no database row. Do not log full request bodies or expose database errors to users.
- Ignore runtime database and SQLite journal/WAL/SHM files in Git, keep database files outside public routes, and provide a read-only Node inspection script if the `sqlite3` CLI is unavailable.
- Capture actual successful submissions at least several minutes apart with real system-generated timestamps, inspect persisted IDs and timestamps directly, and produce success logs and a database-row screenshot.
- For the failure exercise, open the initialised database read-only with `DB_READONLY=1`, confirm the form still loads, submit valid fictional data, capture the actual write error and HTTP 500, and verify that no row was added. Then restore writable operation and verify a successful save.
- Never stop an existing server without first confirming that it belongs to this project and identifying the exact process. Prefer an available project server or a separate port.
- Write `docs/false-success.md` from observed results and `docs/model-choices.md` accurately. Record model names only when verified; do not invent model comparisons.

The implementation and evidence for this handoff are recorded in the Task 2 README, the `evidence/` files numbered 14 onward, `docs/false-success.md`, and `docs/model-choices.md`.
