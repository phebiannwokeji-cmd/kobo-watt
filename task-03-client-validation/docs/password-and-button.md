# Password Rules and the Button — Kobo Watt Task 3

## 1. Password Design Rationale

### Minimum 12 Characters (Length Beats Complexity)
Kobo Watt enforces a strict 12-character minimum password rule without arbitrary character-set complexity mandates (such as requiring mixed-case letters, digits, and special symbols).

This choice is grounded in **NIST SP 800-63B (Digital Identity Guidelines: Authentication and Lifecycle Management)**:
- Arbitrary composition rules encourage predictable, formulaic user substitutions (e.g. converting `password` to `P@ssw0rd1!`), which automated cracking tools test in their earliest dictionary rounds.
- Raw character length expands the search space exponentially ($\text{keyspace} \approx 95^L$). A 12-character passphrase constructed from everyday words provides over 75 bits of entropy, rendering offline dictionary and brute-force attacks infeasible even against multi-GPU clusters.
- The maximum length is capped at 128 characters to protect server-side password hashing (bcrypt) against Denial-of-Service (DoS) attacks exploiting excessive compute latency on multi-kilobyte strings.

### Dynamic Requirements Hint
The requirements hint (*"At least 12 characters. Length matters more than symbols."*) is suppressed on page load and dynamically revealed only once the user begins typing into the password input. Showing persistent validation rule checklists by default adds cognitive clutter and visual noise before the user has even engaged with the form. Revealing guidance in real time provides contextual support exactly when needed.

### Visibility Toggle vs. Confirm Password Field
Kobo Watt provides an interactive **Show/Hide visibility toggle** (`<button type="button" class="kw-toggle-pw">`) rather than a redundant "Confirm Password" input field:
- **Why chosen for Kobo Watt:** Customers in Ikeja frequently access solar management portals on mobile devices with high screen latency and virtual touch keyboards. Asking users on mobile keyboards to type a 12-character passphrase twice increases friction and abandonment rates due to minor touch typos. A toggle allows the user to inspect and confirm their input directly before submission.
- **Why Confirm Field is better in stricter industries:** In high-consequence sectors such as online banking, financial transfers, or healthcare, a "Confirm Password" input is preferred. In physical bank branches, public cafes, or clinical environments, displaying plain-text credentials on screen creates acute shoulder-surfing vulnerabilities where bystanders or surveillance cameras can compromise sensitive credentials.

---

## 2. The Submit Button: Disabled vs. Hidden

During development, two patterns were evaluated for the submission trigger:
1. **Hidden Version:** Hiding the submit button (`display: none`) until every single field passed validation.
2. **Disabled Version:** Displaying the button by default in an inactive state (`aria-disabled="true"`) until the form is complete.

### Why the Disabled Button is Superior to the Hidden Button (Required Comparison)
Hiding the submit button completely disorients users by removing the obvious visual destination of the form, causing keyboard users and screen readers to assume the form is incomplete or broken. A visible disabled button maintains a clear visual and architectural target that sets user expectations, and when interacted with, can programmatically explain exactly which steps remain before submission is permitted.

### Explaining the Inactive State
Rather than behaving as a silent, unresponsive block, clicking or activating the disabled button while terms remain unchecked triggers an immediate visual and auditory alert:
> *"Please accept the terms and conditions before creating your account."*

This ensures the user is actively guided through completion rather than left wondering why the button refuses to respond.

