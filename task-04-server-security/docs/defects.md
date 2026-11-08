# Task 4 — Defects and limitations found

I found the following problems while testing Task 4. I recorded them instead of hiding them. The prototype is an assessment exercise and is not ready for production use.

## 1. Verification codes are stored as plain text

**What I found:** The `verification_codes.code` column stores the six-digit code itself.

**Failure scenario:** If somebody copies the database while a code is still active, they can read the code and use it before it expires.

**Severity:** High for a production system.

**Better alternative:** I would store a keyed hash of the code instead of the code itself. The secret key would stay outside the database. The server would hash the submitted code and compare hashes. Rate limits, the seven-minute expiry, and single-use checks would remain.

**Current status:** Not fixed in this assessment version because the completed evidence tools inspect the local test code directly. This must be fixed before Kobo Watt stores real customer accounts.

## 2. Inline registration can return success after SMTP delivery fails

**What I found:** In `EMAIL_DELIVERY_MODE=inline`, the server catches a mail-delivery error and still returns HTTP 201 after saving the account.

**Failure scenario:** A customer creates an account while Gmail or DNS is unavailable. The application says registration succeeded, but the customer receives no verification code and cannot finish verification.

**Severity:** High for registration reliability and customer trust.

**Better alternative:** In inline mode, the server should return a clear temporary failure when email delivery fails, or it should use a durable email job with retries and a visible “verification email pending” state.

**Current status:** I observed a real DNS timeout during testing, followed by an HTTP 201 registration result. I also captured successful SMTP delivery after the connection recovered.

## 3. The background email queue is not durable

**What I found:** The background sender uses an in-process `setImmediate` job.

**Failure scenario:** If the Node server restarts after registration but before the job runs, the verification email can be lost. The account remains pending verification.

**Severity:** Medium now; high when real customers depend on the service.

**Better alternative:** I would use a durable queue with stored jobs, retry rules, monitoring, and a dead-letter queue for repeated failures.

**Current status:** This is inferred from the implementation. I did not simulate a server crash during a real customer flow.