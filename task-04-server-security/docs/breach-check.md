# Step 9 — Breached-password screening

## Service and implementation

Registration checks passwords against the Have I Been Pwned (HIBP) Pwned Passwords range API. The API is free and needs no API key. The check runs after Zod validation and password trimming, but before bcrypt hashing and before creating an account. Login and password reset do not make this check.

The server hashes the candidate locally with SHA-1 solely to form the service's lookup key. It sends the first five hexadecimal characters to `/range/{prefix}` with `Add-Padding: true` and an identifying `User-Agent`. HIBP returns suffixes and counts for that prefix; the server compares the remaining 35 characters locally and rejects a matching entry only when its count is greater than zero. Padded rows have count zero and are ignored. Bcrypt remains the only password hashing method used for storage.

The service never receives the password or its complete SHA-1 hash from this application. The prefix narrows the lookup to a group of possible hashes; adding response padding makes response size less useful for distinguishing which prefix was queried. This is a privacy improvement, not a claim that an external service learns nothing: HIBP receives the prefix and the server's network request metadata.

If HIBP is unavailable or returns an error, registration fails closed with HTTP 503 and no account is stored. This avoids accepting a known-breached password during an outage; the cost is that new registrations temporarily depend on the external service.

## Naive implementation to avoid

Do not send the plaintext password, email, full SHA-1 hash, bcrypt hash, or candidate password in logs to the service. Sending the plaintext exposes a reusable credential to an outside service and any logs, telemetry, or compromised infrastructure it controls. Sending the full SHA-1 hash still gives the service a stable, rapidly searchable fingerprint that can be matched against wordlists. The range approach sends only a short prefix and completes the match locally.

## Evidence

The disposable demo password `Password123456` was confirmed in Pwned Passwords with an occurrence count of 42,513 using its SHA-1 prefix only. The learner ran `node tools/prove-breached-password.mjs` against the local Task 4 server; it returned the expected HTTP 422 response. The captured output is in `evidence/14-breached-password-rejected.txt`. The script deliberately omits the password from its output and uses a unique test email.

## Learner explanation

The learner explained: “I use the HIBP range check so Kobo Watt never sends a customer’s real password to HIBP, or even the full hash of it.

Here is how it works. Kobo Watt turns the password into a SHA-1 hash, which is a scrambled string of characters. It then sends HIBP only the first five characters of that hash.
HIBP replies with a list of all the hash endings that start with those same five characters. Kobo Watt checks the rest of its own hash against that list on its own system. If one matches, the password has been leaked in a data breach before, so Kobo Watt rejects it.
This approach is safer for a few reasons:
- Sending the real password would give a customer’s secret to another service.
- Sending the full hash would give a unique fingerprint that someone could test against guessed passwords.
- Sending just five characters means HIBP learns very little about the actual password.”

## Source

[HIBP Pwned Passwords API documentation](https://haveibeenpwned.com/API/v3) and [Pwned Passwords privacy explanation](https://haveibeenpwned.com/Passwords).
