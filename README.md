# Kobo Watt — Five-Task Submission

This submission uses one repository with five top-level task folders. Task 1 contains the completed design-system and prototype work. Tasks 2–5 contain placeholders only because their task-specific work has not started.

## 1. Business

Kobo Watt is a fictional rent-to-own solar and inverter service in Ikeja, Lagos, for customers such as Adaobi, a salon owner on a mid-range Android phone, and its main job is to help her understand her recorded access and whether a payment credited her account.

## 2. Current status

**Completed**

- Task 1 is complete as a submission: the design tokens and conversion pipeline, the account-summary prototype, the supporting documentation, and the evidence are in [task-01-design-system/](task-01-design-system/README.md).
- The completed Figma export is converted into CSS custom properties and utility classes: 120 primitive colours, 100 colour roles (50 light and 50 dark), 15 typography styles, and 3 shadows.
- The static account-summary prototype includes the light and dark themes and the labelled “Access active, but no power” help route. Its evidence includes before-and-after screenshots, contrast output, token exports, and the preserved broken-reference experiment.
- The shared repository setup is present: one repository, five top-level task folders, and this root README. The Task 1 files are complete; the other four folders contain only placeholder READMEs.

**Partial**

- Accessibility: the 56 listed colour-contrast pairs pass their stated thresholds, but that is a whitelist of checked uses, not proof of whole-screen accessibility. Keyboard behaviour, visible focus, screen-reader announcements, error announcements, and other WCAG checks are not fully recorded. See [colour-role measurements](task-01-design-system/docs/colour-roles.md) and the [accessibility answers](task-01-design-system/docs/interview-answers.md).
- Readability: all 15 typography styles use SemiBold with negative letter spacing, and long instructions or small phone layouts have not been tested. See [type-scale limits](task-01-design-system/docs/type-scale.md).
- Performance: the three-second account-summary target is documented but has not been measured. See [business decisions](task-01-design-system/docs/business-decisions.md).

**Not started**

- Tasks 2–5: no task-specific implementation, evidence, or documentation has been produced. Their folders contain status placeholders only.
- No backend, database, authentication, sessions, server-side validation, or payment-provider integration exists yet.
- No public GitHub repository or remote exists yet.

I am not claiming grading approval or complete WCAG compliance.

## 3. Stack and reasons

- **Figma Variables exported as JSON.** The completed export in [evidence/06-tokens-complete.json](task-01-design-system/evidence/06-tokens-complete.json) is the source of truth for the token pipeline because the design values can be converted and checked without reading them from an image.
- **Python 3 with the standard library.** The conversion, verification, contrast, and raw-colour search tools use only built-in modules, so there are no package-install or build steps. I chose this so the checks are repeatable on a fresh machine.
- **Static HTML, CSS, and vanilla JavaScript.** The Task 1 deliverable is one account screen and a design system, not a production application. Serving the files directly keeps the tokens and layout inspectable and avoids a client framework or bundler. The records do not document a framework comparison, so I am not claiming one was made.
- **CSS custom properties.** The generated files expose primitive colours, colour roles, typography, and shadows as custom properties. Interface rules use role references, which makes the light/dark `data-theme` switch possible without duplicating component styles.
- **Self-hosted Source Sans Pro WOFF2.** I used the bundled SemiBold (600) files so the font travels with the repository. The [Task 1 README](task-01-design-system/README.md) documents Google Fonts CDN as an alternative and keeps the self-hosted files as the version used by this prototype.
- **Node.js and headless Chrome for optional screenshot capture.** `tools/capture-screen.mjs` uses built-in Node.js modules and the Chrome DevTools Protocol to reproduce the evidence screenshots. It is tooling, not part of the prototype runtime.
- **Material 3 v0.192 as the documented typography baseline.** I recorded two deliberate departures from it — Source Sans Pro and tighter Display Large tracking — in [divergences](task-01-design-system/docs/divergences.md).

## 4. Setup and running

Prerequisites:

- Git.
- Python 3. The test environment used Python 3.14.7 through the `python` launcher; the token tools use only the standard library.
- A modern browser.
- Optional: Node.js and Google Chrome for screenshot reproduction.

No public GitHub repository exists yet. The clone URL below is a clearly labelled placeholder; replace it when the repository is published.

```bash
git clone <KOBO-WATT-REPOSITORY-URL> kobo-watt
cd kobo-watt
cd task-01-design-system
python -m http.server 4173 --bind 127.0.0.1
```

Open <http://127.0.0.1:4173/prototype/>. Press `Ctrl+C` in that terminal to stop the server.

No `npm install` or build step is required. To run the documented token checks, use a second terminal from the `kobo-watt` repository root:

```bash
cd task-01-design-system
python tools/verify-tokens.py
```

## 5. Environment variables

No environment variables are required to run the prototype or the token tools. The optional screenshot tool reads `CHROME_PATH` to locate Google Chrome; if it is unset, the script uses the platform default. No values are stored in the repository, and this document contains no secrets.

## 6. Deliberate exclusions

The current prototype deliberately does not:

- process real payments or control solar/inverter hardware — it uses test payments and simulated recorded access, and it does not prove that electricity is flowing;
- include a backend, database, authentication, sessions, server-side validation, or payment-provider integration — those are later-task work and have not started;
- send a support request or promise a staffed support service — the “Access active, but no power” page is a labelled demonstration;
- provide live commercial terms, refunds, disputes, chargebacks, or a validated support policy — the price, persona, and rules are provisional;
- provide a production deployment or build pipeline — it is a local static prototype.

The payment and account rules are provisional, and Adaobi is a hypothetical persona rather than an interviewed customer. The [business brief](task-01-design-system/docs/business-brief.md) records those limits.

## 7. Known defects and limitations

**Preserved experiment, not a current main-branch defect.** The [Task 1 defect record](task-01-design-system/docs/defects.md) documents a deliberate regression: one colour role was temporarily pointed at a fixed colour while palette values changed, so part of the screen stopped following the palette. The experiment was created on a separate branch, preserved as commit `d820faa523f498cd32b74a4c2d190adfa655d129`, and tagged `task-01/experiment-evidence`; the branch itself was deleted. It is not an ancestor of `main`. The current `main` uses colour-role references and does not show the broken styling. Evidence: [broken-reference screenshot](task-01-design-system/evidence/11-broken-referencing.png) and [branch/deletion log](task-01-design-system/evidence/12-git-log-branch-unmerged.txt).

Current limitations:

- Contrast checks cover 56 listed pairs, not every combination in the interface, and do not prove keyboard, focus, screen-reader, or error-announcement behaviour. See [colour-role measurements](task-01-design-system/docs/colour-roles.md).
- The type scale has not been tested for sustained reading in long instructions or small phone layouts. See [type-scale limits](task-01-design-system/docs/type-scale.md).
- The three-second performance target has not been measured. See [business decisions](task-01-design-system/docs/business-decisions.md).
- The captured screens use a 390 × 844 CSS-pixel viewport; this is not a broad device or browser test. See the [prototype notes](task-01-design-system/prototype/README.md).

No separate unresolved functional defect is recorded on `main`. The deliberate experiment above is the only entry in the Task 1 defect record, and it is kept as evidence rather than presented as current styling.
