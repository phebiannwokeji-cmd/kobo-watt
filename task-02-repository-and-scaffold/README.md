# Task 2 — Repository and scaffold

This branch (`task-02/antigravity-scaffold-rebuild`) contains an independent rebuild of the initial Express scaffold, implemented with Gemini 3.8 Flash in Google Antigravity. The historical implementation created by Codex remains preserved in the recovery commit on `main`.

## Run locally

Prerequisites: Node.js (>=18) and npm.
The verified local environment uses Node v24.19.0 and npm 11.17.0.
From the repository root in Windows PowerShell:

```powershell
cd task-02-repository-and-scaffold
npm.cmd ci
npm.cmd start
```

Open http://127.0.0.1:3000/. Stop the server with Ctrl+C in its terminal.
For automatic restart during development: `npm.cmd run dev`.
On Unix shells, use `npm` instead of `npm.cmd`.

If npm encounters certificate issues in PowerShell on this machine:

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npm.cmd ci
```

Do not disable certificate verification.

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
