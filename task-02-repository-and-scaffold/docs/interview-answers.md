# Task 2 Interview Defence

**Deliverable:** Task 2, Step 10 (`docs/interview-answers.md`)  
**Specification:** Answer all fifteen questions; maximum 200 words per response.

---

### Version Control

#### 1. What is the difference between Git Flow and trunk-based development, and why have a lot of teams moved toward trunk-based?
Git Flow relies on long-lived branches (`main`, `develop`, feature, release, and hotfix branches). Features are developed in isolation for weeks before merging into `develop`, batching changes for scheduled releases. Trunk-based development has all engineers integrate small, frequent commits directly into a single shared branch ("trunk" or `main`), typically multiple times a day or via short-lived feature branches lasting under 24–48 hours.

Teams migrated toward trunk-based development because long-lived branches create massive, painful merge conflicts ("merge hell") and delay integration feedback. In modern CI/CD environments, trunk-based development pairs with feature flags and automated testing to enable continuous deployment, smaller pull requests, rapid code reviews, and faster mean time to recovery (MTTR).

#### 2. What does git push --force actually do, and why is --force-with-lease generally safer?
`git push --force` (`-f`) instructs the remote Git server to overwrite the remote branch ref with your local commit pointer, completely ignoring whatever commits might currently exist on the remote. If a teammate pushed work to that branch in the interim, their commits are orphaned and lost from branch history.

`git push --force-with-lease` is safer because it performs a check before overwriting. It compares the remote ref against your local tracking ref (`origin/branch`). If someone else pushed new commits to the remote that you haven't fetched yet, the lease check fails and refuses the overwrite. It gives you the power to update your own rewritten commits without clobbering upstream changes made by others.

#### 3. Why is rewriting history, through rebase, amend or force push, dangerous on a shared branch?
Git commit identities are immutable SHA hashes calculated from file contents, parent commits, author, and timestamp. Rebasing or amending modifies parentage or metadata, generating entirely new commit hashes for identical changes.

On a shared branch, collaborators base their work on the original commit hashes. When someone rewrites history and force-pushes, the branch diverged. Teammates pulling the rewritten branch get duplicate commits, false merge conflicts, and corrupted trees. History rewriting should only ever occur on private, local, unpushed branches before opening a pull request.

#### 4. What is the difference between git merge and git rebase, and when would you actually pick one over the other?
`git merge` combines two branch histories by creating a new three-way merge commit with two parents. It completely preserves the chronological history, branch topology, and context of how work evolved, but can result in cluttered, non-linear commit graphs.

`git rebase` replays your feature branch commits onto the tip of the target branch, rewriting commit hashes to create a clean, linear history with no merge commits. 

Pick `git rebase` when updating your private local feature branch with the latest changes from `main` before submitting a pull request. Pick `git merge` (specifically PR merges) when integrating a reviewed feature branch into `main` to preserve the historical record of when the feature landed.

#### 5. What causes a merge conflict, and what is actually happening in the file when you see the conflict markers?
A merge conflict occurs when two branches modify the exact same lines of a file differently since their common ancestor commit, or when one branch edits a file that the other branch deleted. Git's automated three-way merge algorithm cannot algorithmically deduce which change represents authorial intent.

Inside the conflicted file, Git halts and inserts conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`). The section between `<<<<<<< HEAD` and `=======` shows the content in your currently checked-out branch. The section between `=======` and `>>>>>>> <branch>` shows the incoming content from the branch being merged. Git requires a human to edit the file, select or combine the desired code, remove the markers, and stage the resolved file.

#### 6. What is the difference between the working directory, the staging area and the repository?
- **Working Directory:** The local filesystem folder on your disk where files are visible and directly edited. Changes here are unstaged, unversioned by Git, and volatile.
- **Staging Area (Index):** An intermediate holding buffer (tracked in `.git/index`) where you prepare the exact set of file changes intended for the next commit using `git add`. It allows crafting focused, atomic commits rather than committing everything in your workspace.
- **Repository:** The permanent Git database (inside `.git/objects`). Once you run `git commit`, the staged snapshot is frozen into immutable commit, tree, and blob objects with a unique SHA hash.

#### 7. What is branch protection, and what does it typically enforce?
Branch protection is a repository governance feature (enforced by GitHub/GitLab) on critical branches like `main` or `production`. It restricts who can push or merge code to prevent unauthorized, accidental, or broken changes.

Common enforcement rules include:
- Disallowing direct pushes and force pushes (`git push --force`).
- Requiring pull requests with approval from designated reviewers (e.g., Code Owners).
- Requiring passing automated CI status checks (unit tests, linters, security scanners) before merge.
- Enforcing signed commits with verified GPG keys.
- Requiring branches to be up to date with `main` before merging.

---

### The Role and the Engagement

#### 8. Walk me through a technical project you built end to end.
In building Kobo Watt, I engineered an operational dashboard and rent-to-own payment verification system for solar/inverter customers in Ikeja, Lagos. 

I began with primary information design and token architecture in Figma, exporting semantic tokens for color roles, responsive typography, and shadows. In Task 2, I stood up a hardened Express backend adhering to strict whitelist routing and zero root-directory exposure. I integrated SQLite via `better-sqlite3`, structuring parameterized persistence and separating schema generation from runtime execution. 

I designed deliberate breakage drills to test failure recovery: simulating missing directories (ENOENT -4058), resolving port collisions (`EADDRINUSE`) with operating system socket inspections, and diagnosing unmapped route 404s. To prevent false-success bugs, I proved database persistence with auto-increment IDs and real timestamps minutes apart, and validated that controlled write failures (`SQLITE_READONLY`) returned HTTP 500 without false UI success.

#### 9. Tell me about a time when something you built broke in production.
In an earlier project involving scheduled background tasks, an automated data export worker silently crashed in production due to an uncaught unhandled promise rejection caused by a third-party webhook timeout. Because the background process was detached without process monitoring or heartbeats, the server stayed up and reported healthy HTTP status on health checks while scheduled customer reports stopped sending for three days.

I diagnosed the issue by inspecting system logs and noticing the absence of periodic finish logs. To remediate, I wrapped asynchronous job execution in centralized error boundaries, introduced structured start-and-finish log counts, and configured process monitoring with automated alerting when expected worker intervals elapsed without a finish event.

#### 10. How do you approach learning a new technical platform or codebase quickly when starting a new engagement?
I approach a new codebase through runtime verification and data boundaries rather than reading raw code top-to-bottom:
1. **Trace the Entrypoint and Request Lifecycle:** Identify `server.js` or `main()`, map the middleware pipeline, route dispatchers, and error handlers.
2. **Inspect the Data Schema:** Review the database schema and migrations. The schema reveals the actual business domain, relationships, and constraints faster than UI components.
3. **Run the Test and Build Pipeline:** Execute tests and build scripts locally. Observing how the project fails and builds uncovers dependencies, environment variables, and hidden prerequisites.
4. **Instrument with Logs:** Trace one critical user flow (e.g. signup or payment) end-to-end with breakpoints or structured logs from incoming request to persistent storage.

#### 11. What is the difference between code that is correct and code that is complete?
Correct code satisfies the happy path specification: given valid input under standard operating conditions, it returns the expected output. A function that parses JSON and saves a record is correct if it succeeds when the payload is valid.

Complete code accounts for the entire operational environment. It handles malformed payloads, rate limiting, network disconnects, resource exhaustion, authorization checks, idempotency, structured error logging, graceful process termination, and accessible user feedback. Correct code works in a demo; complete code survives in production.

#### 12. How do you design software for a customer who will need to maintain it after you are gone?
I design for long-term maintainability by adhering to five principles:
1. **Minimal, Standard Dependencies:** Prefer platform built-ins and proven, well-maintained libraries over obscure frameworks.
2. **Strict Isolation and Single Sources of Truth:** Centralize configuration in environment variables and design tokens in explicit maps.
3. **Exhaustive Documentation:** Write Getting Started instructions tested against fresh clones by independent users, documenting prerequisites, exact commands, and known limitations.
4. **Separation of Operational Tasks:** Keep database schema initialisation (`npm run db:init`) separate from application startup so unexpected migrations never break live instances.
5. **Clear Error Signals:** Return structured, diagnostic server logs and clean, un-leaked user messages so support engineers can diagnose faults without debugger attachments.

---

### Your Work, Written for This Assessment

#### 13. Your first page load took a specific number of milliseconds. Where did that time go? Name the parts you can measure and the parts you are guessing about.
In our recorded server logs (`04b-first-load.txt`), the server-side request duration was measured at **29.284 ms**, with a client round-trip over loopback of **47 ms**. On full browser reload (`04c-home-browser-reload.txt`), the browser reported **811 ms DOMContentLoaded**, **1.52 s Load**, and **2.20 s Finish**.

**Measurable Parts:**
- `process.hrtime.bigint()` middleware directly measures Express route dispatch, disk file read (`public/index.html`), and socket write time.
- Chrome DevTools Network panel measures HTTP response headers, transferred byte sizes (45.3 kB across 7 requests), and resource timing breakdown (TTFB, content download).

**Guessed / Unmeasured Parts:**
- Operating system TCP socket handshake latency and loopback packet queuing.
- Browser layout engine overhead: CSSOM construction, font rasterization for Source Sans Pro, sub-pixel text rendering, and GPU composition phases.

#### 14. Your application reported success to the user while writing nothing to the database. Explain the mechanism that allowed that, and name the one check that would have caught it in thirty seconds.
The mechanism allowing false success is **decoupling UI feedback from verified write transactions**. If frontend JavaScript treats an HTTP 200 response or simple network completion as proof of storage—or if the backend endpoint returns success before awaiting the database driver’s insert confirmation—the interface will present a success banner even if the database write failed, locked, or was never called.

**The 30-Second Check:**  
Open the database inspector directly (e.g. `npm run db:inspect` or querying `SELECT COUNT(*) FROM enquiries`) immediately after submitting the form. If the database row count remains unchanged or no new row with your unique timestamp appears, you immediately prove the application is presenting an illusion.

#### 15. Wrong-answer analysis. A candidate says: "I always check my app is working by signing up a test user and confirming I get taken to the dashboard. If the dashboard loads, the backend is working." Say what is wrong with this, what it would miss, and what you would do instead.
**What is wrong:**  
This confuses a visual navigation transition with backend data persistence. A client-side router or static server can easily redirect to `/dashboard` upon receiving an HTTP 200 from a broken endpoint, or even transition based purely on client state without a database write occurring.

**What it misses:**  
1. Whether a record was actually inserted into the database with proper constraints, hashed credentials, and timestamps.
2. Whether the server returned an HTTP 201 Created or an error status that the frontend ignored.
3. Database connection pool exhaustion, schema mismatch, or read-only filesystem locks.

**What to do instead:**  
Inspect the server logs to verify the HTTP 201 status and write event, then query the database directly with a read-only client to verify the row exists, has an incremented primary key, and matches the submitted data.
