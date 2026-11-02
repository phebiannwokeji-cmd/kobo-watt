# Enumeration — Kobo Watt Task 3

## Step 5: Do not leak the shape of sensitive data

### Which field, and why its shape is sensitive

The **phone number** field on the signup form had a placeholder:
`e.g. 08012345678`

This placeholder reveals two things:
1. The number is 11 digits long (the standard Nigerian mobile format).
2. The leading digits are `080` — narrowing the valid prefix range.

Phone numbers in Kobo Watt function as a secondary contact identifier.
They are not used as a password, but they are used for engineer dispatch
and account recovery by support staff. A person who knows the format
of registered phone numbers can construct a targeted enumeration attack:
generate all valid 11-digit Nigerian numbers matching the `080x` prefix
and probe the API to discover which ones have accounts.

The placeholder was removed. The hint now reads:
"Digits only, 10–14 characters. We contact you to schedule engineer visits."

This tells the user what input type to provide (digits) without disclosing
the precise length or prefix pattern that characterises a valid account
identifier.

### What an attacker gains from knowing the shape

If the shape of the phone number is disclosed:

- The attacker knows to try 11-digit numbers starting with known Nigerian
  prefixes (080, 081, 090, 070, etc.). This reduces a brute-force search
  space from ~10^14 possibilities (any digit string up to 14 chars) to
  roughly ~10^8 (all 11-digit numbers with known prefixes).

- The attacker can correlate a phone number against a `POST /api/accounts`
  response to determine whether a person has an account — a user-enumeration
  vulnerability. Kobo Watt's password reset flow already returns a generic
  response to prevent email-based enumeration. Leaking the phone format
  opens a parallel attack surface.

- In a social engineering attack, the attacker who knows the expected
  format of account identifiers can construct more convincing impersonation
  attempts when contacting support.

### The trade-off accepted

Removing the placeholder makes the form harder for legitimate users. A
customer who does not know whether to include the country code, the leading
zero, or dashes will not see an example. They must read the hint ("digits
only, 10–14 characters") and apply it.

**How much harder:** Minor. The hint still explains the required format
without revealing the specific length. Most users understand "digits only"
immediately. Those who are unsure will either try their number and see an
inline error, or read the hint. An inline error on blur ("Phone number must
be 10 to 14 digits — numbers only, no spaces or dashes") gives them
specific guidance without disclosing the exact expected length as a
placeholder would.

**Is it worth it:** Yes. The marginal friction for legitimate users —
reading a sentence rather than copying an example — is small. The security
benefit — preventing shape disclosure that enables enumeration — is
material. The asymmetry favours removing the hint.

