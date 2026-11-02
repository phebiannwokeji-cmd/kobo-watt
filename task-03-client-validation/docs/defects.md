# Defects and Limitations — Kobo Watt Task 3

This document candidly lists the known architectural, security, and user experience limitations present in the Task 3 codebase. Stating defects plainly is a requirement of the assessment.

---

## 1. Defect: Plain-Text Password Storage on Server
- **Location:** `server.js` (`POST /api/accounts`)
- **Severity:** High (Security)
- **Description:** When an account is created, the plain-text password from the HTTP body is directly bound to the `password_hash` column of the SQLite database. If the database file is compromised or read via an unauthorized process, all passwords are immediately exposed.
- **Why it exists in Task 3:** Task 3 is strictly scoped to single-page form architecture, client-side validation, and accessible error handling. Cryptographic password hashing (bcrypt with adaptive salt rounds) is explicitly scheduled for Task 4.
- **Remediation in Task 4:** Integrate `bcrypt` to hash incoming passwords with a cost factor of 12 prior to database insertion.

---

## 2. Defect: Zero Server-Side Validation on Endpoint
- **Location:** `server.js` (`POST /api/accounts`)
- **Severity:** High (Integrity / Security)
- **Description:** The `POST /api/accounts` endpoint only checks that fields are truthy strings. It does not validate character lengths, regex patterns, email structure, or terms acceptance. A direct curl request with `{"name":"x","phone":"1","email":"not-an-email","address":"abc","password":"weak","terms":false}` is accepted with HTTP 201 Created.
- **Why it exists in Task 3:** This defect was deliberately left in place to prove Step 8: client-side validation provides zero security boundary against an attacker who bypasses the browser.
- **Remediation in Task 4:** Implement server-side validation middleware replicating all constraints independently before executing SQL transactions.

---

## 3. Defect: Mononymous User Name Inflexibility
- **Location:** `public/assets/auth.js` (`validateName`)
- **Severity:** Medium (Accessibility / Inclusion)
- **Description:** The full name validation rule requires at least one space character separating two tokens. Users with a single legal name (common in parts of Northern Nigeria, Indonesia, and elsewhere) are wrongly blocked from registering unless they input their single name twice (e.g. "Hauwa Hauwa").
- **Mitigation:** The inline hint explains this workaround, but a robust production schema should decouple display name from legal name or allow single-token legal names with an optional confirmation toggle.

---

## 4. Defect: Absence of Endpoint Rate Limiting
- **Location:** `server.js` (`POST /api/accounts`, `POST /api/sessions`)
- **Severity:** Medium (Availability / Anti-Abuse)
- **Description:** The authentication endpoints lack IP or token-bucket rate limiting. An automated bot can issue hundreds of registration or login attempts per minute, exhausting database file locks or brute-forcing accounts.
- **Remediation in Task 4:** Add Express rate limiting middleware (`express-rate-limit`) to restrict endpoints to 10 requests per minute per IP address.

---

## 5. Defect: No Out-of-Band Email Verification (SMTP)
- **Location:** `public/assets/auth.js` / `server.js`
- **Severity:** Low (Operational)
- **Description:** The signup process confirms syntax format (`string@domain.tld`) but does not issue an activation link or numeric PIN to the inbox. Accounts are marked active immediately. If a typo enters the system, the user is locked out without recourse.
- **Remediation in Task 4/5:** Implement token-based email activation workflow.
