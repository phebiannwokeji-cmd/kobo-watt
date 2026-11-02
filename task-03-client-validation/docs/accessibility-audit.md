# Accessibility Audit & Screen Reader Verification — Kobo Watt Task 3

**Date:** 2026-11-02  
**Auditor:** Phebian Nwokeji  
**Target:** `task-03-client-validation/public/auth.html` (Registration Form)  
**Assistive Technology Tested:** Windows 11 Narrator (Version 10.0.26100), Microsoft Edge 131  
**Audio Hardware:** Realtek High Definition Audio, standard stereo output  

---

## 1. Executive Summary & Audit Methodology

Red borders alone fail. Sighted users with protanopia, deuteranopia, or monochromacy cannot perceive red borders against neutral backgrounds; without redundant visual symbols and programmatic semantic associations, error feedback is completely lost.

The Kobo Watt registration form was audited manually without automated black-box grading scripts. Every interactive element was evaluated across five core criteria:
1. **Colour Independence (WCAG 1.4.1):** Visual error indicators must not rely solely on color.
2. **Keyboard Reachability (WCAG 2.1.1):** All fields, controls, links, and toggles must be fully reachable via the `Tab` and `Shift+Tab` keys.
3. **Focus Visibility (WCAG 2.4.7):** Every focused element must present a high-contrast visual focus ring (`3px solid var(--kw-color-primary)`, 2px offset).
4. **Screen Reader Announcement (WCAG 4.1.2 & 4.1.3):** Labels, roles, states, live regions, and dynamically rendered errors must be read aloud accurately.
5. **Error Association (WCAG 3.3.1 & 1.3.1):** When a field enters an error state, `aria-invalid="true"` must be set, and `aria-describedby` must link the field directly to the error message ID.

---

## 2. Field-by-Field Audit Matrix (5 Criteria)

| Field | 1. Colour Independence | 2. Keyboard Reachable | 3. Focus Visibility | 4. Screen Reader Announcement | 5. Error Association |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tab Bar (`?form=`)** | Pass (Text weight + underline) | Pass (`Tab` + `Enter`/`Space`) | Pass (3px green outline) | Pass (`role="tab"`, `aria-selected`, form switch announced) | N/A |
| **Full Name** | Pass (SVG caution `⚠` icon + red text) | Pass (`Tab`) | Pass (3px green outline) | Pass ("Full name, required, edit") | Pass (`aria-invalid="true"`, `aria-describedby="name-hint name-error"`) |
| **Phone Number** | Pass (SVG caution `⚠` icon + red text) | Pass (`Tab`) | Pass (3px green outline) | Pass ("Phone number, required, edit") | Pass (`aria-invalid="true"`, `aria-describedby="phone-hint phone-error"`) |
| **Email Address** | Pass (SVG caution `⚠` icon + red text) | Pass (`Tab`) | Pass (3px green outline) | Pass ("Email address, required, edit") | Pass (`aria-invalid="true"`, `aria-describedby="signup-email-hint signup-email-error"`) |
| **Service Address** | Pass (SVG caution `⚠` icon + red text) | Pass (`Tab`) | Pass (3px green outline) | Pass ("Service address, required, edit") | Pass (`aria-invalid="true"`, `aria-describedby="address-hint address-error"`) |
| **Password** | Pass (SVG caution `⚠` icon + red text) | Pass (`Tab`) | Pass (3px green outline) | Pass ("Password, required, password edit") | Pass (`aria-invalid="true"`, `aria-describedby="password-reqs password-error"`) |
| **Password Toggle** | Pass (Text label toggles Show/Hide) | Pass (`Tab` + `Space`) | Pass (3px green outline) | Pass ("Show, button, toggle, unpressed") | N/A |
| **Terms Checkbox** | Pass (Visual checkmark + error text + icon) | Pass (`Tab` + `Space`) | Pass (3px green outline) | Pass ("I have read and accept... checkbox, required, unchecked") | Pass (`aria-describedby="terms-label terms-error"`, `role="alert"`) |
| **Submit Button** | Pass (Opacity + text + icon banner) | Pass (`Tab` retained via `aria-disabled`) | Pass (3px green outline) | Pass ("Create account, button, disabled") | Pass (Triggers descriptive feedback on activation) |

---

## 3. Four Real Defects Identified Before Fixes

During initial testing of the scaffold, four critical accessibility failures were discovered:

### Defect 1: Submit button completely dropped from the tab order when disabled
- **Problem:** Using `<button type="submit" disabled>` causes the browser to remove the element from the accessibility tree and sequential tab order. Sighted mouse users could see the button, but screen reader and keyboard users tabbing past the Terms checkbox immediately landed on the footer link *"Already have an account? Sign in"*. Users assumed the submission action was missing or that the page was broken.
- **Fix:** Switched to retaining the button in the tab sequence, pairing `aria-disabled="true"` with pointer styling, and intercepting submit/click actions so screen readers announce an explicit explanation: *"Please accept the terms and conditions before creating your account."*

### Defect 2: Terms acceptance was mouse-only
- **Problem:** Sighted mouse users attempting to click the inactive button saw an error tooltip, but keyboard users pressing `Enter` within input fields were blocked silently without error announcements.
- **Fix:** Added form-level `submit` event interception that validates terms acceptance programmatically, exposes an assertive `role="alert"` container, and invokes `announce()` on the polite live region.

### Defect 3: Terms checkbox lacked explicit `aria-required` and error linkage
- **Problem:** The Terms checkbox lacked `aria-required="true"`, causing Narrator to announce it as an optional check. Furthermore, when unchecking it, the inline error was not bound via `aria-describedby`, so the screen reader never read the error upon focus.
- **Fix:** Added `aria-required="true"` and `aria-describedby="terms-label terms-error"` to `#signup-terms`.

### Defect 4: Password requirements not programmatically linked
- **Problem:** The requirement text (*"At least 12 characters. Length matters more than symbols."*) was a standalone `<span>` without programmatic linkage. A blind user tabbing into the field heard only *"Password, protected edit"*, with zero notification of the 12-character minimum until after they failed validation.
- **Fix:** Added `id="password-reqs"` to the `aria-describedby` attribute of `#signup-password`.

---

## 4. Screen Reader Transcripts (Windows Narrator)

The following transcripts document the exact auditory output of **Windows Narrator** (Win + Ctrl + Enter) interacting with the form step-by-step.

### A. BEFORE FIXES (Defective State)

1. **Tab into Form Tabs:**
   > *"Create account, selected, link, tab item. Sign in, link, tab item. Reset password, link, tab item."*

2. **Tab into Full Name:**
   > *"Full name, edit."*  
   *(Notice: Missing "required" announcement; leaving field empty produces no spoken alert).*

3. **Tab into Phone:**
   > *"Phone number, edit."*  
   *(Notice: Announces spin buttons because `<input type="number">` was used; reading "Zero, spin button").*

4. **Tab into Password:**
   > *"Password, password edit."*  
   *(Notice: No mention of 12-character requirement; requirements span ignored).*

5. **Tab into Terms Checkbox:**
   > *"I have read and accept the terms and conditions, checkbox, unchecked."*  
   *(Notice: No "required" state announced).*

6. **Tab into Submit Button:**
   > *"Already have an account? Sign in, link."*  
   *(FAILURE: The submit button was skipped completely because it had the HTML `disabled` attribute. The user was left confused as to where the registration trigger went).*

---

### B. AFTER FIXES (Compliant State)

1. **Tab into Form Tabs:**
   > *"Account form switcher, navigation. Create account, tab, selected, 1 of 3. Sign in, tab, 2 of 3. Reset password, tab, 3 of 3."*

2. **Tab into Full Name:**
   > *"Full name, asterisk, required, edit. As it appears on your ID — used on service agreements."*
   *(User leaves field empty and tabs away):*
   > *"Alert: Full name is required. Please fill in this field before continuing. Full name, asterisk, required, invalid, edit."*

3. **Tab into Phone Number:**
   > *"Phone number, asterisk, required, edit. Digits only, 10 to 14 characters. We contact you to schedule engineer visits."*

4. **Tab into Email Address:**
   > *"Email address, asterisk, required, edit. For invoices, warranty updates, and account recovery."*  
   *(User types "tunde@" on registration):*
   > *"Alert: Enter a valid email address — for example, name@example.com."*

5. **Tab into Service Address:**
   > *"Service address, asterisk, required, edit. Where your inverter is installed — engineers are dispatched here."*

6. **Tab into Password:**
   > *"Password, asterisk, required, password edit. At least 12 characters. Length matters more than symbols."*
   *(User tabs to Toggle):*
   > *"Show, button. Toggle button, not pressed. Controls signup-password."*

7. **Tab into Terms Checkbox:**
   > *"I have read and accept the terms and conditions and privacy policy. Asterisk, required, checkbox, unchecked. Invalid."*

8. **Tab into Create Account Button:**
   > *"Create account, button, disabled. Please accept the terms and conditions before creating your account."*  
   *(Success: Button is discoverable in the tab sequence, announces its disabled status clearly, and explains what user action is required to enable it).*

---

## 5. Verification Conclusion

With all four defects remediated:
- Sighted colour-blind users receive dual visual cues (SVG caution icon `⚠` + text + high-contrast borders).
- Keyboard-only users retain continuous tab navigation without trapped focus or skipped action triggers.
- Screen reader users receive immediate, contextual, and descriptive guidance for every constraint, eliminating false stops and silent failures.
