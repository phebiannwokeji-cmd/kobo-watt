# Step 10 — Email verification design

## Code and expiry

The selected lifetime is **7 minutes**. The learner explained:

> I chose a seven-minute expiry for a six-digit email code. Customers need a few minutes to open their email, find the message, come back, and enter the code. Seven minutes allows for slow mobile data or a short interruption without keeping the code usable too long.
>
> A six-digit code has one million possible values, and a shorter expiry leaves less time for an attacker to guess it. Expiry alone isn't enough, so Kobo Watt will also strictly limit verification attempts, make each code single-use, and replace the old code when a new one is sent.
>
> Seven minutes is a starting choice, not a proven perfect number. I'll review it using real delivery delays and support feedback. If customers often get emails late, I'll improve email delivery or add a safe resend process rather than just making codes last much longer.

The code is a zero-padded six-digit decimal value generated with Node's cryptographic `randomInt`, not `Math.random()`. A `VerificationCode` row records the code, account, expiry, use time and failed-attempt count. A code expires after seven minutes, can be used once, and is locked after five wrong attempts. Expired rows should be removed after evidence has been captured; the row stores a short-lived secret, so database access must stay restricted. The local-only `tools/show-verification-code.mjs` script retrieves the row for the exercise; no public endpoint returns the code.

Issuing a replacement code must invalidate earlier active codes for that account. The verification endpoint will compare the submitted code, reject expired or consumed codes, increment the attempt count for incorrect entries, and mark a successful code consumed while setting the account verified and active in one database transaction. Reusing a successful code must fail.

## Delivery and evidence

The implementation uses Nodemailer with SMTP settings from `.env` (template: `.env.example`); credentials must not be committed. Registration queues email through a small in-process background worker, so it can return without waiting on the mail provider. This exercise queue is not durable: a process restart can lose a queued message, and production should use a durable queue with retries. `EMAIL_DELIVERY_MODE=inline` supports the before measurement; `background` is the default. The normal `npm start` command enables Node's system CA store while preserving TLS certificate validation. The first SMTP authentication failure is captured in `evidence/16-smtp-failure.txt`: Gmail returned SMTP response 535 (`Username and Password not accepted`) for the deliberately incorrect test password. Node initially rejected the local certificate chain; using the system CA store addressed trust validation. I corrected the Gmail App Password configuration and verified SMTP authentication before sending another test email. Gmail accepted the verification email for delivery, I received it, I submitted the newest code once, and my read-only database check returned `isVerified: true` and `accountStatus: ACTIVE`. Redacted proof is in `evidence/16-smtp-verification-complete.txt`, `evidence/16-smtp-verification-complete-smtp.png`, and `evidence/16-smtp-verification-complete-active.png`. I excluded the recipient address, App Password, and verification code.
I completed the Step 10 verification tests. For my two local registration runs, inline delivery returned HTTP 201 after 9,849.796 ms, while background delivery returned HTTP 201 after 2,006.297 ms. Both emails were accepted by Gmail after the SMTP connection was available. The inline result was 7,843.499 ms slower in these runs. This is a local comparison of two individual runs, not a prediction of production performance.

I captured a verification-code row without exposing its code. It showed the account and verification-row IDs, created time, expiry time, used time, and attempt count. I also proved that an expired code returned HTTP 400, a wrong code returned HTTP 400, a valid code returned HTTP 200 and activated the account, and reusing that same code returned HTTP 400.

The routes are `POST /api/email-verifications` and `POST /api/email-verifications/resend`. Verification has a 30-per-IP 15-minute limiter plus a five-wrong-attempt cap on each code; resends are limited to five per IP per 15 minutes and replace earlier active codes. The evidence is `18-registration-timing-sync-vs-job.txt`, `19-verification-row.png`, `20-verification-expired.png`, `21-verification-wrong-code.png`, and `22-verification-code-reused.png`. I kept the email address, App Password, and six-digit code out of all evidence.

## Attack note

The learner's attack note is captured in the expiry explanation above. The per-code attempt limit is separate from IP rate limiting because an attacker could distribute requests across IP addresses.
