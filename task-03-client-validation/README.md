# Task 3 — The Form, Attacked from Both Sides

Kobo Watt solar inverter services (Ikeja, Lagos) — single-page form architecture, client-side validation, accessible error handling, and direct endpoint bypass demonstration.

---

## 1. Requirements

- **Node.js:** v22 or later (verified on Node v24.19.0)
- **Package manager:** npm
- **Database:** SQLite 3 (via `better-sqlite3`)
- **Loopback binding:** Binds exclusively to `127.0.0.1:3001`

---

## 2. Quick Setup & Verification

```powershell
cd task-03-client-validation
npm.cmd install --ignore-scripts
node tools/init-db.js
npm.cmd start
```

Open your browser to:
- Registration: `http://127.0.0.1:3001/auth?form=signup`
- Sign in: `http://127.0.0.1:3001/auth?form=login`
- Password reset: `http://127.0.0.1:3001/auth?form=reset`
- Input type comparison drill: `http://127.0.0.1:3001/drill-number-input`

All three authentication states are served dynamically from a single file (`public/auth.html`) managed by `public/assets/auth.js` without full page reloads or session recreation.

### Stop the Server
Press `Ctrl+C` in the running PowerShell terminal. When prompted `Terminate batch job (Y/N)?`, type `Y` and press `Enter`.

---

## 3. Deliverables Directory

### A. Documentation (`docs/`)
- [`docs/spa-rationale.md`](docs/spa-rationale.md) — Single-page architecture justification, before/after UX comparison, and when multi-page architecture is superior.
- [`docs/field-justification.md`](docs/field-justification.md) — Three justification tests for every field, decoration removal, and `<input type="number">` analysis.
- [`docs/terms-note.md`](docs/terms-note.md) — Origin and legal basis of terms and conditions wording (NDPC / ICO compliance template).
- [`docs/validation-rules.md`](docs/validation-rules.md) — Four validation categories, business derivations, and who each rule wrongly blocks.
- [`docs/enumeration.md`](docs/enumeration.md) — Account enumeration vectors, removal of sensitive format hints, and accepted trade-offs.
- [`docs/accessibility-audit.md`](docs/accessibility-audit.md) — Field-by-field audit against 5 criteria, 4 defects identified and fixed, and full Windows Narrator transcripts before and after.
- [`docs/password-and-button.md`](docs/password-and-button.md) — Password length rationale (NIST SP 800-63B), visibility toggle, and disabled vs hidden button analysis.
- [`docs/client-side-is-not-security.md`](docs/client-side-is-not-security.md) — Direct endpoint bypass analysis and lessons for Task 4.
- [`docs/rollback.md`](docs/rollback.md) — Precise Git rollback by commit hash without AI hallucination.
- [`docs/defects.md`](docs/defects.md) — Unvarnished accounting of known architectural, security, and schema limitations in Task 3.
- [`docs/interview-answers.md`](docs/interview-answers.md) — Comprehensive ~200-word responses for all 14 interview questions plus the user enumeration defense.

### B. Evidence Files (`evidence/`)
- `01-page-count-before.txt` — 3 separate HTML pages generated initially.
- `02-page-count-after.txt` — 1 collapsed SPA file (`auth.html`).
- `03-url-states.png` — High-resolution screenshot of URL parameter navigation states.
- `04-form-switch-logs.txt` — Server logs showing zero session recreation and no full page reload during tab switching.
- `05-empty-field-error.png` — Inline caution icon and text error upon focusing and blurring an empty field.
- `06-length-rule-blocking.png` — Length and space validation rule blocking single-token input.
- `07-email-realtime-signup.png` — Real-time inline format validation as user types on registration.
- `08-email-on-submit-login.png` — Submit-time validation behavior on login form.
- `09-number-input-annoying.png` / `09a`, `09b`, `09c` — Stepper arrows, default zero, `0400` artifact, and backspace friction.
- `10-text-input-working.png` — Clean numeric text input with `inputmode="numeric"`.
- `13-button-hidden-version.png` — Inactive submit button hidden completely.
- `14-button-disabled-version.png` — Inactive submit button visible and disabled, displaying explanation banner upon click.
- `15-form-attack-results.txt` — Systematic edge-case penetration test through the browser UI.
- `16-direct-request-command-and-response.txt` — Raw command and HTTP 201 response proving full client-side validation bypass.
- `17-commit-list-and-rollback.txt` — Commit log and deterministic `git revert` execution output.
