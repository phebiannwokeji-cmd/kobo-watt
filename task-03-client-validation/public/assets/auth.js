/**
 * auth.js — Kobo Watt account page
 * Single-page form switcher + client-side validation
 * Task 3: The Form, Attacked from Both Sides
 *
 * Client-side validation is a convenience for the user, not a security
 * control. Every rule here is re-enforced on the server (task 4).
 */

'use strict';

/* ─── 1. FORM SWITCHER (SPA — no page reload) ──────────────────────── */

const FORMS = ['signup', 'login', 'reset'];

function getFormParam() {
  const p = new URLSearchParams(window.location.search).get('form');
  return FORMS.includes(p) ? p : 'signup';
}

function showForm(name) {
  FORMS.forEach(id => {
    const form = document.getElementById('form-' + id);
    const tab  = document.getElementById('tab-' + id);
    const active = id === name;
    form.hidden = !active;
    form.setAttribute('aria-hidden', String(!active));
    tab.setAttribute('aria-selected', String(active));
    tab.classList.toggle('kw-tab--active', active);
  });

  // Update page title so browser history is meaningful
  const titles = {
    signup: 'Create account — Kobo Watt',
    login:  'Sign in — Kobo Watt',
    reset:  'Reset password — Kobo Watt',
  };
  document.title = titles[name];

  // Announce to screen reader
  announce(
    name === 'signup' ? 'Create account form shown.' :
    name === 'login'  ? 'Sign in form shown.' :
                        'Password reset form shown.'
  );
}

function handleNavigation() {
  const name = getFormParam();
  showForm(name);
}

// Intercept tab link clicks — update URL without reload
document.querySelectorAll('.kw-tab').forEach(tab => {
  tab.addEventListener('click', e => {
    e.preventDefault();
    const url = new URL(tab.href);
    history.pushState(null, '', url.search);
    handleNavigation();
  });
});

// Also intercept in-form "switch form" links
document.querySelectorAll('a[href^="?form="]').forEach(link => {
  link.addEventListener('click', e => {
    // Only intercept if it's on the same page (not external)
    if (!link.closest('.kw-form') && !link.closest('.kw-form-tabs')) return;
    e.preventDefault();
    const url = new URL(link.href, window.location.href);
    history.pushState(null, '', url.search);
    handleNavigation();
  });
});

window.addEventListener('popstate', handleNavigation);

// Initial render
handleNavigation();


/* ─── 2. UTILITIES ─────────────────────────────────────────────────── */

function announce(msg) {
  const el = document.getElementById('kw-status');
  el.textContent = '';
  // Small gap forces re-announcement if message repeats
  requestAnimationFrame(() => { el.textContent = msg; });
}

/**
 * Show an inline field error.
 * @param {string} errorId  - id of the <span class="kw-error">
 * @param {string} message  - human-readable message
 */
function showError(errorId, message) {
  const el = document.getElementById(errorId);
  if (!el) return;
  el.querySelector('.kw-error-text').textContent = message;
  el.hidden = false;
}

function clearError(errorId) {
  const el = document.getElementById(errorId);
  if (!el) return;
  el.querySelector('.kw-error-text').textContent = '';
  el.hidden = true;
}

/**
 * Trim and validate; return error string or null.
 * Each function documents what goes wrong without the rule and who it wrongly blocks.
 */

// ── Category 1: Empty field ──────────────────────────────────────────
function validateRequired(value, fieldLabel) {
  if (value.trim() === '') {
    return `${fieldLabel} is required. Please fill in this field before continuing.`;
  }
  return null;
}

// ── Category 2: Length and structure ────────────────────────────────

/**
 * Name rule: minimum 2 characters, must contain at least one space (two words).
 *
 * What goes wrong without it: bots and auto-fill agents submit single tokens
 * ("a", "test", "user") — unusable for service agreements and warranty records.
 *
 * Who it wrongly blocks: people with a single legal name (mononymous users —
 * common in parts of Nigeria, Indonesia, and Iceland). Trade-off accepted: we
 * add a note below the field explaining users with one name should enter it
 * twice (e.g. "Hauwa Hauwa") as a workaround, which we acknowledge is imperfect.
 */
function validateName(value) {
  const v = value.trim();
  const empty = validateRequired(v, 'Full name');
  if (empty) return empty;
  if (v.length < 2) return 'Full name must be at least 2 characters.';
  if (!/\s/.test(v)) return 'Please enter your full name — at least two words separated by a space. If you use a single name, enter it twice (e.g. Hauwa Hauwa).';
  return null;
}

/**
 * Phone rule: 10–14 digits, no letters or symbols.
 *
 * What goes wrong without it: local Nigerian numbers (080…) are 11 digits;
 * international format (+234…) can reach 14. Without bounds, bots submit
 * "1" or 99-digit strings that break downstream SMS systems.
 *
 * Who it wrongly blocks: users with extensions (e.g. +1 800 555 1234 x999).
 * Extensions stripped on entry; documented in field-justification.md.
 */
function validatePhone(value) {
  const v = value.trim();
  const empty = validateRequired(v, 'Phone number');
  if (empty) return empty;
  if (!/^[0-9]{10,14}$/.test(v)) {
    return 'Phone number must be 10 to 14 digits — numbers only, no spaces or dashes.';
  }
  return null;
}

/**
 * Email format rule: something@something.something
 *
 * What goes wrong without it: users who mistype (noemail, user@, @domain)
 * cannot receive invoices or account-recovery emails — silent data loss.
 *
 * Who it wrongly blocks: no legitimate email address fails this pattern.
 * (Note: we do NOT check whether the address exists. Ownership is proved
 * later by sending a code. Checking existence from the browser would be
 * pointless — it would require a live DNS lookup the browser cannot do —
 * and even a server-side existence check discloses whether an account exists,
 * which is a user-enumeration vulnerability.)
 */
function validateEmail(value) {
  const v = value.trim();
  const empty = validateRequired(v, 'Email address');
  if (empty) return empty;
  // A string, then @, then a domain with at least one dot
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return 'Enter a valid email address — for example, name@example.com.';
  }
  return null;
}

/**
 * Address rule: minimum 10 characters (enough for "1 Ada St").
 *
 * What goes wrong without it: engineers are dispatched to "a" or "test" —
 * wasted trip, revenue loss, contractual breach.
 *
 * Who it wrongly blocks: no legitimate Nigerian street address is under 10
 * characters. Accepted cost: negligible.
 */
function validateAddress(value) {
  const v = value.trim();
  const empty = validateRequired(v, 'Service address');
  if (empty) return empty;
  if (v.length < 10) return 'Service address is too short — please enter a full street address.';
  return null;
}

/**
 * Password rule: minimum 12 characters, not all whitespace.
 *
 * 12 was chosen because NIST SP 800-63B recommends length over complexity,
 * and 12 characters is the boundary where brute-force becomes infeasible
 * without specialised hardware. We do not require symbols — they push users
 * towards predictable substitutions (p@ssw0rd).
 *
 * What goes wrong without it: short passwords are cracked offline if the
 * database is compromised. One character "a" passes trivially.
 *
 * Who it wrongly blocks: users with cognitive impairments who struggle with
 * long passwords, and users on shared devices who rely on simple passwords.
 * Mitigated by: showing a password-visibility toggle so they can verify
 * what they typed. We chose a toggle over a confirm field because a confirm
 * field is harder for users on mobile with long passwords; in a banking or
 * health context the confirm field would be preferred (no visibility toggle
 * if the data is highly sensitive).
 */
function validatePassword(value) {
  if (value === '') return 'Password is required.';
  if (value.trim() === '') return 'Password cannot be only spaces.';
  if (value.length < 12) return 'Password must be at least 12 characters. Length makes it strong.';
  return null;
}

// ── Category 3: Format, real-time on signup / submit-only on login ───

function validateTerms(checked) {
  if (!checked) return 'You must accept the terms and conditions to create an account.';
  return null;
}


/* ─── 3. SIGNUP FORM VALIDATION ────────────────────────────────────── */

const signupForm = document.getElementById('form-signup');
const btnSignup  = document.getElementById('btn-signup');

// Fields: [ inputId, errorId, validatorFn ]
const signupFields = [
  ['signup-name',     'name-error',          v => validateName(v)],
  ['signup-phone',    'phone-error',          v => validatePhone(v)],
  ['signup-email',    'signup-email-error',   v => validateEmail(v)],
  ['signup-address',  'address-error',        v => validateAddress(v)],
  ['signup-password', 'password-error',       v => validatePassword(v)],
];

function runSignupValidation(field) {
  const [inputId, errorId, fn] = field;
  const input = document.getElementById(inputId);
  const isCheckbox = (input.type === 'checkbox');
  const val = isCheckbox ? input.checked : input.value;
  const err = fn(val);
  if (err) { showError(errorId, err); return false; }
  clearError(errorId);
  return true;
}

function updateSubmitState() {
  // Check all text fields and terms
  const allValid = signupFields.every(([inputId, , fn]) => {
    const input = document.getElementById(inputId);
    return fn(input.value) === null;
  }) && document.getElementById('signup-terms').checked;

  btnSignup.disabled = !allValid;
  btnSignup.setAttribute('aria-disabled', String(!allValid));
}

// Category 1 + 2: blur → inline error
signupFields.forEach(field => {
  const [inputId] = field;
  const input = document.getElementById(inputId);

  input.addEventListener('blur', () => {
    runSignupValidation(field);
    updateSubmitState();
  });

  input.addEventListener('input', () => {
    // Clear the error on input so it doesn't persist while user is fixing
    clearError(field[1]);
    updateSubmitState();
  });
});

// Category 3: Email — REAL-TIME on signup
const signupEmailInput = document.getElementById('signup-email');
signupEmailInput.addEventListener('input', () => {
  if (signupEmailInput.value.length > 0) {
    const err = validateEmail(signupEmailInput.value);
    if (err) showError('signup-email-error', err);
    else clearError('signup-email-error');
  }
  updateSubmitState();
});

// Password hint — show only after typing begins
const pwInput = document.getElementById('signup-password');
const pwHint  = document.getElementById('password-reqs');
pwInput.addEventListener('input', () => {
  pwHint.hidden = pwInput.value.length === 0;
});

// Terms checkbox
document.getElementById('signup-terms').addEventListener('change', () => {
  const err = validateTerms(document.getElementById('signup-terms').checked);
  if (err) showError('terms-error', err);
  else clearError('terms-error');
  updateSubmitState();
});

// Disabled button click — explain why (Step 7 requirement)
btnSignup.addEventListener('click', e => {
  if (btnSignup.disabled) {
    e.preventDefault();
    const termsChecked = document.getElementById('signup-terms').checked;
    const hint = document.getElementById('btn-signup-hint');
    if (!termsChecked) {
      hint.hidden = false;
    } else {
      hint.hidden = true;
    }
    // Re-run all field validation so errors appear
    signupFields.forEach(f => runSignupValidation(f));
  }
});

signupForm.addEventListener('submit', e => {
  e.preventDefault();
  const results = signupFields.map(f => runSignupValidation(f));
  const termsOk = !validateTerms(document.getElementById('signup-terms').checked);
  if (!termsOk) showError('terms-error', validateTerms(false));
  if (results.every(Boolean) && termsOk) {
    submitSignup();
  }
});

async function submitSignup() {
  const status = document.getElementById('kw-status');
  const payload = {
    name:     document.getElementById('signup-name').value.trim(),
    phone:    document.getElementById('signup-phone').value.trim(),
    email:    document.getElementById('signup-email').value.trim(),
    address:  document.getElementById('signup-address').value.trim(),
    password: document.getElementById('signup-password').value,   // server hashes this
    terms:    document.getElementById('signup-terms').checked,
  };
  try {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      announce('Account created. Reference ' + data.id + '.');
      signupForm.reset();
      pwHint.hidden = true;
      updateSubmitState();
    } else {
      announce('Could not create account: ' + (data.error || 'please try again.'));
    }
  } catch {
    announce('Network error — please check your connection and try again.');
  }
}


/* ─── 4. LOGIN FORM VALIDATION ─────────────────────────────────────── */

const loginForm = document.getElementById('form-login');

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const emailVal = document.getElementById('login-email').value;
  const pwVal    = document.getElementById('login-password').value;

  // Category 3: Email format checked on SUBMIT only (not real-time) on login
  const emailErr = validateEmail(emailVal);
  if (emailErr) { showError('login-email-error', emailErr); return; }
  clearError('login-email-error');

  const pwErr = validateRequired(pwVal, 'Password');
  if (pwErr) { showError('login-password-error', pwErr); return; }
  clearError('login-password-error');

  submitLogin(emailVal.trim(), pwVal);
});

async function submitLogin(email, password) {
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      announce('Signed in successfully.');
      window.location.href = '/dashboard';
    } else {
      // Generic message: do not reveal which half (email or password) was wrong
      announce('Sign-in details are incorrect. Please check and try again.');
    }
  } catch {
    announce('Network error — please check your connection and try again.');
  }
}


/* ─── 5. RESET FORM ─────────────────────────────────────────────────── */

const resetForm = document.getElementById('form-reset');

resetForm.addEventListener('submit', e => {
  e.preventDefault();
  const emailVal = document.getElementById('reset-email').value;
  const err = validateEmail(emailVal);
  if (err) { showError('reset-email-error', err); return; }
  clearError('reset-email-error');

  submitReset(emailVal.trim());
});

async function submitReset(email) {
  try {
    const res = await fetch('/api/password-resets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    // Always show the same message regardless of whether email exists —
    // prevents user enumeration through the reset form.
    announce('If that address is registered, a reset link is on its way.');
  } catch {
    announce('Network error — please try again.');
  }
}


/* ─── 6. PASSWORD VISIBILITY TOGGLE ────────────────────────────────── */

document.querySelectorAll('.kw-toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('aria-controls');
    const input = document.getElementById(targetId);
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    btn.textContent = showing ? 'Show' : 'Hide';
    btn.setAttribute('aria-pressed', String(!showing));
  });
});
