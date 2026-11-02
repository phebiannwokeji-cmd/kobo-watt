# Task 2 — Repository and scaffold

This branch (`task-02/antigravity-scaffold-rebuild`) contains an independent rebuild of the initial Express scaffold, implemented with Gemini 3.8 Flash in Google Antigravity. The historical implementation created by Codex remains preserved in the recovery commit on `main`.

## Run locally

Prerequisites: Node.js (>=22) and npm.
The verified local environment uses Node v24.19.0 and npm 11.17.0.
From the repository root in Windows PowerShell:

```powershell
cd task-02-repository-and-scaffold
npm.cmd ci --ignore-scripts
npm.cmd run db:init
npm.cmd start
```

Open http://127.0.0.1:3000/. Stop the server with Ctrl+C in its terminal.
For automatic restart during development: `npm.cmd run dev`.
On Unix shells, use `npm` instead of `npm.cmd`.

- **Foreground process:** `npm start` runs in the foreground; keep the terminal window open.
- **Stopping:** Stop the server with Ctrl+C. (Type `Y` if PowerShell asks `Terminate batch job (Y/N)?`).
- **Independent verification:** The setup instructions were independently tested by a fresh user; friction points and resolutions are documented in [docs/readme-test.md](docs/readme-test.md).

**Why `--ignore-scripts` is shown for this machine.** A plain `npm.cmd ci`
attempted a `node-gyp rebuild` for better-sqlite3 and failed because this
machine has no Windows SDK. better-sqlite3 13.0.3 ships a published
`prebuilds/win32-x64.node`, so `npm.cmd ci --ignore-scripts` installs that
prebuilt module without running lifecycle scripts. Verify the native module
loads before relying on it. The plain-install failure and the successful
install are both recorded in `evidence/`.

If npm encounters certificate issues in PowerShell on this machine:

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npm.cmd ci --ignore-scripts
```

`NODE_USE_SYSTEM_CA` uses the system certificate store. Do not disable
certificate verification.

Optional `PORT` selects an alternate port (1–65535) if port 3000 is occupied. The server binds exclusively to `127.0.0.1`. If the requested port is busy, the server logs an `EADDRINUSE` error and exits without terminating any running process.

## Routes and design-system integration

The home page links directly to `/demo/`. Express serves only an explicit whitelist of Task 1 files directly from `../task-01-design-system` without copying or modifying them:
- `/demo` redirects (302) to `/demo/` to preserve relative links.
- `/demo/`, `/demo/index.html`, `/demo/help.html`, `/demo/help-no-power.html`, `/demo/screen.css`, and `/demo/demo.js`.
- Design tokens and typography stylesheets under `/styles/`.
- Font files under `/fonts/`.
- All other routes return an HTTP 404 response. The repository root, documentation, evidence, and configuration files are never exposed.

Task 1 provides colour roles, typography classes, and shadow tokens. [Layout tokens](public/assets/layout-tokens.css) define rem-based container and button dimensions. The demo button uses rem padding and is allowed to wrap without text clipping.

## Evidence records

- **Rebuild Records (Antigravity / Gemini):**
  - [Antigravity Rebuild Plan](evidence/01b-gemini-plan.txt)
  - [Antigravity Plan Approval Record](evidence/01b-gemini-plan-approval.txt)
  - [Created Files and Self-Audit](evidence/02b-files-created.txt)
  - [Server Startup Log](evidence/03b-server-start.txt)
  - [First Load Evidence](evidence/04b-first-load.txt)
  - [Scaffold Verification](evidence/scaffold-verification-antigravity.txt)

- **Preserved Historical Records (Codex on `main`):**
  - [Historical Plan](evidence/01-agent-plan.txt)
  - [Historical Plan Approval](evidence/01-agent-plan-approval.txt)
  - [Historical File Report](evidence/02-files-created.txt)
  - [Historical Server Startup](evidence/03-server-start.txt)
  - [Historical First Load](evidence/04-first-load.txt)
  - [Historical Verification](evidence/scaffold-verification.txt)

- **Preserved earlier enquiry evidence (not overwritten):**
  - [Success logs](evidence/11-write-succeeded-logs.txt)
  - [Database row screenshot](evidence/12-database-rows.png)
  - [Failure logs](evidence/13-write-failed-logs.txt)
  - [Database rows JSON](evidence/database-rows.json)
  - [HTTP checks](evidence/enquiry-http-checks.txt)

- **Later browser-driven enquiry verification (this run):**
  - [Existing server check before stopping](evidence/14-existing-server-check.txt)
  - [Dependency registry verification](evidence/15-dependency-verification.txt)
  - [Plain `npm ci` failure](evidence/16-dependency-install.txt)
  - [Successful install with prebuilt binary](evidence/16b-dependency-install-success.txt)
  - [Failed smoke-test attempt (diagnostic)](evidence/17a-database-smoke-test-attempt-failed.txt)
  - [Successful separate database smoke test](evidence/17b-database-smoke-test-success.txt)
  - [Success logs](evidence/18-browser-write-succeeded-logs.txt)
  - [Read-only failure logs](evidence/19-browser-write-failed-logs.txt)
  - [Database row screenshot](evidence/20-browser-database-rows.png)
  - [Checks](evidence/21-browser-checks.txt)
  - [Database rows JSON](evidence/22-browser-database-rows.json)
  - [Database rows HTML](evidence/23-browser-database-rows.html)
  - [Rows after restoration](evidence/24-browser-database-rows-after-restoration.png)
  - [Rows after restoration JSON](evidence/25-browser-database-rows-after-restoration.json)
  - [Rows after restoration HTML](evidence/26-browser-database-rows-after-restoration.html)
  - [Read-only inspection script check](evidence/27-inspection-script.txt)

- **Working Tree, Branching and Pull Request (Steps 8–9):**
  - [Hand-drawn Working Tree Diagram](evidence/14-working-tree-drawing.jpg)
  - [Working Tree Architecture Document](docs/working-tree.md)
  - [Git Log Graph and Branch Proof](evidence/15-git-log-graph.txt)
  - [Pull Request #1 (Merged into main)](https://github.com/phebiannwokeji-cmd/kobo-watt/pull/1)

- **Information Design and Responsive Typography (Step 10):**
  - [Information Design Rationale Document](docs/information-design.md)
  - [Known Defects Document](docs/defects.md)
  - [Technical Interview Defence Answers](docs/interview-answers.md)
  - [Head Route 1: Marketing /](evidence/16-head-route-one.png)
  - [Head Route 2: Account Summary /demo/](evidence/17-head-route-two.png)
  - [Heading Wrap Bad (Clipping)](evidence/18-heading-wrap-bad.png)
  - [Heading Wrap Good (Intentional Wrap)](evidence/19-heading-wrap-good.png)
  - [Responsive Typography at 320px, 390px, 768px](evidence/20-responsive-three-widths.png)

## Fictional enquiry feature (Codex, later Task 2 feature)

The home page includes a fictional enquiry form; it does not arrange a callback,
create an account or take payment. POST /api/enquiries returns 201 only after
SQLite saves the row. Invalid input returns 400; a database write failure returns
500 with a generic message. A lost response may leave the save outcome unknown;
this demo has no idempotency key, so check stored rows before retrying.

Run `npm.cmd run db:init` explicitly before starting. Startup does not create or
migrate the database. Inspect saved rows locally with `npm.cmd run db:inspect`.
The runtime database and sidecars are ignored, not public routes and not committed.
Use fictional data only. This unauthenticated local demo is not production-ready.

Environment variables:
- `PORT`: loopback server port, default 3000.
- `DATABASE_PATH`: database filename, relative to Task 2 or absolute; default
  `data/enquiries.db`. Custom runtime SQLite files must remain outside public routes
  and must not be committed.
- `DB_READONLY`: set exactly `1` to reject writes while keeping the form available.
  Initialise first, stop only your owned application process, set this value, and
  restart. Remove it and restart to restore writable operation.
- `NODE_USE_SYSTEM_CA`: optional Node system certificate trust setting as above;
  never disable certificate verification.

The `sqlite3` CLI is not installed on the verified machine. `tools/inspect-db.js`
is the read-only Node fallback; it never opens a write handle.

`npm.cmd run test:enquiries` is the earlier opt-in browser recorder. It requires
Chrome (or `CHROME_PATH`), an empty database and absent output files, waits 125
seconds between submissions, and refuses to replace existing evidence. It was not
the successful browser run: headless launches failed in that earlier session, so
the preserved `11`–`13` records come from HTTP submissions.

`npm.cmd run test:enquiry-browser` is the later browser-driven verifier used for
the successful `18`–`26` records. It initialises a fresh database, submits the real
form twice about three minutes apart, performs the `DB_READONLY=1` failure exercise,
restores writable operation, and stops only the servers it started. It also refuses
to overwrite existing evidence. The exact observed results are in
[false success](docs/false-success.md); tool attribution is in
[tool and model choices](docs/model-choices.md). The approved plan and the later
handoff are recorded in [approved plan and handoff](docs/enquiry-approved-plan-and-handoff.md).
