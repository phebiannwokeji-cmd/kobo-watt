# Kobo Watt: Decisions and Acceptance Checks

I use these provisional rules for a prototype with test payments and simulated access. I have not validated them as a commercial offer.

## 1. Product boundary

Build a customer-account and rent-to-own entitlement demonstrator. Entitlement means permission recorded by the business, not observed electricity. Use payment-provider test mode and labelled simulated access states; no real money or physical device commands.

Show account access as active, grace, expired or paid-off. Show payment status separately. Never infer device operation from the ledger. If a customer reports no power while account access is active, show Get help → Access active, but no power, a demonstration help page with the account-state timestamp and a clear statement that no support request has been sent. Label prototype support as a demonstration; do not invent a staffed service or response-time promise.

Paid-off removes expiry for nonpayment under this model. It does not promise hardware life, electricity, appliance suitability or a warranty.

## 2. Contract and money

Each contract records a positive purchase price, positive daily rate, NGN currency, accepted terms version and timestamps. Fix price and rate for that contract. Catalogue changes do not rewrite it. Research real commercial rates; label seeded demonstration plans synthetic.

The demonstration contract price is ₦3,641,200; the required deposit is ₦1,092,400; the post-deposit balance is ₦2,548,800; and the access rate is ₦3,540 (354,000 kobo) per paid day. Classify payments explicitly as deposit or access payments. The deposit is one exact payment, reduces the purchase balance, and buys no access time. Do not permit access payments until the deposit is fully confirmed. A separate first access payment starts paid time; there is no free starter allowance. Subsequent access payments both reduce the balance and purchase time. The sale price contains a provisional financing-cost allowance, but the prototype adds no separate interest, late fees, customer processing fees or energy charges. See pricing-model.md for assumptions and release limits.

Remaining balance is purchase price minus net confirmed principal payments. Pending, failed and abandoned attempts add nothing. Preserve original payments and separate reversal records.

Entry 2 approved rule: minimum access payment = k × the contract daily rate R, with k = 1. For R = 354,000 kobo, the floor is 354,000 kobo (₦3,540), purchasing exactly 86,400 seconds with no added credit remainder. This is a per-transaction floor, not a daily payment obligation or a requirement that payments be whole-day multiples. Larger arbitrary whole-kobo payments may buy fractional days. Permit a smaller positive final balance only when settled exactly. No payment may exceed the remaining balance. The deposit is exempt from this floor but must equal exactly ₦1,092,400.

Store k as versioned configuration and record it with the contract/terms version. Use the contract's fixed R, not a changing catalogue rate. New plan rates produce new minima; do not silently change existing contracts. The approved value is k = 1; support for other k values needs explicit rounding and validation rules before activation.

Reason: the minimum purchases an easily explained day and reduces the number of payment entries compared with half-day payments. This is not a fee-saving choice. It excludes customers with less than ₦3,540 available, especially after access expires. Entry 3A provides a one-time 48-hour buffer, not a general solution to unaffordable payments. It cannot help after its fixed allowance is exhausted.


Reject amounts above the remaining balance and new payments after payoff. Allow only one unresolved attempt per contract. Reopening checks that attempt. Resolve abandoned/failed attempts through provider verification; closing the browser is not failure.

The server checks transaction identity, amount, currency and contract. Authenticate incoming provider notifications using its documented mechanism. Apply each transaction once even when notifications repeat. Record payment credit and entitlement changes in one database transaction: both complete or neither does. Recheck balance during that operation.

Unexpected confirmed funds that cannot safely be allocated enter a visible review-required state. Never silently discard them or grant excess credit. Refunds, disputes and chargebacks require a complete policy before live-money operation.


## 2A. Paid duration versus calendar time

The post-deposit balance equals 720 daily-rate equivalents. This is 720 paid days of credit to reach payoff, not 24 calendar months or a fixed due date. At payoff, access stops expiring, even if some purchased credit has not yet been consumed. Prepayments can settle ownership sooner; gaps without payment can extend elapsed time. No new debt accrues during gaps and the contracted sale price does not increase. The business bears any extra funding/operating costs; the prototype makes no validated profit claim for extended contracts. I have not validated live commercial terms for this exposure.

## 3. Time arithmetic and quotes

Store money as integer kobo; one naira is 100 kobo. Avoid approximate decimal arithmetic.

Let R be the daily rate in kobo. A day is 86,400 seconds. An access payment A adds A × 86,400 credit units; the deposit adds none; each paid second consumes R units. Retain unused units so repeated small payments do not lose credit through rounding. Choose integer arithmetic/storage sufficient for the permitted values.

New credit extends existing paid expiry while active. In grace or after expiry, paid time starts when the server verifies and applies the payment. Confirmation delays do not consume purchased time before credit is available. Record provider success time separately from application time.

For a future target instant, calculate additional whole seconds from the later of now or existing paid expiry, subtract retained credit units, and round the required payment upward to whole kobo. Apply the minimum unless the final balance is smaller. Cap at the remaining balance, because payoff removes expiry. Show actual purchased coverage when the minimum buys more than requested.

Display date/time in Africa/Lagos and store unambiguous instants. Ask for a time when only a day such as Friday is selected. Timestamp quotes and refresh before payment initiation. Explain that delayed confirmation starts credit later and may buy later coverage than the original quote.


## 4. Entry 3A — approved one-time grace and payoff

Decision: one free, fixed 48-hour grace window per contract. This is an approved prototype policy, not an operator-validated finding.

Eligibility and trigger: the deposit must be confirmed and an access payment must have purchased time. The deposit alone grants neither access nor grace. The server fixes grace_start at the first actual expiry of paid access and grace_end = grace_start + 172,800 seconds. A top-up before expiry extends paid time and therefore postpones that first expiry; it does not consume grace early. If the expiry is processed late, use the actual expiry instant, not the time a worker notices it.

Once set, the deadline never moves. Payments do not pause, replenish, restart or extend it. During grace, confirmed payment starts paid access immediately. If that paid access expires before the original grace deadline, only the remainder of the original window is available. Store the original deadline so repeated requests, duplicate notifications and process restarts cannot grant another window. At or after grace_end, no grace remains.

Example: paid time ends Monday at noon, so grace ends Wednesday at noon. A one-day payment applied Monday at 18:00 buys paid access until Tuesday at 18:00. Eighteen hours remain in the original grace window; no new allowance is created.

Grace adds no debt, consumes no purchased credit and does not reduce the purchase balance. Its two-day rate-equivalent value is ₦7,080 at the current R; that is not a measured cash cost. It may affect the business's funding and servicing exposure, which still needs validation.

State priority: paid-off when balance is zero; otherwise active when whole-second paid credit remains; otherwise grace while its fixed deadline is ahead; otherwise expired. Before deposit confirmation, explain access as “Deposit required”. After deposit but before the first access payment, explain “No paid access purchased yet”. Neither grants grace. Paid-off accounts need no grace. These states describe recorded entitlement, not physical power.

A pending payment does not grant or extend grace. Keep payment status separate and recover confirmation using the payment verification flow. A later reversal requires reconciliation of balance and purchased credit; preserve history and flag review-required rather than silently revoking a paid-off promise or issuing a device command. Full reversal handling remains a live-use blocker.

Reason: the allowance is easy to explain, has a bounded duration and cannot be repeatedly renewed by minimum payments. Limitation: a customer with a genuine second lapse receives no new grace. Interview the operator about lapse frequency, duration, causes and outcomes before applying this policy commercially. Do not represent this buffer as a complete mitigation for the one-day minimum.

Phase: Task 4 server entitlement implementation and tests; design the explanation earlier.


## 5. Pending payments and recovery

Use initiated, pending, confirmed, failed, abandoned and reversed payment states, plus review-required for reconciliation. Keep them separate from account access.

A browser success page is not payment proof. Verify the provider result on the server before crediting. Recover missed notifications through server-side verification.

Unknown results remain pending. Reopening retrieves the existing attempt. Do not turn timeouts into failure or invite duplicate payment. Do not claim knowledge of a bank debit beyond the provider evidence.


## 6. Entry 4B — approved minimal five-minute offline display

Decision: retain a minimal last-known snapshot in page memory for no more than 300 seconds after the last successful authenticated account-data refresh. This is an approved prototype policy, not a researched safety threshold or session lifetime.

Threat assumption: another person may see or use an unlocked phone. While offline, the application cannot immediately learn that a session was revoked remotely. The policy limits exposure; it cannot prevent someone viewing an already-open screen or capturing it.

Allowed snapshot: last recorded access state, last recorded paid-until time and timestamp of the successful server refresh. Exclude identity details, purchase balance, payment history, payment references and administrative data. On entering offline mode, remove those excluded details from the account view and do not retain them in its offline snapshot.

Display “Offline — last known, not current”, with the timestamp. Never advance account entitlement using the phone clock, confirm payments offline or imply current physical power. The local elapsed-time clock is used only to expire the snapshot, not to establish entitlement.

The 300-second clock starts at the successful authenticated account refresh, not when disconnection is detected. Clicks, typing, failed requests and mere connectivity checks do not reset it. Enforce the deadline on every return to view as well as with a timer; suspended background timers must not expose an expired snapshot. Reloading or closing discards it. No private first-time offline access is available.

Storage: page memory only. Do not persist private snapshots in local storage, IndexedDB, browser response caches or service-worker caches. Prevent caching of private account responses. Non-private interface assets may be cached without account data.

Clearing: remove private account data on logout, account change, detected session expiry, reload or snapshot deadline. Conceal private information whenever the page becomes hidden; on return, check the deadline and known session state before showing any remaining offline snapshot. Browser background concealment is not a guarantee against operating-system previews, screenshots or a compromised device.

Offline actions: no new payment initiation, payment confirmation or balance changes. Reconnection must verify the session and retrieve fresh account data before restoring the normal account view; a network indicator alone is insufficient.

Offline logout clears private data locally immediately but cannot claim server revocation. Explain “Account information cleared on this device; server logout is not yet confirmed” and retry revocation when connectivity returns. Do not automatically restore the account view after a local logout. Server-side session expiry/revocation remains a separate control; do not mislabel the five-minute snapshot limit as a session timeout.

Reason: supports short connection interruptions without persisting private financial records. Limitation: no recovery of the snapshot after reload and no help beyond the five-minute window; shared unlocked phones remain a risk. Validate real connection-loss duration and phone-sharing practices before extending the window.

Phase: Task 5 session/privacy implementation and tests; design the offline screen earlier.


## 7. Performance and design acceptance

Target a useful authenticated account summary within three seconds on a named mid-range Android device under a documented mobile-network profile. This is a target, not a measured result.


If unresolved after three seconds, show waiting/offline guidance, not invented data. Do not promise a deadline for external payment confirmation.

Keep open letter shapes, aligned equal-width numerals, Source Sans Pro SemiBold (600), with size differences defining the current hierarchy, lightweight loading and system fallbacks. Verify the font's ₦ glyph on the intended Android browser and allow a readable fallback during loading.


## 8. Research and prototype limits

Adaobi, age range, connectivity and technical comfort are hypotheses. Interview a real solar/inverter operator about payment sizes, ownership allocation, grace, common outage causes, equipment suitability, reconnection delays, receipts, support and preferred units of information. Record actual answers and revise these decisions when evidence contradicts them. Do not invent research or force a contradiction.

The assessment may proceed with synthetic plans, test payments, simulated access and explicit provisional rules. Live operation additionally needs validated commercial terms, device-control responsibilities, complete refund/dispute handling, real support arrangements, applicable legal/privacy review and completed security/accessibility/performance tests.

References used in the preceding review:
- Paystack payment verification: https://paystack.com/docs/payments/verify-payments/ (illustrative, not a provider selection).
- WCAG 2.2: https://www.w3.org/TR/WCAG22/.


Security references supporting storage/session precautions (not the chosen five-minute duration):
- https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
