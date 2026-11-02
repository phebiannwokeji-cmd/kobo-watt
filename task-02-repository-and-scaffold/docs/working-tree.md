# The Working Tree and Branching Strategy

**Deliverable:** Task 2, Step 8 (`docs/working-tree.md`)  
**Corresponding Artifact:** [evidence/14-working-tree-drawing.jpg](../evidence/14-working-tree-drawing.jpg)

---

## 1. The Pipeline: From Keystroke to Production

The Git pipeline is not a single workspace; it is a five-stage progression across physical and remote boundaries:

1. **Working Tree (Your Computer):** The actual directory of files on your local filesystem where you edit code. Uncommitted changes here exist only in your local editor memory and volatile disk.
2. **Local Git Store (Index & `.git` Object Store):** The staging area (`git add`) and local repository (`git commit`). Once committed, the change is frozen into a SHA-1/SHA-256 hash tree on your computer, but remains completely private to your machine.
3. **GitHub (Remote Repository):** The shared remote origin (`git push`). Here, commits enter shared history. Other engineers and automated CI/CD runners can view, fetch, and pull them.
4. **Production Server / Environment:** The live runtime hosting the application.
5. **Branches (The Structural Binding):**
   - `main`: The verified, production-ready branch that mirrors the deployment artifact.
   - `Feature Branch A` (e.g., `task-02/antigravity-scaffold-rebuild`): Isolated branch for feature scaffolding and database development.
   - `Feature Branch B` (e.g., `experiment/temporary-feature`): Isolated branch for exploratory spikes or discarded experiments.

---

## 2. Two Critical Boundary Lines

In the hand-drawn architecture ([14-working-tree-drawing.jpg](../evidence/14-working-tree-drawing.jpg)), two specific thresholds are marked:

### Threshold 1: The Point Past Which a Mistake Cannot Be Undone Quietly
- **Location:** The `git push` boundary to the remote repository (GitHub).
- **Why:** On your local machine, an unpushed mistake can be amended (`git commit --amend`), rebased (`git rebase -i`), or discarded (`git restore`) completely silently. Nobody else knows it happened. Once pushed to GitHub, however, that commit hash enters shared upstream history. Rebasing or force-pushing a shared branch alters commit graphs for any collaborator or build runner tracking the branch. Once pushed, mistakes must either be publicly reverted with a forward-only compensating commit (`git revert`) or publicly acknowledged.

### Threshold 2: The Point Where Code Becomes Visible to Users
- **Location:** The deployment step from the remote `main` branch to the Production runtime.
- **Why:** Commits can live on GitHub in feature branches or pull requests without affecting end users. But once code is merged into `main` and deployed to the production environment, it directly drives what users (such as Adaobi managing her salon's solar inverter in Ikeja) experience.

---

## 3. What Breaks When a Tree Has Only One Branch (`main` Only)

When all work occurs directly on `main`:

1. **Entangled Incomplete Features:** Any exploratory or half-finished code must either be committed directly to `main` or left as uncommitted working-tree dirt. If a critical bug fix is needed immediately, you cannot deploy the fix without also deploying the unfinished feature.
2. **Loss of Atomic Rollback:** In a single-branch workflow, rolling back a faulty feature requires peeling back commits that may also contain unrelated operational fixes, creating high-risk manual cherry-picks.
3. **Collision of Concurrent Tasks:** In multi-developer or multi-agent workflows, working solely on `main` causes continuous merge conflicts, index locking issues, and accidental overwriting of uncommitted files.

---

## 4. Why Single-Branch Fragility Matters More After Deployment Than Before

Before initial deployment, a broken commit on `main` has near-zero external consequence:
- The app is not live.
- There are no active users, no transactions, no SLA, and no revenue moving.
- If `main` is broken for two days while an agent re-scaffolds, nobody outside your laptop is affected.

**After the first deployment, everything changes:**
1. **`main` Equals the Live System:** The `main` branch is no longer a personal workspace; it is the source of truth for the running software. A broken commit on `main` can trigger automated deployment pipelines, taking down the live service or corrupting runtime databases.
2. **Customer Impact:** For Kobo Watt, a failure in production means a business owner cannot verify whether their electricity access is active or whether a payment cleared.
3. **Legal and Operational Auditability:** In production, data and code changes leave traces in audit logs, user sessions, and monitoring alerts. A mistake deployed to production cannot simply be erased by rewriting history; it requires an incident report, a post-mortem, and clean forward-only remediation.

