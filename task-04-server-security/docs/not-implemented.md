# Step 12 — Security controls I chose not to implement yet

I considered the controls below. I did not leave them out because they are unimportant. I left them out because Kobo Watt is still a small assessment prototype, with a local database and no real customers, payments, or production infrastructure.

## 1. Multi-factor authentication or passkeys

This would require a customer to prove identity with a second factor, such as an authenticator-app code, a passkey, or a security key.

I did not add it at this stage because it would add a difficult recovery path for customers who lose a phone or change devices. Kobo Watt does not yet have a real support team or a safe account-recovery process.

I would add it when Kobo Watt has real customer accounts, payment history, and support staff who can safely help customers recover access.

## 2. CAPTCHA or another bot challenge

A CAPTCHA asks a user to complete a challenge before creating an account, signing in, or requesting a reset. It helps reduce automated account creation and repeated attacks.

I did not add it because the current server already has small per-IP limits for registration, login, password reset, and verification. A CAPTCHA service would add an external dependency, accessibility concerns, privacy questions, and extra work for legitimate customers.

I would add it if registration or reset traffic showed automated abuse that the current rate limits could not control.

## 3. A shared rate-limit store

A shared store, such as Redis, lets every server use the same rate-limit counter. It prevents an attacker from avoiding an in-memory limit by reaching a different server.

I did not add it because this prototype runs as one local Node server. Its in-memory counters are enough to demonstrate the rule on one machine, but they would not be reliable across several servers or after a restart.

I would add a shared store before deploying more than one application server or placing Kobo Watt behind a load balancer.

## 4. Device and unusual-sign-in detection

This control records a device or session pattern and warns a customer when a sign-in appears from a new device, unusual location, or suspicious sequence of attempts.

I did not add it because Kobo Watt has not yet implemented the full session lifecycle, customer-facing account settings, or a trusted notification and recovery route. A warning that the customer cannot understand or act on would not be useful.

I would add it after the session and account-management work is complete, especially when customers can view payment history or change important account details.

## 5. Encryption at rest with managed keys

Encryption at rest protects stored database files if a disk or backup is copied. Managed keys means a dedicated service controls key storage, rotation, and access.

I did not add it because the assessment uses a local SQLite database on one development machine. Adding encryption without a proper key-management process could create a false sense of safety or make recovery impossible.

I would add it before storing real customer contact details, payment records, or production backups.