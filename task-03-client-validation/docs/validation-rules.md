# Validation Rules — Kobo Watt Task 3

Each rule states: what the rule is, what breaks without it, and who it
wrongly blocks. The third column is required for every rule.

---

## Signup form rules

### Rule 1: Full name — required, non-empty

**The rule:** The field must not be blank or whitespace-only.

**What breaks without it:** Accounts created with no name cannot be
identified when an engineer arrives. Service agreements cannot be
generated. The customer has no legal standing in a dispute.

**Who it wrongly blocks:** Nobody. Every person who intends to use Kobo
Watt's services has a name. A blank name is not a legitimate entry.

---

### Rule 2: Full name — minimum two words (one space)

**The rule:** The value must contain at least one whitespace character
separating at least two word-like segments.

**What breaks without it:** Bots and automated tools fill name fields
with single tokens: "a", "test", "user1234". These are not names and
cannot appear on service agreements or warranty certificates. Without
this rule, automated signups produce hundreds of unusable accounts
(the scenario described in the task specification).

**Who it wrongly blocks:** People who use a single legal name (mononymous
users). In Nigeria this is uncommon but not rare — some individuals from
certain communities have a single legal name. The workaround offered is
to enter the single name twice (e.g. "Emeka Emeka"). This is an imperfect
solution that requires explanation on the form. The cost is accepted
because the alternative — allowing single-token names — creates a
compliance failure at scale.

---

### Rule 3: Phone number — 10 to 14 digits, no non-digit characters

**The rule:** The value must match `^[0-9]{10,14}$`.

**What breaks without it:** A single-digit entry ("1") or a 20-digit
entry breaks the SMS dispatch system. Spaces, dashes, and brackets in
phone numbers fail most downstream API validators used by Nigerian
telecoms providers. Without bounds, a bot can fill the field with a
single character and create an account with an uncontactable phone number.

**Who it wrongly blocks:** Users who write their phone number with spaces
or dashes (e.g. "080 1234 5678"). The error message explains the required
format (digits only, 10–14 characters). Users with extensions cannot use
their full number — they are asked to omit the extension. Overseas users
with numbers outside the 10–14 digit range (rare for a Lagos-based
service) may be blocked; this is accepted because Kobo Watt does not
currently operate outside Nigeria.

---

### Rule 4: Email — format check (string@string.string)

**The rule:** The value must contain exactly one @ symbol with non-whitespace
characters on both sides and a dot after the @ segment.

**What breaks without it:** Addresses typed without an @ ("noemail"),
with no domain ("user@"), or with no TLD ("user@domain") are undeliverable.
Invoices and account recovery emails sent to these addresses are silently
lost.

**Who it wrongly blocks:** In theory, quoted local-part addresses
(`"user name"@example.com`) could fail the check. In practice these
represent fewer than 0.01% of real-world addresses and no Kobo Watt
customer has ever used one. Cost accepted.

**Why checking whether an email exists is pointless:**
Checking whether a mailbox exists would require live SMTP handshakes that most mail servers deliberately reject, tarpit, or spoof with false-positive accepts to defeat spam harvesters. Furthermore, even if an address exists on the mail server, an existence check cannot prove that the person filling the form actually owns or controls that inbox; only an out-of-band verification code or magic link proves legitimate possession.

---

### Rule 5: Email — real-time on signup, submit-only on login

**The rule:** On the signup form, email format is validated on each
keystroke (`input` event). On the login form, it is validated only
when the form is submitted.

**What breaks without it:** On signup, validating only on submit means
a user who misspells their email discovers the error only after filling
in all other fields — a frustrating experience that leads to abandonment.
On login, real-time format checking is intrusive — a user typing their
address naturally sees an error mid-word ("not a valid email") before they
have finished. This is irritating without being useful.

**Who it wrongly blocks:** Nobody. The two-behaviour approach is more
helpful for both paths. On login, the check still happens; it just happens
when the user submits rather than while they type.

---

### Rule 6: Service address — minimum 10 characters

**The rule:** The trimmed value must be at least 10 characters long.

**What breaks without it:** A single character ("a") or a placeholder
("test") produces a service record with no usable address. The engineer
cannot be dispatched.

**Who it wrongly blocks:** A user with a genuinely short address (e.g.
"Plot 5A") would need to add neighbourhood or LGA to reach 10 characters.
The error message suggests this. The cost is minor friction for a rare
edge case.

---

### Rule 7: Password — minimum 12 characters

**The rule:** The password must be at least 12 characters.

**What breaks without it:** Short passwords are cracked offline in
seconds if the database is compromised. The most common breached passwords
are 6–8 characters long. At 8 characters and below, even bcrypt hashing
provides limited protection against a GPU-accelerated dictionary attack.

**Who it wrongly blocks:** Users who find long passwords difficult to
remember or type — including users with cognitive impairments, users on
slow keyboards, and users who share devices. The visibility toggle mitigates
this by allowing the user to confirm what they typed. The error message
explains why length matters. Cost accepted; 12 is the minimum recommended
by NIST SP 800-63B for memorised secrets.

---

### Rule 8: Password — no all-whitespace values

**The rule:** A password whose `trim()` result is an empty string is
rejected with a specific message ("Password cannot be only spaces").

**What breaks without it:** A password of 12 spaces passes the length
check. It provides zero entropy — it is not in wordlists only because it
is too trivial to bother including. Any brute-force tool would try it
immediately.

**Who it wrongly blocks:** Nobody intentionally uses a password of spaces.
This is a technical edge case rather than a user-experience trade-off.

---

### Rule 9: Terms acceptance — required

**The rule:** The terms checkbox must be checked before the account is
created.

**What breaks without it:** The business collects personal data without
the user's informed consent, creating liability under the NDPR 2019.
There is no legal basis for processing or storing the data.

**Who it wrongly blocks:** Users who decline the terms cannot create an
account. This is intentional — the terms are a legal prerequisite. The
business cannot serve a user who has not consented to data collection
under current Nigerian data protection law.

