# Step 7 — Enforcing Task 3 rules on the server

The request schemas in `src/validation.js` enforce the same data constraints that Task 3 presented to users. They run before any account lookup, password hash, or database write.

| Task 3 client rule | Task 4 server enforcement |
| --- | --- |
| Full name required, at least 2 characters, and includes whitespace between words | Trimmed string, 2–100 characters, contains whitespace |
| Phone required, 10–14 digits only | Trimmed string matching `^[0-9]{10,14}$` |
| Email required and shaped like `text@text.text` | Trimmed string matching the same Task 3 pattern; 254-character maximum |
| Address required and at least 10 characters | Trimmed string, 10–200 characters |
| Registration password at least 12 characters and not whitespace-only | Password is trimmed first, then must be 12–128 characters; password case is preserved |
| Login password required; field maximum 128 characters | Trimmed string, 1–128 characters; case preserved |
| Terms checkbox must be accepted | Registration schema requires the literal boolean `true` |
| Unknown request fields are not part of any form payload | Strict Zod objects reject unknown keys |

Task 3 checks email formatting continuously while typing on signup and only on submit for login/reset. That timing is browser behavior and cannot be transmitted as a security rule. Task 4 checks the same email shape on every request that accepts an email.

The Task 3 email pattern deliberately accepts forms such as `a@b.c`; server validation matches that rule rather than silently introducing a stricter one. It checks syntax, not whether the address exists or belongs to the user.

## Direct attack replay

`tools/repeat-task3-attack.mjs` resends the exact invalid JSON request recorded in Task 3. Capture its Task 4 response in `evidence/11-task3-attack-vs-task4.txt` using:

```powershell
node tools/repeat-task3-attack.mjs 2>&1 | Tee-Object -FilePath evidence/11-task3-attack-vs-task4.txt
```

Captured 2026-11-04 at 09:58:01 UTC. The original Task 3 request returned HTTP 201 with account ID 1. The same JSON sent to Task 4 returned HTTP 400 with issues for the name, phone, email, address, password, and terms fields. Full output is in `evidence/11-task3-attack-vs-task4.txt`.
