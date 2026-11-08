# Step 5 — Email normalization and password trimming

## Behavior

- Email inputs are trimmed and lowercased during registration, login, and password reset lookup.
- Passwords are trimmed of leading and trailing whitespace before hashing and verification. Their letter case is preserved.
- Registration hashes the trimmed password with bcrypt cost 12. Login verifies it with `bcrypt.compare` and then requires the account's email to be verified before allowing sign-in.

The shared functions live in `src/normalization.js`; the three request handlers are in `server.js`. The server binds to `127.0.0.1` and uses the Task 4 SQLite database.

## Required machine evidence

Run the server, then from a second PowerShell terminal in this folder capture the registration and login responses with:

```powershell
node tools/prove-normalization.mjs 2>&1 | Tee-Object -FilePath evidence/09-normalization.txt
```

The script creates unique test emails, uses temporary demo passwords, and deliberately omits password values from its output. Each new test account is unverified. For that reason, a current proof expects HTTP 201 for registration and HTTP 403 with `Verify your email before signing in.` after the correct login details are checked. The 403 response happens after the normalized email lookup and bcrypt password comparison, so it proves those normalization steps succeeded while the later verification control correctly blocks the session.

The two required cases are:

1. Register with an email containing uppercase letters, then submit the same email in lowercase with the same password. The request must reach the email-verification gate.
2. Register another account with a password ending in a space, then submit that password without the trailing space. The request must reach the email-verification gate.

Historical evidence was captured on 2026-11-04 at 08:42:17 UTC, before email verification was added. Both registrations returned HTTP 201 (account IDs 2 and 3), and both logins returned HTTP 200. That original terminal record remains unchanged in `evidence/09-normalization.txt`.

After email verification was added, I updated the proof's expected sign-in result to HTTP 403 for new unverified test accounts. I will capture the current Case 1 and Case 2 results separately as `evidence/09-email-case-normalised.png` and `evidence/10-password-trim-working.png`. I will not describe the 403 response as a failed normalization test: it is the correct later security gate.

## Learner explanation

The learner's explanation:

> I remove spaces from the beginning and end of passwords. When people copy a password, they often pick up an extra space they can't see. No one would add an invisible character there on purpose.
>
> I don't change capital letters to lowercase, because capitals are part of the secret the user picked. If I ignored the difference between upper and lower case, different passwords would count as the same, and that would make it easier to guess.
