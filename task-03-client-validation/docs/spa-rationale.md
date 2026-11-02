# SPA Rationale — Kobo Watt Task 3

## Why instant form switching matters

When a user switches between signup and login on three separate pages,
each switch is a full HTTP round-trip: a new GET, a full HTML parse, a
full CSS and JavaScript re-evaluation, and a repaint. On a slow Nigerian
3G connection — which is the realistic baseline for a Kobo Watt customer
in Ikeja — this round-trip can take two to four seconds per switch. A
user who starts filling the signup form, notices they already have an
account, clicks "sign in", fills the login form, and then realises they
forgot their password has waited up to twelve seconds in navigation alone,
without any actual task progress.

More concretely: multi-page authentication loses any partially typed
input on every switch. A user who typed their address into the signup
form, switched to login to confirm their email, and switched back finds
the address field empty. That is a data-entry failure caused by routing,
not by the user.

## What the user experience was before

Before Step 1, the agent produced three separate HTML files:
`signup.html`, `login.html`, and `reset.html`. Switching between them
required a full page load. The browser's back button moved between forms,
which caused confusion — pressing back on the login page returned the user
to whatever they were doing before authentication rather than returning
them to signup. Partially entered data was lost on every switch.

## One case where separate pages are the better choice

Separate auth pages are better when the signup process spans multiple
steps that should be individually bookmarkable or resumable. A multi-step
KYC (Know Your Customer) flow — collecting ID documents, liveness checks,
and address verification across several screens — should each be a
separate page with its own URL, because:

1. Each step may take several minutes; a page refresh or browser crash
   should not lose all progress.
2. Support staff need to link directly to a specific step when helping
   a customer who is stuck.
3. Analytics needs to measure drop-off at each step individually.

In those cases the cost of a full page load per step is justified by the
data-safety and navigability benefits. Kobo Watt's current auth is a
simple three-field signup — the trade-off favours the SPA approach.

