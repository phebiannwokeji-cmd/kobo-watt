# Task 4 final walkthrough note

I use this short walkthrough to explain the security checks I completed. It points to the captured records; it does not replace them.

1. I register a fictional account. The server validates the request before it writes an account, checks the password against breached-password data, then stores a bcrypt hash rather than the password itself. The schema and initial database state are recorded in `01-schema-drawing.jpg`, `02-database-state-before.png`, and `03-initial-migration.txt`.
2. I show that the server normalizes an email address and trims outer password spaces. A current new account reaches HTTP 403 after valid credentials because email verification is now a required later gate, not because normalization failed. See `09-email-case-normalised.png` and `10-password-trim-working.png`.
3. I show that repeated registration, login, and reset requests receive HTTP 429 after their separate limits are reached. See `13-rate-limit-triggered.png`.
4. I show that a known-breached password is rejected with HTTP 422 before account creation. The captured proof keeps the test password out of the output. See `15-breach-check-rejection.png`.
5. I register a fictional account, receive its verification email, submit the newest code once, and confirm that the account becomes verified and active. The SMTP acceptance, redacted result, and database-state proof are in `16-smtp-verification-complete.txt`, `16-smtp-verification-complete-smtp.png`, `16-smtp-verification-complete-active.png`, and `19-verification-row.png`.
6. I also show that expired, incorrect, and reused verification codes fail. See `20-verification-expired.png`, `21-verification-wrong-code.png`, and `22-verification-code-reused.png`.

I do not include an App Password, a real email address, a verification code, or a password in this note. The controls reduce risk, but they do not make Kobo Watt ready for production without the limitations recorded in `docs/defects.md` and `docs/not-implemented.md` being addressed.
