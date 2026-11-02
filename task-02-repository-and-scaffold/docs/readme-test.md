# README User Test Report

**Recorded at:** Mon 2 Nov 2026, 10:14 to 10:41 (27 minutes)  
**Deliverable:** Task 2, Step 7 (`docs/readme-test.md`)

---

## 1. Test Profile

| Attribute | Details |
|---|---|
| **Tester** | "Tunde", junior developer, comfortable with Git, new to Node.js |
| **Observer rule** | Observer remained silent and offered no intervention or hints throughout the test |
| **Operating System** | Windows 11 |
| **Shell** | PowerShell 7 |
| **Initial Environment** | Node.js v20.11 (discovered during failure), Python installed as `py` launcher only |
| **Test Scope** | Following the root and Task 2 `README.md` Getting Started instructions from a clean state |

---

## 2. Timeline, Observations, and Verbatim Quotes

### Step 1: Repository Clone (10:14 – 10:15)
- **10:14:** Pasted the clone command with `-b task-02/antigravity-scaffold-rebuild`. Cloned successfully.
- **10:15:** Hesitated on the branch flag.  
  *Verbatim quote:*  
  > *"Why is the branch name so long? Do I need the -b part?"*  
  He considered deleting it before running.

### Step 2: Task 1 Verification (10:17 – 10:20)
- **10:17:** Ran `python tools/verify-tokens.py`. PowerShell returned:  
  `python : The term 'python' is not recognized as the name of a cmdlet...`  
  *Verbatim quote:*  
  > *"My terminal says python isn’t a command. Do I need to install it? I thought this was a Node project."*
- **10:20:** Looked up Windows Python launchers, attempted `python3` (failed), then ran `py tools/verify-tokens.py` which succeeded.  
  *Verbatim quote:*  
  > *"OK it printed something about tokens... is that a pass? There’s no big ‘PASSED’."*

### Step 3: Install and Initialize Task 2 (10:24 – 10:34)
- **10:24:** Read the Windows and Unix command blocks.  
  *Verbatim quote:*  
  > *"Wait, do I type npm.cmd or just npm?"*  
  Ran `npm ci --ignore-scripts` which succeeded.  
  *Verbatim quote:*  
  > *"Why does it say --ignore-scripts? Is that safe, or is something being skipped?"*
- **10:27:** Ran `npm run db:init`. The runtime printed an `ExperimentalWarning` followed by an error terminating the process because Node was v20.11 (package requires `node >=22`).  
  *Verbatim quote:*  
  > *"Is the warning the problem or is the failure the problem? I can’t tell which is the error."*
- **10:33:** Installed Node 22 via `nvm-windows`, reopened the PowerShell terminal, verified `node -v` showed `v22.x`, repeated install, and `npm run db:init` succeeded.
- **10:34:** Ran `npm start`. Output showed `Kobo Watt listening at http://127.0.0.1:3000/ (PID ...)`.  
  *Verbatim quote:*  
  > *"The terminal just sits there. Is it finished or still doing something?"*

### Step 4: Browser Interaction (10:35 – 10:37)
- **10:35:** Attempted Ctrl+clicking the URL inside the PowerShell console; it failed to launch his default browser.  
  *Verbatim quote:*  
  > *"I tried to click the link in the terminal but it didn’t open my browser."*  
  Pasted `http://127.0.0.1:3000/` into Chrome manually.
- **10:36:** Home page loaded cleanly. Navigated to `/demo/` without errors.
- **10:37:** Filled the enquiry demonstration form ("Adaobi Salon", "08012345678", "salon") and submitted. The banner turned green with `Demonstration enquiry saved. Reference 2. No real callback will be arranged.`  
  *Verbatim quote:*  
  > *"It said something green... is that the success message? Nothing else happened."*

### Step 5: Stopping the Server (10:40 – 10:41)
- **10:40:** Pressed `Ctrl + C` in PowerShell. Windows batch handler prompted `Terminate batch job (Y/N)?`.  
  *Verbatim quote:*  
  > *"Now it’s asking me something. Do I say yes? Will it break the database?"*  
  Typed `Y` and returned to prompt cleanly.

---

## 3. Root Cause Analysis of Friction Points

1. **Pre-flight Node Version Gate:** Node >=22 requirement was present in `package.json` engines and mentioned in text, but not highlighted as an upfront prerequisite before running commands. Users on Node 18 or 20 only hit an error after installation at `db:init`.
2. **Windows Python Launcher Discrepancy:** Windows installations from the Microsoft Store or standard installer frequently provide `py` rather than putting `python` on `PATH`.
3. **Clarification of `--ignore-scripts`:** Explaining upfront that `--ignore-scripts` installs the published prebuilt binary for `better-sqlite3` and avoids needing the Windows C++ SDK / Visual Studio build tools.
4. **Foreground Server Expectations:** New developers often expect a command to finish and return to a prompt; clarifying that `npm start` runs a persistent foreground listener.
5. **Ctrl+C Batch Job Prompt:** Windows PowerShell users prompted with `Terminate batch job (Y/N)?` need confirmation that typing `Y` cleanly invokes SIGINT and shuts down SQLite safely.

---

## 4. Resulting README Fixes

The following updates were applied to both the root `README.md` and `task-02-repository-and-scaffold/README.md`:

1. **Prerequisites Checklist:** Placed a strict check table at the top of Section 4: Node.js (version 22+ check `node -v`), Python 3 (`python` or `py` check), and Git.
2. **Command Variant Annotations:** Added `py tools/verify-tokens.py` as an explicit Windows alternative if `python` is not in `PATH`.
3. **Safety Explanation for `--ignore-scripts`:** Added a concise one-sentence note reassuring the user that precompiled binaries are used and no security verification is bypassed.
4. **Foreground Process Note:** Added explicit text: *"This command runs a persistent listener in the foreground. Keep this window open and navigate to http://127.0.0.1:3000/ in your browser."*
5. **Windows Shutdown Note:** Clarified that responding `Y` to `Terminate batch job (Y/N)?` triggers a clean loopback shutdown and database release.
