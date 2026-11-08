# Step 8 — Rate limiting and its limits

## Chosen limits

The learner chose a 15-minute window with separate per-IP limits:

| Endpoint | Limit per IP | Working rationale to review |
| --- | ---: | --- |
| Registration | 10 requests | Allows a small group of students sharing a school or household connection to register in a short burst while slowing automated account creation. |
| Login | 20 requests | Allows several people sharing one connection to sign in and recover from mistyped credentials; this is deliberately generous and should be combined with per-account controls in a production system. |
| Password reset | 5 requests | Allows a few retries while limiting repeated reset-message abuse from one IP. |

The learner's explanation:

> I set starting limits per IP address over a rolling 15 minutes: 10 registrations, 20 login attempts, and 5 password resets.
>
> Registration is low because real signups are rare, while fake ones can happen fast. Login is higher because real users mistype passwords or have connection problems. Password reset is lowest because each request sends an email and can be used to harass a customer.
>
> I chose 15 minutes as a short cooldown. It slows automated repeats without making real users wait long after a mistake.

Terminology note: `express-rate-limit` applies a per-IP time window that resets for each key; it is not a continuously sliding “last 15 minutes” counter. Near a window boundary, repeated requests can span two windows. The implementation and tests therefore refer to a 15-minute window, not a rolling window.

The limits are starting values for this small local assessment application, not production tuning. All users behind the same NAT address share the same counter. For example, several students signing in from one campus network can consume the 20-login quota together; the next legitimate student can receive HTTP 429 even if they personally made no attempts. The 5-reset limit can similarly inconvenience a shared office or campus network. This is the false-positive cost of the chosen per-IP-only rule.

## Placement and counter storage

`express-rate-limit` applies the default in-memory store separately to registration, login and reset. The request limiters run before Zod so repeated invalid requests are counted too; the 16 KB JSON body parser runs first, followed by rate limiting, then Zod, then route logic. The application does not trust forwarded IP headers.

The memory store is simple and suitable for this single-process local demo. Counts disappear when the server restarts, are not shared across multiple Node processes, and do not coordinate across machines. A deployed multi-instance service needs a shared store such as Redis. The IP-only key is also incomplete: a serious system should add account/email-based counters, and consider carefully governed device signals. Hardware identifiers can be unavailable, resettable, spoofed, or privacy-invasive, so they should not be treated as a reliable identity on their own.

## Evidence to capture

The learner captured the lockout proof on 2026-11-04 at 10:51:17 UTC in `evidence/12-rate-limit-trigger.txt`. Registration returned 10 HTTP 400 responses followed by HTTP 429; login returned 20 HTTP 400 responses followed by HTTP 429; reset returned 5 HTTP 400 responses followed by HTTP 429. This also shows the route limiter runs before Zod validation.

The learner captured the IP-only bypass on 2026-11-04. The first attempt used `192.168.1.20`, which was not assigned to the computer and timed out; that failed attempt remains in the evidence file. After restarting the server with `HOST=0.0.0.0`, the learner replayed through loopback and received HTTP 429, then sent the same request to the active LAN IPv4 address `172.20.10.4` and received HTTP 400 from Zod. The HTTP 400 shows the alternate address had a fresh IP quota and the invalid body was rejected after the limiter passed it. Full output, including the initial timeout, is in `evidence/13-rate-limit-ip-change.txt`.

This is a local interface-path demonstration: the same machine reached the server through loopback and through its assigned LAN address. No forwarded-IP header was forged or trusted.

Keep the local-only server on loopback during ordinary work; the all-interface bind is only for the short bypass demonstration. No forwarded-IP header is trusted or used to manufacture a different address.
