# Task 3 — The Form, Attacked from Both Sides

Kobo Watt solar services — client-side validation, SPA auth page, accessibility audit.

## Requirements

- Node.js v22 or later
- npm

## Setup

```powershell
cd task-03-client-validation
npm install --ignore-scripts
node tools/init-db.js
npm start
```

Server listens at `http://127.0.0.1:3001`. Open that URL in your browser.

## Auth page

`http://127.0.0.1:3001/auth?form=signup`  
`http://127.0.0.1:3001/auth?form=login`  
`http://127.0.0.1:3001/auth?form=reset`

All three states are served from the same file (`public/auth.html`).
Switching is handled by `public/assets/auth.js` — no page reload occurs.

## Stop the server

Press `Ctrl+C` in the terminal. When PowerShell asks `Terminate batch job (Y/N)?`, type `Y`.

## Task deliverables

See `docs/` for rationale documents and `evidence/` for screenshots and logs.
