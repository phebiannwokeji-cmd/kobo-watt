# Rollback Without Hallucination — Kobo Watt Task 3

## 1. The Regretted Change

During experimentation with user acquisition features, an unverified "Referral code (Optional)" text input was added to the registration form in `public/auth.html`.

This change was committed under:
- **Commit ID:** `41d9728`
- **Commit Message:** `"Add unverified referral code field to registration form (regretted change)"`

Upon review against the information architecture decisions in `docs/field-justification.md`, the field failed all three justification tests:
1. It is not currently needed by operations.
2. The business has no referral incentive tracking system implemented in the database.
3. It creates unnecessary visual clutter and data collection liability without business purpose.

The change had to be undone.

---

## 2. Commit Identification and Inversion

Rather than prompting an AI assistant to "undo the last change" or manually attempting to re-edit the file, the working tree was checked against the Git commit log:

```text
41d9728 Add unverified referral code field to registration form (regretted change)
69103e6 Attack form and execute direct endpoint bypass recording unvarnished results (Task 3 Step 8)
e47abc8 Implement password rules, disabled vs hidden button comparison, and evidence (Task 3 Step 7)
2f1e3c6 Conduct accessibility audit, fix 4 defects, and record screen reader transcripts (Task 3 Step 6)
```

The specific, uncorrupted commit ID was identified: **`41d9728`**.

The exact rollback command was executed:
```bash
git revert 41d9728 --no-edit
```

This produced clean revert commit **`ef7f409`**, which precisely excised the 6 added lines from `public/auth.html` while keeping the repository history linear, traceable, and intact without using destructive force-pushes (`git push --force`).

---

## 3. Why Naming the Commit ID is Safer Than Describing the Change in Words

Natural language descriptions of code changes are inherently ambiguous and subjective:
- Asking an AI assistant or colleague to "remove what was just added to the form" forces the recipient to infer intent, guess which lines belong to which change, and potentially delete unrelated attributes, adjacent validation hooks, or nearby formatting.
- In contrast, a Git commit hash is an immutable SHA identifier referencing an exact, cryptographic snapshot of a file delta. Invoking `git revert <commit-id>` delegates the rollback to Git's deterministic patch-application engine, ensuring that exactly and only the intended diff is inverted without risk of AI hallucination, missed files, or collateral regression.
