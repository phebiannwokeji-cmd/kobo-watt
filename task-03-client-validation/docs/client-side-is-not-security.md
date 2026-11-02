# Client-Side Validation is Not Security — Kobo Watt Task 3

## 1. The Direct Request and Server Outcome

To investigate whether client-side validation provides any defensive boundary, a crafted HTTP POST request was dispatched directly from the command line using PowerShell (`Invoke-RestMethod`) and `curl`, targeting `http://127.0.0.1:3001/api/accounts`.

The transmitted JSON payload contained intentionally malformed and non-compliant data across every single field:
```json
{
  "name": "x",
  "phone": "1",
  "email": "not-an-email",
  "address": "abc",
  "password": "weak",
  "terms": false
}
```

### What the Server Did
The server accepted the request immediately without protest. It returned an **HTTP 201 Created** status with payload `{"id": 1}`. 

An inspection of the local SQLite database (`data/kobo-watt-03.db`) revealed that row `id = 1` was permanently committed to the `accounts` table:
- `name` was stored as `"x"`
- `phone` was stored as `"1"`
- `email` was stored as `"not-an-email"`
- `address` was stored as `"abc"`
- `password_hash` was stored in plain-text as `"weak"`
- `terms_accepted` was stored as `0`

The server accepted an account with an invalid name, an unreachable telephone number, an unrouteable email address, an unserviceable location, an unsafe 4-character password, and explicit refusal of legal terms.

---

## 2. Enforcement Audit: Which Client-Side Rules Were Enforced?

**Exactly zero.** None of the client-side rules authored in `auth.js` were enforced by the server.

A systematic audit demonstrates how each rule evaporated:
1. **Rule 1 (Name required & non-empty):** Evaluated in browser only. The server saw `"x"` as non-empty.
2. **Rule 2 (Name at least two words with space):** Evaluated in browser only. The server executed zero whitespace or token checks.
3. **Rule 3 (Phone 10–14 numeric digits):** Evaluated in browser only. The server accepted single character `"1"`.
4. **Rule 4 (Email RFC structure):** Evaluated in browser only. The server ran no regex or structure validation.
5. **Rule 5 (Email real-time vs. submit-time check):** A browser-specific timing heuristic that does not exist at the HTTP transport layer.
6. **Rule 6 (Address min 10 characters):** Evaluated in browser only. The server accepted 3 characters (`"abc"`).
7. **Rule 7 (Password min 12 characters):** Evaluated in browser only. The server accepted 4 characters (`"weak"`).
8. **Rule 8 (Password no whitespace-only):** Evaluated in browser only. Not tested by server.
9. **Rule 9 (Mandatory terms acceptance):** Evaluated in browser only. The client disables the button when unchecked; the server happily inserted `terms_accepted = 0`.

---

## 3. What This Proves About Client Validation and Security

This experiment exposes the foundational truth of web systems architecture:
**Client-side validation is a user experience enhancement, never a security boundary.**

The browser environment is completely controlled by the user or an attacker:
- An attacker does not render your HTML, does not load your CSS, does not execute your JavaScript, and does not click your buttons.
- An attacker communicates with your application using HTTP requests (`curl`, Postman, Python scripts, automated botnets).
- A disabled button (`<button disabled>`) prevents a cooperative human using a mouse from clicking; it provides zero resistance against an HTTP POST dispatched directly to the socket.

Developers who rely on client-side regex, disabled buttons, or frontend sanitisation to protect their database are operating under an illusion of security. Any check performed on the client is purely advisory—it saves legitimate users from round-trip latency when correcting typos, but offers zero defense against malicious actors or automated tools.

---

## 4. Remediation: What Will Be Done in Task 4

In Task 4, security and data integrity will be placed where they actually belong: inside the server-side request pipeline.

Specifically, Task 4 will implement:
1. **Independent Server-Side Validation:** Every constraint verified on the frontend (name structure, phone digit boundaries, email formatting, address length, password length) will be re-enforced within the Express route handler before any database write occurs.
2. **Strict Request Body Validation:** Rejecting requests with unexpected fields or invalid types with HTTP 400 Bad Request.
3. **Cryptographic Password Hashing:** Replacing plain-text storage with salted bcrypt hashes with an adaptive work factor (cost 12).
4. **Legal Terms Enforcement:** Rejecting account creation unconditionally with HTTP 422 if `terms !== true`.
5. **Rate Limiting & Abuse Prevention:** Adding IP and subnet-level rate limiting on `POST /api/accounts` and `POST /api/sessions` to prevent brute-force attacks and automated registration flooding.
