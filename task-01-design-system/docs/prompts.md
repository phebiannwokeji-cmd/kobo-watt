# Prompt History

## Step 6 Prompt

Complete Task 1, step 6 for Kobo Watt: write and run a script that converts my exported Figma design tokens into CSS custom properties.

First read:
- docs/business-brief.md
- docs/colour-roles.md
- docs/type-scale.md
- docs/shadows.md
- docs/divergences.md
- evidence/06-tokens-complete.json

If a required file is missing, report its exact path. Do not invent its contents.

Inspect the project before editing. Reuse its existing tools where practical. Do not overwrite unrelated work.

SOURCE OF TRUTH

Use evidence/06-tokens-complete.json as the conversion input. Preserve this export and evidence/05-tokens-incomplete.json unchanged.

The complete export contains:
- primitives: 120 base colour variables.
- color roles: 50 light and 50 dark role variables.
- font and typography: two representations of the same 15 text styles.
- effect/shadow: three shadow styles.
- color/material-theme: a separate collection of colour styles.

Use primitives and color roles for the website’s colour system. Do not use color/material-theme as a fallback or merge it into the colour roles; it contains different values.

If the export conflicts with the written records, report the exact difference before changing design values.

CONVERSION REQUIREMENTS

1. Write a repeatable conversion script. Running it again on the same input must produce the same CSS.

2. Generate:
   - styles/tokens.css
   - styles/typography.css

3. Give generated CSS properties clear, stable names. Detect naming collisions instead of silently overwriting values.

4. Put primitive colour properties in :root.

5. Use the same role property names for both themes:
   - Light roles apply by default.
   - Dark roles apply under [data-theme="dark"].

   For example:
   --kw-color-primary: var(--kw-palette-primary-40);

   The dark theme should change that role’s reference to the exported dark-theme target.

6. Preserve every exported colour-role reference as a CSS var() reference. Do not replace role references with copied HEX values. Fail clearly if a reference is missing or circular.

7. Website elements must use colour roles, such as --kw-color-primary and --kw-color-on-primary. They must not use primitive palette properties or raw colour values directly.

8. Convert all 15 typography styles, preserving font family, weight, size, letter spacing and line height. Inspect the export’s units carefully. Some percentage letter spacing from Figma has already been converted into pixel values; do not convert it a second time.

   Provide one reusable CSS class per typography style, using generated properties. Do not create duplicate styles from the font and typography sections.

   A font-family declaration does not load the font. Report whether Source Sans Pro is already available in the project and how it will be loaded. Do not claim it is loaded without checking.

9. Convert the three exported shadow effects, including offsets, blur, spread and colour transparency. Preserve the alpha values in the exported eight-digit HEX colours.

   Use effect/shadow for these shadows. The colour roles named “shadow” point to black and must not replace the three teal effect styles.

10. Keep literal design values in generated token definitions. Reusable typography classes and any later interface code must reference the generated properties.

CHECKS

Run the script and verify:
- 120 primitive colours are represented.
- All 50 light and 50 dark role definitions are represented.
- Every generated role reference resolves.
- All 15 typography styles are represented.
- All three shadows are represented.
- Display Large matches 64 px size, 96 px line height, weight 600 and -2.24 px letter spacing.
- Running the script twice produces identical output.
- Neither source JSON file was modified.

Document the command to regenerate the CSS and how to select the dark theme in README.md. Report the files changed, checks performed and any unresolved issues. Do not claim a check passed unless you ran it.

PROMPT EVIDENCE

Append this entire instruction verbatim to docs/prompts.md as the Step 6 prompt. Preserve existing entries. Record any later failed attempts and corrective prompts without rewriting or hiding them.

SCOPE

Complete the conversion and its checks only. Do not build the application screen yet: Task 1’s next step requires a separate before-and-after screen comparison.

## Corrective Prompt: On-Primary Container Typo Fix

The generated CSS contains “primay” instead of “primary”.
I have corrected the role name in Figma and replaced
evidence/06-tokens-complete.json with the new export.

Use the highlighted CSS line to locate the problem.

1. Confirm that the new JSON has the corrected
   On-Primary Container role in both Light and Dark.
2. Run the existing conversion script to regenerate the CSS.
3. Update any code that references the old misspelled property.
4. Check that no active generated CSS or interface code still
   uses “primay”.
5. Run the conversion again and confirm the typo does not return.

Preserve colour values and unrelated work. Do not edit the
incomplete export or historical evidence.

Append this corrective prompt verbatim to docs/prompts.md.
Report the changed files and checks actually performed.

## Corrective Prompt: Font-Loading Documentation Correction

Correct README.md’s font-loading instructions.

The generated CSS requests Source Sans Pro, but the Google Fonts
example loads Source Sans 3. Remove that mismatched example.

Document loading the actual Source Sans Pro SemiBold font under
the family name "Source Sans Pro". Keep font-loading CSS separate
from generated files so regeneration cannot erase it.

Do not silently change the chosen typeface or claim the font is
loaded before checking it in the browser.

Append this prompt verbatim to docs/prompts.md.

## Corrective Prompt: Source JSON Immutability Verification

Update tools/verify-tokens.py to check that conversion does not
modify either source JSON file.

1. Calculate the SHA-256 fingerprint of both files immediately
   before running the converter:
   - evidence/05-tokens-incomplete.json
   - evidence/06-tokens-complete.json

2. Run tools/convert-tokens.py.

3. Calculate both fingerprints again after conversion.

4. Fail verification with a clear message and non-zero exit code
   if either source file changed or disappeared.

Keep the existing checks. Do not change the source JSON files or
update expected fingerprints merely to make a failing check pass.

Run verification and report the actual result.
Append this prompt verbatim to docs/prompts.md.

## Step 7 Prompt

Start Task 1, step 7 by building one Kobo Watt account-summary
screen WITHOUT applying the design system yet.

Read docs/business-brief.md and docs/business-decisions.md.
Inspect the existing project and reuse its framework if present.

Show:
- A clearly labelled demonstration account.
- Recorded account-access status, separate from physical power.
- Paid-until date and time, with a last-updated timestamp.
- Remaining purchase balance.
- A payment amount and button.
- Recent payment status.
- The prototype Get help route described in the brief.

Use one internally consistent fictional example. Label all data
as demonstration data. Do not initiate real payments or imply
that hardware is being controlled.

For this first version:
- Use a plain layout, a system font and basic local CSS.
- Do not import styles/tokens.css or styles/typography.css.
- Do not copy values from the design system into the local CSS.
- Preserve the generated design-system files unchanged.
- Keep this temporary baseline styling separate so it can be
  removed when the design system is applied.

Make the screen usable at a phone-sized viewport.
Do not apply the design system in this turn.

Run the screen and report how to open it.
Capture its actual rendered appearance as:
evidence/09-screen-without-system.png

Record the viewport dimensions so the later screenshot uses the
same dimensions, content and account state.
If you cannot capture it, explain how I can capture it.
Do not claim a screenshot exists unless it was created.

Append this prompt verbatim to docs/prompts.md.
Report changed files and checks actually performed.

## Step 7 Prompt: Apply the Design System

Continue Task 1, step 7: apply the Kobo Watt design system
to the existing account-summary screen.

The “without system” screenshot is saved in the evidence folder.
Confirm evidence/09-screen-without-system.png exists before editing.
Do not overwrite it.

Read the design documents and generated CSS.

Keep the same:
- Screen content and demonstration account data.
- Account and payment states.
- Viewport dimensions used for the before screenshot.

Apply styles/tokens.css and styles/typography.css.
Use colour-role variables for interface colours, never raw colours
or primitive palette variables directly.
Use the named typography classes and generated shadow properties.
Load the actual Source Sans Pro font with the matching CSS family name.

Remove the temporary baseline styling when replacing it.
Preserve the source JSON exports and conversion scripts.

Run the screen and check for missing styles, unreadable text,
clipped amounts and horizontal overflow at the comparison viewport.

Capture the rendered result as:
evidence/10-screen-with-system.png

If you cannot capture it, give me the running page URL and the
viewport dimensions so I can capture it myself.

Append this prompt verbatim to docs/prompts.md.
Report which colour roles and typography styles you applied,
the files changed and the checks actually performed.
Do not claim a screenshot or browser check exists unless completed.

## Step 7 Prompt: Raw-Colour Search Evidence

Produce Task 1’s raw-colour search evidence.

Search the entire project for raw colour values, including:
- HEX colours.
- rgb(), rgba(), hsl() and hsla().
- Other CSS colour functions and named CSS colours.

Use a suitable tool available in this project. Record the exact
commands, search scope and exclusions. Include hidden project
source files; exclude Git internals, dependencies and binary files.
Do not limit the search to prototype/screen.css.

Save the exact commands and complete, unedited output to:
evidence/07-raw-value-search.txt

Preserve every match in that evidence, including expected matches
in JSON exports, generated token definitions, documentation and
historical records. Do not hide matches to produce a clean result.

Below the output, explain:
1. Which matches are legitimate source definitions or evidence.
2. Whether any active interface styling bypasses colour roles.
3. Any limits of the search.

If an active interface violation exists, fix it, then append the
new command and full output. Keep the original results.

Also check active HTML, CSS and JavaScript for direct uses of
primitive palette variables or material-theme values.

Append this prompt verbatim to docs/prompts.md.
Do not claim this text search proves every browser state is correct.

## Step 7 Prompt: Typography Trace and Evidence Correction

For Task 1, inspect the “Remaining purchase balance” amount
(₦2,538,180) in prototype/index.html.

Which exact typography style does this element use?

Trace the answer through the HTML class, CSS rule, and typography
tokens. Report its font family, weight, size, line height, and
letter spacing. Cite the relevant file paths and line numbers.

Do not change the design or code.

Save your actual answer in:
evidence/08-agent-typography-answer.txt

Append this prompt verbatim to docs/prompts.md.

Also correct the explanation in evidence/07-raw-value-search.txt:
Command 3 checks primitive and material-theme references only.
Do not describe it as a raw-colour search. Preserve the recorded
commands and their original output.

## Step 8 Prompt: Baseline Commit Preparation

Prepare for Task 1, step 8: the deliberate regression.

Check the Git repository root, current branch, and working-tree status
for Task-01-design-system.

If this folder is not already inside a Git repository, initialise a
repository here. Do not create a nested repository.

Save the completed Task 1 work as a baseline commit, including its
documentation and evidence. Inspect the files before staging; exclude
secrets, dependencies, caches, and temporary files.

If the repository includes unrelated work outside this project,
leave that work untouched.

Report:
- Repository root.
- Current branch.
- Baseline commit ID.
- Any remaining uncommitted project files.

Append this prompt verbatim to docs/prompts.md before committing.

Stop after preparing the baseline. Do not break any colour references,
change the brand colour, or create the experiment branch yet.

## Step 8 Prompt: Deliberate Broken Colour Reference

In docs/defects.md, add a section titled:
“Deliberate regression: broken colour reference”

Preserve any existing content. Add these three sentences:

I replaced the light Primary role’s palette reference with the fixed colour #006B5E, then temporarily changed Primary40 and Primary90 in the CSS palette to purple values. The Active chip followed its Primary Container reference and became pale purple, while the Pay button stayed teal because its Primary role no longer followed the palette. This shows why colour roles should reference the palette: a shared colour change can otherwise leave disconnected parts of the screen behind.

Link the section to:
../evidence/11-broken-referencing.png

State separately that the experiment changed the CSS palette only;
the original Figma file and JSON exports were unchanged.

Append this prompt verbatim to docs/prompts.md.
Do not commit, switch branches, restore files, or delete the branch yet.

## Step 8 Prompt: Preserve Regression Evidence on Main

Preserve the Task 1 experiment evidence on main without merging
the experiment.

Repository root:
C:/Users/LENOVO PC

Project prefix:
OneDrive/Desktop/Task-01-design-system/

Baseline commit:
5ba9467c3ee57f2727e906b05cb0c493b2cfe21c

Experiment commit:
d820faa523f498cd32b74a4c2d190adfa655d129

First verify:
- Current branch is task-01/broken-token-reference.
- HEAD matches the experiment commit.
- The project has no uncommitted changes.
- main still points to the baseline commit.
Stop and explain if any check fails.

Switch to main.

Restore ONLY these three files from the experiment commit:
- OneDrive/Desktop/Task-01-design-system/evidence/11-broken-referencing.png
- OneDrive/Desktop/Task-01-design-system/docs/defects.md
- OneDrive/Desktop/Task-01-design-system/docs/prompts.md

Do not restore styles/tokens.css.
Do not merge or cherry-pick the experiment commit.

Append this prompt verbatim to docs/prompts.md.
Stage only the three exact paths above.
Inspect the staged list before committing.

Commit with this message:
Preserve Task 1 regression evidence without broken styling

Verify:
1. styles/tokens.css matches the baseline commit exactly.
2. The light Primary role references Primary40 again.
3. Both JSON exports match the baseline.
4. The screenshot and explanation remain present.
5. The experiment commit is not an ancestor of main.
   Use git merge-base --is-ancestor and report its exit code:
   1 means it is not an ancestor; other errors must not count as success.

Report the current branch, new commit ID, checks and project status.

Do not delete the experiment branch yet.
Do not stage or modify unrelated home-folder files.

## Step 8 Prompt: Delete Unmerged Experiment Branch and Record Git Evidence

Finish Task 1, step 8: delete the experiment branch without merging it
and save the actual Git evidence.

Run from the repository root:
C:/Users/LENOVO PC

Verify before deletion:
- Current branch is main.
- HEAD is e3cbe4f3ecdc889d1dc4d0974748be7e1e668113.
- The project has no uncommitted changes.
- task-01/broken-token-reference points to:
  d820faa523f498cd32b74a4c2d190adfa655d129
- The screenshot and explanation are preserved on main.
- The experiment commit is not an ancestor of main.

Stop if any check fails.

Create:
OneDrive/Desktop/Task-01-design-system/evidence/12-git-log-branch-unmerged.txt

Record the exact commands, actual outputs and exit codes for:
1. Current branch and HEAD.
2. git log --graph --oneline --decorate --all -n 10
3. git merge-base --is-ancestor
   d820faa523f498cd32b74a4c2d190adfa655d129 main
   Expected exit code: 1, meaning not an ancestor.

Then delete ONLY the local experiment branch:
git branch -D task-01/broken-token-reference

This intentional deletion is authorised because its evidence is
preserved and its broken styling must not be merged.

Append the actual deletion output, then record:
4. git branch --list task-01/broken-token-reference
   Expected: no output.
5. git log --graph --oneline --decorate main -n 10
6. Repeat the ancestry check above.
   Expected exit code: 1.

Do not describe an error as successful proof.
Do not delete files, modify main's styling, merge, or cherry-pick.

Append this prompt verbatim to the project's docs/prompts.md.
Stage only that file and evidence/12-git-log-branch-unmerged.txt,
using their full project-prefixed paths.

Commit with this message:
Record deletion of unmerged Task 1 experiment branch

Report the final commit ID, current branch, project status and
whether the experiment branch is absent.



