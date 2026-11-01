# Tool and model choices

Recorded at (UTC): 2026-11-01T13:42:00Z

This document records only names and choices that can be checked in the repository or the current environment. It does not present a benchmark or claim that one model or tool is generally better.

## Work attribution

| Work | Tool / author | Model name | Evidence |
|---|---|---|---|
| Task 2 minimal Express scaffold | Google Antigravity | Gemini 3.8 Flash | [01b-gemini-plan.txt](../evidence/01b-gemini-plan.txt), [01b-gemini-plan-approval.txt](../evidence/01b-gemini-plan-approval.txt), [02b-files-created.txt](../evidence/02b-files-created.txt) |
| Later fictional enquiry database feature | Codex | Not recorded in the repository; no model version is claimed | The handoff identifies Codex as the later implementer. The preserved commit history includes earlier Codex Task 2 work, but the available evidence does not name a Codex model version. |

The Antigravity model name is treated as verified because the saved Antigravity plan, approval record and file report all identify Gemini 3.8 Flash. This document does not infer a model name from the visual style of the code.

The later feature was completed and verified in the current run, building on the preserved uncommitted implementation. The handoff attributes that implementation work to Codex. No Codex model version is invented here. In particular, the repository does not contain a controlled comparison between Antigravity, Codex or any other model, so no comparison result is claimed.

## Technical choices

- **Express 5.3.0** was already the pinned scaffold dependency. The enquiry endpoint uses the same server and the existing explicit route whitelist.
- **better-sqlite3 13.0.3** is pinned in `package.json` and `package-lock.json`. Its registry metadata declares `engines.node >=22`; the verified local runtime is Node v24.19.0.
- **SQLite** was chosen for a small local demonstration with one table and no external service. The database file lives under the ignored `data/` directory, outside the public route whitelist.
- **Plain browser JavaScript** is used for the form. The new `/assets/enquiry.js` file is explicitly added to the existing route map rather than exposing the `public/` directory.
- **Server-side validation and a parameterised INSERT** keep invalid input out of the database and avoid building SQL from request text.
- **Database-side ID and UTC timestamp generation** avoids trusting the browser for identity or time.
- **Separate schema initialisation** means `npm run db:init` creates the table; server startup only opens the existing database. A missing database therefore fails clearly instead of being created silently during a request.

## Dependency installation note

The first plain `npm.cmd ci` attempt failed because npm invoked `node-gyp rebuild` for better-sqlite3 and this machine does not have the Windows SDK. The package ships `prebuilds/win32-x64.node`. The verified installation command was:

```powershell
npm.cmd ci --ignore-scripts
```

This installs the published prebuilt native module without running lifecycle scripts. Certificate verification was not disabled; `NODE_USE_SYSTEM_CA=1` was used only to read the system certificate store. The install check and the separate database write smoke test are recorded in [16-dependency-install.txt](../evidence/16-dependency-install.txt), [16b-dependency-install-success.txt](../evidence/16b-dependency-install-success.txt) and [17b-database-smoke-test-success.txt](../evidence/17b-database-smoke-test-success.txt).

## Verification environment

- Node.js v24.19.0
- npm 11.17.0
- Chrome 156.0.8078.74 (headless, controlled through the Chrome DevTools Protocol)
- better-sqlite3 13.0.3
- Windows, local loopback only

These are environment facts, not a comparison between tools.
