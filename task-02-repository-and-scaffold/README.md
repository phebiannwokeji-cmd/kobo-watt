# Task 2 — Repository and scaffold

The initial Express scaffold is implemented. Later database, deliberate
failure/recovery, information-design, and interview work is not yet complete.

## Run locally

Prerequisites: Node.js meeting Express's >=18 requirement and npm.
The checked environment uses Node v24.19.0 and npm 11.17.0.
From the repository root in Windows PowerShell:

```powershell
cd task-02-repository-and-scaffold
npm.cmd ci
npm.cmd start
```

Open http://127.0.0.1:3000/. Stop the server with Ctrl+C in its terminal.
For automatic restart during development: `npm.cmd run dev`.
On other shells, use `npm` instead of `npm.cmd`.

If npm encounters the certificate error observed on this machine, Node 24
can use the system certificate store. For that terminal only:

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npm.cmd ci
```

Do not disable certificate verification. The system store must contain
the appropriate trusted certificate.

No build step or environment file is needed. Optional `PORT` selects a
port from 1–65535. The server binds only to 127.0.0.1. If a port is busy,
it reports the error without stopping another process.

## Routes and design-system use

The welcome page links to /demo/. Express serves only explicitly named
Task 1 prototype, stylesheet, script, and font files, directly from the
sibling Task 1 folder. No Task 1 files are copied or modified.
The /demo redirect preserves trailing-slash relative asset resolution.
Unknown paths return 404; the repository root is never exposed.

Task 1 provides colour roles, typography, and shadows.
[Layout tokens](public/assets/layout-tokens.css) are an approved Task 2
extension. The link uses rem padding and can wrap and grow.

## Evidence and scope

[Plan](evidence/01-agent-plan.txt) and
[approval chronology](evidence/01-agent-plan-approval.txt) are preserved.
The plan was presented before approval but saved afterward; the record
states this explicitly.
[File report](evidence/02-files-created.txt),
[startup](evidence/03-server-start.txt), and
[first load](evidence/04-first-load.txt) record this scaffold run.

This is a fictional service and demonstration account. No database,
authentication, payment integration, or hardware control is implemented.
Root-path hosting is assumed. No production deployment is configured.
The root repository README still requires a separate Task 2 status update.
