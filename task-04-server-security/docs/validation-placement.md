# Step 6 — Schema validation at the request boundary

## Library choice

This project uses Zod 4.6.7. Zod expresses each JSON body as a named schema, returns structured issue paths through `safeParse`, and lets one middleware enforce the same boundary consistently across routes. Strict object schemas reject unexpected keys instead of silently accepting them. The trade-off is another runtime dependency and a small amount of parsing work on each request.

## Request lifecycle

1. Express receives the request and `express.json({ limit: "16kb" })` parses a bounded JSON body. Parsing and the body-size limit must happen before schema validation because the validator needs a parsed object to inspect.
2. Route-specific `validateBody(...)` middleware runs before the route handler. It checks the request shape and returns HTTP 400 with field paths and messages if parsing fails. It does not echo raw input or password values.
3. Only a validated body reaches email/password normalization, bcrypt, or a Prisma query/write.

Database reads/writes and password hashing must never run before request validation. Their cost and side effects are unnecessary for malformed requests, and doing them first would let untrusted input reach sensitive operations before the boundary check.

## Schemas applied

- Registration, login, and reset use strict object schemas; unknown keys are rejected.
- At Step 6, the schemas enforce the request shapes and valid email syntax. Step 7 extends them to enforce the Task 3 name, phone, email, address, password, and terms rules as well.

Email strings are trimmed and checked for email format by the schema. The route then applies the Step 5 lowercase normalization. Password schemas trim leading/trailing whitespace but preserve letter case.

## Request timing

Before adding Zod, the learner measured one registration request on their machine:

- Captured 2026-11-04 at 09:09:31 UTC.
- Elapsed time: 538.989 ms.
- Result: HTTP 201; account ID 4.
- Raw output: `evidence/10-validation-timing-before.txt`.

The measurements include bcrypt, SQLite, HTTP and local runtime overhead; they do not isolate Zod's CPU time.

After adding Zod, the learner measured another registration request:

- Captured 2026-11-04 at 09:45:03 UTC.
- Elapsed time: 468.270 ms.
- Result: HTTP 201; account ID 6.
- Raw output: `evidence/10-validation-timing-after.txt`.

The after sample is 70.719 ms (about 13.1%) lower than the before sample. This does not show that Zod made signup faster: the measurements are single requests, and the elapsed time includes bcrypt, SQLite, Express, and local scheduling. The earlier bcrypt benchmark measured one hash at 231.649 ms, so password hashing is likely a substantial part of each signup, but the request timer does not isolate the contribution of each component. This attribution is an inference from the separate benchmark, not a direct measurement of the request stages.
