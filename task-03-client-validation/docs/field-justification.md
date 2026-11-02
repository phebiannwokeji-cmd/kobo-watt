# Field Justification — Kobo Watt Task 3

For each field on the signup form, three questions are answered:
1. Why is it needed?
2. What does the business do with it?
3. What happens if the user gets it wrong?

Any field that fails all three is removed. Fields that remain are listed below.

---

## 1. Full name

**Why it is needed:**  
Kobo Watt installs and services inverter systems under signed service
agreements. The customer's legal name appears on the agreement, the
warranty certificate, and any invoice. Without a real name there is no
enforceable contract.

**What the business does with it:**  
Printed on service agreements, warranty certificates, and correspondence
with engineers dispatched to the site. Cross-referenced against ID for
premium support tiers.

**What happens if the user gets it wrong:**  
A customer who registers as "a" or "test" cannot be identified when an
engineer arrives on site. Their warranty certificate cannot be issued.
If a dispute arises the contract is not enforceable.

**Validation rule derived:**  
Minimum 2 characters; at least two words (one space). A single token
(one word, no space) is assumed to be a bot or a placeholder.

**Legitimate user wrongly blocked:**  
People who use a single legal name (mononymous) — found in parts of
Nigeria, Indonesia, and Iceland. Workaround: enter the single name
twice, e.g. "Hauwa Hauwa". This is an imperfect compromise that is
acknowledged and documented.

---

## 2. Phone number

**Why it is needed:**  
Kobo Watt's primary contact channel for scheduling engineer visits is
voice call and SMS. Email is secondary. Without a phone number no
engineer dispatch is possible.

**What the business does with it:**  
Engineers call to confirm arrival time. Automated SMS is sent when a
service appointment is confirmed or rescheduled.

**What happens if the user gets it wrong:**  
Engineer cannot reach the customer to confirm attendance. Trip is made
to an empty site. Revenue lost. Customer receives no appointment
confirmation.

**Validation rule derived:**  
10–14 digits, numbers only. Nigerian mobile numbers (080x, 081x, 090x)
are 11 digits. International format (+234…) reaches 13–14 digits when
the leading zero is replaced by the country code.

**Legitimate user wrongly blocked:**  
Users with extensions (e.g. corporate landlines: +1 800 555 1234 x999).
Extensions are stripped on entry — the user is told to omit the extension.
This is acceptable because Kobo Watt does not call extensions.

**Why type="text" not type="number":**  
A `<input type="number">` shows a default value of 0 and spinner arrows.
Correcting an entry requires: clear the field → field reverts to 0 →
type the number → it may be prefixed with 0 → go back and delete the 0.
A `<input type="text" inputmode="numeric" pattern="[0-9]{10,14}">` shows
no default, no spinners, and accepts exactly what the user types. The
value is converted to a number with `Number()` before it reaches the server.

---

## 3. Email address

**Why it is needed:**  
Primary channel for invoices, warranty confirmation, account recovery,
and service updates. Also used as the unique account identifier.

**What the business does with it:**  
Invoice PDF is emailed after each service visit. Warranty certificate is
emailed after installation. Account recovery link is emailed when the
password is lost.

**What happens if the user gets it wrong:**  
A typo in the email address means the user cannot receive invoices, cannot
recover their account, and may not know their warranty is active. A
misspelled email is silently lost — the business has no way to correct it.

**Validation rule derived:**  
Format: at least one non-whitespace non-@ character, then @, then at
least one non-whitespace non-@ character, then a dot, then at least one
non-whitespace non-@ character. Applied in real-time on signup; on submit
only on login.

**Legitimate user wrongly blocked:**  
No legitimate email address fails this pattern. The RFC allows extremely
unusual addresses (e.g. `"quoted string"@example.com`) that may fail the
check — but these represent fewer than 0.01% of real-world addresses and
the practical trade-off is accepted.

**Why we do not check existence:**  
Checking whether an email address exists requires querying the
recipient's mail server (an MX lookup followed by an SMTP probe), which
browsers cannot do, and which most mail servers actively block. Even if
it were possible, it reveals to an attacker which email addresses have
accounts — a user-enumeration vulnerability. Ownership is proved by
sending a code to the address; that is the correct and sufficient check.

---

## 4. Service address

**Why it is needed:**  
Kobo Watt dispatches engineers to the physical location where the
inverter is installed. Without a service address no engineer can be sent.
The address is also required for warranty coverage — many manufacturers
tie warranty to the installation address.

**What the business does with it:**  
Given to the field engineer. Stored on the service agreement. Used for
warranty registration with the inverter manufacturer.

**What happens if the user gets it wrong:**  
Engineer is sent to a wrong or non-existent address — wasted trip, fuel
cost, scheduling disruption. Manufacturer may refuse warranty claim if
address does not match.

**Validation rule derived:**  
Minimum 10 characters. No Nigerian street address (e.g. "3 Oba Ave") is
under 7 characters; 10 is conservative enough to block "a" or "test" while
accepting the shortest realistic addresses.

**Legitimate user wrongly blocked:**  
Edge case: a very short address such as a grid reference or landmark
reference (e.g. "Plot 5A") might be under 10 characters. Workaround:
user adds neighbourhood or LGA to reach 10 characters. Accepted cost.

---

## 5. Password

**Why it is needed:**  
Authenticates the account owner. Without a password, any person who
knows the email address can access service history, reschedule
appointments, or access invoice records.

**What the business does with it:**  
Stored as a bcrypt hash (Task 4). Never transmitted back to the client.
Used only to verify identity on login.

**What happens if the user gets it wrong:**  
A password that is too short is cracked offline if the database is
compromised. A password of all spaces passes the character count but
provides no entropy — it would be in any wordlist.

**Validation rule derived:**  
Minimum 12 characters. No all-whitespace passwords. No maximum complexity
requirement (length is sufficient per NIST SP 800-63B). Maximum 128
characters (prevents denial-of-service via bcrypt with extremely long inputs).

**Legitimate user wrongly blocked:**  
Users with cognitive impairments or memory difficulties who rely on short
simple passwords. Mitigated by: password-visibility toggle so the user
can verify what they typed, and a clear error message explaining the
minimum.

**Toggle vs confirm field:**  
A visibility toggle is offered rather than a confirm field. A confirm
field requires the user to type a long password twice — on mobile this
is particularly punishing. In a banking or health context where screen
access by a bystander is a real risk, the confirm field is the better
choice because the toggle makes the password briefly visible.

---

## 6. Terms and conditions acceptance

**Why it is needed:**  
Kobo Watt collects personal data (name, address, phone) and takes
money for services. Under Nigerian data protection law (NDPR) and basic
contract law, collecting this data without informed consent creates
legal liability. Acceptance is not optional.

**What the business does with it:**  
Records the timestamp of acceptance (stored alongside the account row).
Provides legal basis for storing and processing personal data.

**What happens if the user gets it wrong:**  
If the user submits without accepting, no account is created. This is
enforced on both client and server.

**Legitimate user wrongly blocked:**  
Users who cannot or will not accept the terms cannot use the service.
This is intentional — the terms are a legal prerequisite, not a courtesy.

---

## Fields removed

No field was removed from this list. The agent-generated scaffold
initially included a "referral code" field. It was removed because:
- The business has no referral programme yet.
- It fails question 2: the business does nothing with it.
- Collecting data with no defined use is a NDPR violation.

