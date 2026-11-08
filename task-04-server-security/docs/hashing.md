# Password hashing — Task 4

## Algorithm and cost

The selected algorithm is bcrypt with cost 12, consistent with the Task 3 remediation notes. Bcrypt is adaptive: increasing its cost raises the work needed to compute each password hash. The cost is 12 for this project; the observed timing below is measured on the learner's machine, not copied from a reference machine.

The implementation uses bcrypt's asynchronous API. Bcrypt generates a salt for each hash and encodes the salt and work factor in the resulting hash string. Hashing the same sample password twice should therefore produce different output; password verification uses bcrypt's compare operation rather than hashing and comparing strings manually.

No separate salt column is needed: bcrypt stores the per-hash salt in its encoded output. A unique salt also prevents equal passwords from producing equal stored hashes and frustrates precomputed lookup tables. Without salts, a stolen database would reveal which accounts share a password and precomputed hashes could be checked directly.

## Machine measurements

Captured on Node v24.19.0, Windows x64, using the sample password `Kobo Watt Task 4 local benchmark only`.

- bcrypt cost 12: one measured hash took 231.649 ms, or 4.317 guesses/second.
- SHA-256: 100,000 hashes took 151.089 ms. Dividing by 100,000 gives 0.00151089 ms per hash and approximately 661,861.552 guesses/second.
- Based on those displayed numbers, SHA-256 allows roughly 153,320 times as many guesses per second as this bcrypt setting. The benchmark's raw SHA rate is based on the timer's unrounded value; see the arithmetic note in `evidence/08-timing-bcrypt-vs-sha.txt`.

Both bcrypt hashes differed, and `bcrypt.getRounds` reported 12. Their embedded salts make each output unique even for the same input. The evidence files contain the terminal output: `evidence/07-hash-twice-different.txt` and `evidence/08-timing-bcrypt-vs-sha.txt`.

## Learner explanation

> bcrypt generates a new random salt on every call, even when the password is identical. That salt is mixed into the password before scrambling, so the same password produces a completely different output each time.

> Look at the first 29 characters of each hash: `$2b$12$` is the algorithm and cost, and the next 22 characters are the salt. bcrypt stores the salt with the hash so verification can re-derive it later.

## Why the slow hash matters

The learner's explanation, supplied during the exercise:

> A normal login already spends roughly 0.5–1 second on network round-trips, TLS, database lookups, and JSON. Adding 232 ms of CPU work fits inside that budget and the human never notices.
>
> An attacker who has stolen a password database is running a wordlist, a list of millions of candidate passwords, and running bcrypt against every one of them until a hash matches.

Illustrative login timeline from the learner's explanation (not measured end-to-end in this project):

```text
network in     ~100 ms
DB lookup      ~20  ms
bcrypt check   ~232 ms
network out    ~100 ms
total          ~450 ms
```

The machine measurements show the attacker-side difference directly: about 4.317 bcrypt guesses per second at cost 12, compared with about 661,862 SHA-256 guesses per second. On this machine and with this sample, SHA-256 permits roughly 153,320 times as many guesses per second.
