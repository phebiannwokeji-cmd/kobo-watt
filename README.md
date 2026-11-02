# Kobo Watt — Five-Task Submission

This submission uses one repository with five top-level task folders. Task 1 contains the completed design-system and prototype work. Task 2 contains the Express scaffold and a later fictional enquiry database feature. Tasks 3–5 contain placeholders only because their task-specific work has not started.

## 1. Business

Kobo Watt is a fictional rent-to-own solar and inverter service in Ikeja, Lagos, for customers such as Adaobi, a salon owner on a mid-range Android phone, and its main job is to help her understand her recorded access and whether a payment credited her account.

## 2. Current status

**Completed**

- Task 1 is complete as a submission: the design tokens and conversion pipeline, the account-summary prototype, the supporting documentation, and the evidence are in [task-01-design-system/](task-01-design-system/README.md).
- The completed Figma export is converted into CSS custom properties and utility classes: 120 primitive colours, 100 colour roles (50 light and 50 dark), 15 typography styles, and 3 shadows.
- The static account-summary prototype renders in the light theme. The generated CSS also contains dark theme styles under `data-theme="dark"`, but the prototype has no user-facing theme switch. It includes the labelled “Access active, but no power” help route. Its evidence includes before-and-after screenshots, contrast output, token exports, and the preserved broken-reference experiment.
- The shared repository setup is present: one repository, five top-level task folders, and this root README. The Task 1 files are complete.
- Task 2 contains the Express scaffold and a fictional enquiry database feature: a home-page form, a parameterised SQLite INSERT, server-side validation, dynamically generated IDs and UTC timestamps, a separate schema initialiser, a read-only inspection tool, and a controlled read-only failure exercise. It is a local, unauthenticated demonstration with fictional data only. See the [Task 2 README](task-02-repository-and-scaffold/README.md) and [false-success record](task-02-repository-and-scaffold/docs/false-success.md).

**Partial**

- Task 2 is a demonstration, not a production enquiry service. It has no authentication, idempotency key, real callback, payment flow, support workflow or deployment hardening. The database write, read-only failure and restoration checks passed locally, but disk-full, crash, lock-timeout and mobile-browser behaviour were not tested.
- Accessibility: the 56 listed colour-contrast pairs pass their stated thresholds, but that is a whitelist of checked uses, not proof of whole-screen accessibility. Keyboard behaviour, visible focus, screen-reader announcements, error announcements, and other WCAG checks are not fully recorded. See [colour-role measurements](task-01-design-system/docs/colour-roles.md) and the [accessibility answers](task-01-design-system/docs/interview-answers.md).
- Readability: all 15 typography styles use SemiBold with negative letter spacing. Layout checks were reported at 320 and 390 CSS pixels for overflow and clipping, but sustained reading has not been tested with users. See [type-scale limits](task-01-design-system/docs/type-scale.md).
- Performance: the three-second account-summary target is documented but has not been measured. See [business decisions](task-01-design-system/docs/business-decisions.md).

**Not started**

- Tasks 3–5: their folders contain status placeholders only.
- No authentication, sessions, payment-provider integration or real payments exist. Task 2 has server-side validation for its fictional enquiry form only.
- The public GitHub repository has been created at <https://github.com/phebiannwokeji-cmd/kobo-watt>.

I am not claiming grading approval or complete WCAG compliance.

## 3. Stack and reasons

- **Figma Variables exported as JSON.** The completed export in [evidence/06-tokens-complete.json](task-01-design-system/evidence/06-tokens-complete.json) is the source of truth for the token pipeline because the design values can be converted and checked without reading them from an image.
- **Python 3 with the standard library.** The conversion, verification, contrast, and raw-colour search tools use only built-in modules, so there are no package-install or build steps. I chose this so the checks are repeatable on a fresh machine.
- **Static HTML, CSS, and vanilla JavaScript.** The Task 1 deliverable is one account screen and a design system, not a production application. Serving the files directly keeps the tokens and layout inspectable and avoids a client framework or bundler. The records do not document a framework comparison, so I am not claiming one was made.
- **CSS custom properties.** The generated files expose primitive colours, colour roles, typography, and shadows as custom properties. Interface rules use role references, which lets the stylesheets support a dark `data-theme` override without duplicating component styles. The prototype itself does not expose a theme toggle.
- **Self-hosted Source Sans Pro WOFF2.** I used the bundled SemiBold (600) files so the font travels with the repository. The [Task 1 README](task-01-design-system/README.md) documents Google Fonts CDN as an alternative and keeps the self-hosted files as the version used by this prototype.
- **Node.js, Express 5.3.0 and better-sqlite3 13.0.3 for Task 2.** The Task 2 scaffold runs one loopback Express server with an explicit route whitelist. better-sqlite3 was pinned for a small local SQLite demonstration; its registry metadata requires Node.js >=22, and the verified runtime is Node v24.19.0. The database is created only by `npm run db:init`, not by server startup.
- **Node.js and headless Chrome for optional screenshot capture.** `tools/capture-screen.mjs` uses built-in Node.js modules and the Chrome DevTools Protocol to reproduce the evidence screenshots. It is tooling, not part of the prototype runtime.
- **Material 3 v0.192 as the documented typography baseline.** I recorded two deliberate departures from it — Source Sans Pro and tighter Display Large tracking — in [divergences](task-01-design-system/docs/divergences.md).

## 4. Getting started (Setup and running)

### Prerequisites checklist
Before running, verify your local tools:
- **Node.js >= 22**: Run `node -v` to check. (Task 2's SQLite engine strictly requires Node 22 or newer; older versions fail during database initialization).
- **Python 3**: Run `python --version` (or `py --version` on Windows if `python` is not in your PATH).
- **Git**: Installed and available in your terminal.

The public repository is available at <https://github.com/phebiannwokeji-cmd/kobo-watt>. Clone it and checkout the active branch:

```bash
git clone -b task-02/antigravity-scaffold-rebuild https://github.com/phebiannwokeji-cmd/kobo-watt.git kobo-watt
cd kobo-watt
```

### 4.1 Running Task 1 (Design System Prototype & Token Checks)
To verify design tokens (standard library only, no dependencies):

```bash
cd task-01-design-system
python tools/verify-tokens.py
# (On Windows, use 'py tools/verify-tokens.py' if 'python' is unrecognized)
cd ..
```

To view the static prototype:
```bash
cd task-01-design-system
python -m http.server 4173 --bind 127.0.0.1
# (Or: py -m http.server 4173 --bind 127.0.0.1)
```
Open <http://127.0.0.1:4173/prototype/> in your browser. Press `Ctrl+C` in that terminal to stop the server.

### 4.2 Running Task 2 (Express Scaffold & Enquiry Demonstration)
From the repository root:

```powershell
cd task-02-repository-and-scaffold
npm.cmd ci --ignore-scripts
npm.cmd run db:init
npm.cmd start
```
*(On macOS / Linux, substitute `npm` for `npm.cmd`).*

- **Why `--ignore-scripts`:** `better-sqlite3` ships a precompiled binary for Windows (`win32-x64`). Using `--ignore-scripts` installs this safe, verified prebuilt binary directly and avoids failing on `node-gyp` if Visual Studio C++ build tools are absent.
- **Process state:** `npm.cmd start` starts a persistent listener in the foreground. While it is running, open <http://127.0.0.1:3000/> in your browser.
- **Stopping:** Press `Ctrl+C`. If Windows PowerShell asks `Terminate batch job (Y/N)?`, type `Y`. The process shuts down gracefully and closes the database connection.

The install and database smoke-test results are recorded in the [Task 2 README](task-02-repository-and-scaffold/README.md) and tested by an independent user in [readme-test.md](task-02-repository-and-scaffold/docs/readme-test.md).

## 5. Environment variables

Task 1's prototype and token tools require no environment variables. The optional screenshot tool reads `CHROME_PATH` to locate Google Chrome; if it is unset, the script uses the platform default.

Task 2 uses `PORT` (default 3000), `DATABASE_PATH` (default `data/enquiries.db`, outside public routes), `DB_READONLY=1` for the controlled read-only failure exercise, and optional `NODE_USE_SYSTEM_CA=1` for the system certificate store. Do not disable certificate verification. No secrets are stored in the repository.

## 6. Deliberate exclusions

The Task 1 prototype deliberately does not:

- process real payments or control solar/inverter hardware — it uses test payments and simulated recorded access, and it does not prove that electricity is flowing;
- include authentication, sessions, or payment-provider integration — those are later-task work and have not started;
- send a support request or promise a staffed support service — the “Access active, but no power” page is a labelled demonstration;
- provide live commercial terms, refunds, disputes, chargebacks, or a validated support policy — the price, persona, and rules are provisional;
- provide a production deployment or build pipeline — it is a local static prototype.

Task 2's enquiry feature is separate from the Task 1 prototype. It deliberately does not authenticate users, arrange a real callback, create an account, take payment, provide idempotency, or claim production readiness.

The payment and account rules are provisional, and Adaobi is a hypothetical persona rather than an interviewed customer. The [business brief](task-01-design-system/docs/business-brief.md) records those limits.

## 7. Known defects and limitations

**Preserved experiment, not a current main-branch defect.** The [Task 1 defect record](task-01-design-system/docs/defects.md) documents a deliberate regression: one colour role was temporarily pointed at a fixed colour while palette values changed, so part of the screen stopped following the palette. The experiment was created on a separate branch, preserved as commit `d820faa523f498cd32b74a4c2d190adfa655d129`, and tagged `task-01/experiment-evidence`; the branch itself was deleted. It is not an ancestor of `main`. The current `main` uses colour-role references and does not show the broken styling. Evidence: [broken-reference screenshot](task-01-design-system/evidence/11-broken-referencing.png) and [branch/deletion log](task-01-design-system/evidence/12-git-log-branch-unmerged.txt).

Current limitations:

- Contrast checks cover 56 listed pairs, not every combination in the interface, and do not prove keyboard, focus, screen-reader, or error-announcement behaviour. See [colour-role measurements](task-01-design-system/docs/colour-roles.md).
- The type scale has not been tested for sustained reading with users. See [type-scale limits](task-01-design-system/docs/type-scale.md).
- The three-second performance target has not been measured. See [business decisions](task-01-design-system/docs/business-decisions.md).
- Reported layout checks at 320 and 390 CSS pixels looked for overflow and clipping. The repository's captured screens use a 390 × 844 CSS-pixel viewport. These are reported checks, not an independent reproduction, and they are not a broad device or browser test or a readability study. See the [prototype notes](task-01-design-system/prototype/README.md).
- Task 2's enquiry feature is unauthenticated and local-only, has no idempotency key, and does not arrange a callback or take payment. Its read-only failure exercise and writable restoration passed, but disk-full, crash, lock-timeout and mobile-browser cases were not tested. On the verified Windows machine, installation uses `npm.cmd ci --ignore-scripts` because the package's prebuilt binary is present and the Windows SDK is not. See the [Task 2 false-success record](task-02-repository-and-scaffold/docs/false-success.md).

No separate unresolved functional defect is recorded for Task 1 on `main`. The deliberate experiment above is the only entry in the Task 1 defect record, and it is kept as evidence rather than presented as current styling.
