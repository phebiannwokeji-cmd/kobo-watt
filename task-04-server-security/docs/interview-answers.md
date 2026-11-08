# Task 4 — Interview answers

These answers describe my Kobo Watt Task 4 work. I will explain them in my own words in the viva.

## 1. Why should you hash passwords?

I hash passwords so that Kobo Watt does not keep a readable copy of a customer’s password in the database. A password is a secret that a customer may also use on another website. If I stored it as plain text and somebody copied the database, they could immediately sign in as customers or try the same passwords on other services.

A hash is a one-way checking value. When a customer signs in, I do not need to recover the original password. I take the password they entered and use bcrypt to compare it with the stored bcrypt hash. If they match, the server can allow the sign-in. The original password does not need to be stored.

Hashing does not make a stolen database harmless. An attacker can still guess passwords offline and compare the results with the stored hashes. That is why Kobo Watt uses a deliberately slow password hash, bcrypt with cost 12, instead of a fast general-purpose hash.

Hashing also does not replace HTTPS, rate limiting, server-side validation, or safe password-reset design. It protects one specific danger: a database leak exposing immediately usable passwords. If the database is stolen, bcrypt makes each password guess expensive, giving customers more protection and giving Kobo Watt time to respond.

## 2. Why use bcrypt instead of SHA-256 for passwords?

I use bcrypt because passwords are usually short and human-chosen, so attackers can guess many likely passwords. A password hash must make each guess expensive. Bcrypt is designed for that job. It is adaptive, meaning I can increase its cost later as computers become faster.

Kobo Watt uses bcrypt cost 12. On my machine, one bcrypt hash took about 231.649 ms. That is slow enough to reduce an attacker’s guessing speed but still reasonable for a normal sign-in. Bcrypt also creates and stores a different salt for each password hash, and its comparison function uses the stored settings correctly.

SHA-256 is a good cryptographic hash for integrity checks, but it is the wrong tool for password storage. It is deliberately fast. My measurement produced roughly 661,862 SHA-256 guesses per second, compared with about 4.317 bcrypt guesses per second. That means SHA-256 let an attacker make about 153,000 times more guesses per second on my machine.

I did not choose bcrypt because it makes passwords impossible to crack. Weak passwords can still be guessed. I chose it because it slows an attacker after a database theft. Argon2id is also a strong modern password-hashing choice, but Kobo Watt’s implemented and measured choice is bcrypt cost 12.

## 3. What is a salt and why do you need it?

A salt is a new random value added to a password before it is hashed. It is not a second password and it does not need to be secret. Its job is to make the stored hash different even when two customers choose the same password.

Without salts, two people who use the same password would have the same stored hash. An attacker who steals the database could see that those customers share a password. They could also use precomputed lists of common password hashes, sometimes called rainbow tables, to test passwords very quickly.

With bcrypt, Kobo Watt does not need a separate database column for the salt. Bcrypt creates a random salt each time a password is hashed and stores it inside the bcrypt hash string with the algorithm and cost information. In my evidence, hashing the same sample password twice created two different bcrypt values, while both still used cost 12.

During sign-in, bcrypt reads the salt and cost from the stored hash, applies them to the entered password, and checks whether it matches. The salt therefore makes equal passwords look different in the database and makes precomputed attack tables much less useful. A salt is important, but it is not enough by itself: Kobo Watt also needs bcrypt because the hash function must be slow.

## 4. What salt rounds, or what work factor, should you use? Give a number and defend it.

Kobo Watt uses bcrypt cost 12. “Salt rounds” is often used informally, but bcrypt calls this setting a cost or work factor. Increasing the number makes bcrypt take more work for both the customer and an attacker.

I chose cost 12 because I measured it on my own development machine instead of copying a number blindly. One bcrypt hash took 231.649 ms. That was slow enough to reduce offline password guessing but still short enough for a normal customer sign-in. The rest of a real sign-in also includes network travel, database work, and server processing, so a few hundred milliseconds for password checking is a reasonable starting point for this prototype.

This is not a permanent universal number. A slower work factor gives better protection against an attacker with a stolen database, but it also uses more server CPU. If Kobo Watt had many simultaneous sign-ins, a cost that is too high could make the service slow or help an attacker create a denial-of-service problem.

Before production, I would measure sign-in response times and server capacity under realistic traffic. If hardware becomes faster and the service can still respond well, I would raise the cost gradually. I would not lower the cost merely to make a local benchmark look faster.

## 5. You are storing user passwords in a database. Of plain text, SHA-256, AES-256 encryption and adaptive hashing, which is correct and why are the other three wrong?

Adaptive password hashing is the correct choice for Kobo Watt. I use bcrypt with cost 12 because it is designed to make password guesses slow. It also creates a different salt for each stored password and includes the salt and work factor in the stored hash.

Plain text is wrong because a copied database immediately reveals every password. There is no attack cost for the thief. It also exposes customers who reused the password somewhere else.

SHA-256 is wrong for a different reason. It is one-way, so it does not reveal the original password directly. However, it is designed to be extremely fast. An attacker can try huge numbers of guesses after stealing the database. Adding a random salt helps stop precomputed tables and hides shared passwords, but it does not make SHA-256 slow enough for password storage.

AES-256 encryption is also wrong because encryption is reversible. Kobo Watt would need to store or access a decryption key. If an attacker gets both the database and the key, every password becomes readable. The application never needs to recover a customer’s password; it only needs to check a sign-in attempt.

Adaptive hashing is therefore the right fit: it is one-way, salted, deliberately expensive, and supports comparison without storing the original password.

## 6. Why is client-side validation not enough?

Client-side validation helps a genuine customer complete a form. It can show an error while the customer is typing, explain a password rule, or stop an obvious mistake before a network request. It is useful for usability, but it is not a security boundary.

An attacker does not have to use Kobo Watt’s form. They can open browser developer tools, change the JavaScript, use a script, send a request from PowerShell, or call the API directly with a tool such as curl or Postman. They can also use an old copy of the frontend that does not contain the newest rules.

I proved this in Kobo Watt by replaying a request that Task 3’s client-side flow had accepted. The same invalid data sent directly to the Task 4 server returned HTTP 400. The server rejected the invalid name, phone, email, address, password, and terms fields before it hashed a password or wrote to the database.

For that reason, the Task 4 server uses Zod schemas at the request boundary. The server validates registration, login, reset, verification, and resend requests. It also rejects unknown fields because the schemas are strict objects.

The browser is like a friendly helper at the front door. The server is the real lock. Every request must pass the server lock, even when it came from Kobo Watt’s own user interface.

## 7. What security checks belong in the frontend, and what must the server enforce regardless?

The frontend should help customers make correct choices early. Kobo Watt’s form can show required fields, explain password rules, format labels clearly, and show errors before submission. This reduces frustration and avoids unnecessary requests. The frontend can also disable a submit button while a request is in progress, but that is only a user-interface choice.

The server must enforce every rule that protects data, money, identity, or access. A customer cannot be trusted to enforce rules on their own device because an attacker controls their own browser and can send requests without the frontend.

For Kobo Watt registration, the server checks the full name, phone number, email shape, service address, password length, and acceptance of terms. It trims allowed outer whitespace, lowercases email addresses for lookup, preserves password case, checks breached passwords, hashes passwords with bcrypt, and prevents duplicate account emails through the database rule.

The server must also enforce rate limits, email verification, session checks, authorization, payment validation, and database constraints. The frontend may display a payment amount or hide a button, but the server must independently confirm the request is allowed.

I treat frontend checks as guidance for honest users. I treat server checks as the authority for everyone, including scripts, altered browsers, old app versions, and attackers.

## 8. The user interface hides the delete button for non-administrators. Is that enough? If not, what does an attacker do instead?

No. Hiding a delete button only changes what a person sees in the user interface. It does not remove the server route or stop somebody from sending their own request.

An attacker can inspect the application in browser developer tools, look at network requests, guess a common route such as `DELETE /api/accounts/123`, or write a small script that sends the request directly. They do not need the visible button. If the server accepts the request without checking identity and permission, the hidden-button design has failed.

The correct design is server-side authentication and authorization. Authentication answers, “Who is making this request?” Authorization answers, “Is this person allowed to delete this account?” The server should read the authenticated session, identify the account or operator, and check the required role before it changes anything.

For example, a Kobo Watt customer should only be able to manage their own account. An operator may need limited access to assigned customer records. A non-administrator must receive a refusal from the server even if they create a direct request manually.

Hiding the button can still be helpful because it reduces confusion for normal users. It is not security. The actual protection must live at the server route, next to the database action that could delete or change important information.

## 9. What is the difference between validation, encoding and sanitisation?

Validation asks whether incoming data is acceptable for a particular use. For example, Kobo Watt validates that a verification code contains exactly six digits, a phone number contains 10 to 14 digits, and registration terms are literally accepted. Invalid data is rejected before it reaches sensitive work such as password hashing or database writes.

Encoding changes data into a safe form for a particular output context. For example, when Kobo Watt places a customer name in an HTML email, it HTML-escapes characters such as `<`, `>`, and `&`. This stops a name from being treated as HTML markup inside the email.

Sanitisation changes or removes unwanted input. It can be useful for some fields, but it must be used carefully. If I silently change important customer data, I may create confusion or hide an attack. Kobo Watt trims allowed outer whitespace from email and password fields, but it preserves password letter case. It does not silently invent a new email address or turn invalid data into valid data.

These are different jobs. Validation decides whether to accept input. Encoding protects output in its destination format. Sanitisation transforms input according to a clear rule.

I do not rely on one for the other. A valid name can still need HTML encoding before it appears in an email. A safely encoded value can still be invalid for a phone field. Kobo Watt needs the right protection at each boundary.

## 10. Why would you replace the incoming request body with the parsed and validated data rather than leaving both available?

I replace `req.body` with Zod’s parsed result so that later server code uses only data that passed the schema. This creates one trusted version of the request body after validation.

If I left the original raw body available, a later developer could accidentally use an unvalidated field. For example, they might validate a registration request but later read a hidden extra property from the original object, or use an untrimmed email instead of the parsed value. That would weaken the validation boundary and make the code harder to review.

Kobo Watt uses strict Zod objects. They reject unknown keys and return a clean object containing only the fields the route expects. The validation middleware then assigns `req.body = result.data`. Registration, login, reset, verification, and resend handlers all receive the parsed body rather than a mixture of trusted and untrusted values.

This does not mean the parsed data is safe for every possible future use. A value may still need HTML escaping before it is inserted into an email, and database queries still need safe parameter handling. It means the request has passed the rules for that route before business logic starts.

Replacing the body is like taking a checked bag through airport security and then using the checked bag, not keeping an uninspected second bag beside it.

## 11. Why validate route parameters and query strings, not just the body?

Request bodies are not the only place where attackers send input. Route parameters and query strings are also controlled by the person making the request.

A route parameter is part of the path, such as `/api/accounts/123`. A query string is the part after a question mark, such as `?page=2&status=active`. If a server uses those values without checking them, an attacker can send letters where an ID is expected, very large page sizes, repeated values, invalid dates, or values intended to make a database query expensive.

Even parameterised database queries are not enough by themselves. Parameterisation protects against one kind of injection, but it does not decide whether account `123` is a valid number, whether the requester is allowed to see it, or whether a page size of one million is sensible.

Kobo Watt’s current Task 4 routes mainly accept JSON bodies, so those bodies are validated with Zod. As the product adds account pages, operator routes, payment history, and search, I would add schemas for route parameters and query strings too.

I would validate their type, range, length, allowed values, and relationship to the authenticated customer. Then I would authorize access separately. Every place where the customer controls text or numbers is an input boundary, not only the request body.

## 12. How do you rate limit unauthenticated requests, and what is the problem with the header you would reach for first?

For an unauthenticated request, I do not yet know which customer is making it. I therefore use the source IP address as a temporary key and count requests within a 15-minute window. Kobo Watt has separate limits for separate risks: 10 registrations, 20 login attempts, and 5 password-reset requests per IP address.

I keep the counters separate because registration, login, and reset have different normal behaviour and different abuse costs. A login can include real typing mistakes, while a password reset sends an email and can be used to harass somebody. The limiters run before Zod validation, so malformed requests also count. Otherwise an attacker could send deliberately invalid bodies forever without using their quota.

The header I would be tempted to use is `X-Forwarded-For`. It can contain an original client IP when a trusted reverse proxy adds it. The problem is that a normal internet client can also send its own fake `X-Forwarded-For` header. If my application trusts that header directly, an attacker can change the claimed IP on every request and bypass the limit.

Kobo Watt therefore sets Express not to trust proxies in this local setup. In production, I would trust forwarded headers only when the application sits behind a known, correctly configured proxy that removes client-supplied copies and adds its own reliable value.

## 13. Which rate limiting algorithm would you choose for a production API, and what is the boundary burst problem?

For a production Kobo Watt API, I would choose a token-bucket limiter stored in a shared service such as Redis. A token bucket gives each customer or IP a small bucket of request tokens. Requests take a token, and tokens return gradually over time. This allows a small, normal burst while still controlling the long-term request rate.

The current assessment application uses a simple 15-minute in-memory window. It is easy to understand and good enough to demonstrate the rule on one local server. However, it has a boundary burst problem. If a fixed window ends at a certain time, an attacker can send requests just before the window ends and then immediately send more just after the next window begins. They can make almost twice the intended burst in a very short period while still technically staying inside each separate window.

A token bucket smooths this behaviour because tokens refill continuously instead of resetting suddenly at a boundary. It also lets me give legitimate customers a small burst for actions such as retrying a login after a connection problem.

I would still use different limits for registration, login, reset, and verification. No one algorithm replaces judgement about which endpoint is being protected.

## 14. Why use a shared store for your counters rather than in-memory counters on each server?

An in-memory counter lives inside one running Node process. That is suitable for my local Kobo Watt exercise because there is one server process on one computer. It is not enough for production.

If Kobo Watt runs two application servers, each server has its own memory and its own separate counter. An attacker can send requests through a load balancer and receive a fresh limit when the next request reaches the other server. With three servers, the attacker may effectively receive three quotas. Restarting one server also clears its in-memory counters, which creates another way for limits to disappear.

A shared store means every server reads and updates the same counter. For example, Redis can hold a token bucket or other limiter state for the customer, account, or IP. It lets the limit apply consistently regardless of which Kobo Watt server receives the request.

A shared store also makes monitoring easier. I can see rate-limit failures in one place instead of guessing which server handled them. It does introduce a new dependency, so I must secure it, monitor it, and decide what happens if it is unavailable.

For this assessment, in-memory counters prove the basic rule. Before a multi-server deployment, Kobo Watt needs a shared rate-limit store.

## 15. What HTTP status code should a rate limiter return, and why is 403 the wrong choice?

A rate limiter should return HTTP 429, “Too Many Requests.” Kobo Watt uses HTTP 429 when a customer or script reaches the limit for registration, login, or password reset. The response explains that the limit has been reached and tells the person to try again after the 15-minute window.

HTTP 429 is useful because it tells a browser, mobile app, monitoring system, or developer what happened. The request was understood, but too many requests were made in the allowed period. A client can wait and retry later. Production systems can also include a `Retry-After` header to make the waiting period clearer.

HTTP 403 is wrong because it means “Forbidden.” It normally says the server understood the request and the requester is not allowed to perform that action because of their permissions or authorization. For example, a customer trying to access an operator-only route may correctly receive HTTP 403.

A rate-limited customer is not necessarily forbidden permanently. They may be legitimate and simply have made too many attempts, perhaps because they mistyped a password or share a campus network with other people. Returning 403 would make the problem look like an account-permission decision rather than a temporary traffic-control decision.

Clear status codes matter because they help both customers and developers understand the correct next action.

## 16. What do you do when your rate limit store is unavailable: fail open or fail closed? Answer for your own application specifically.

For Kobo Watt’s unauthenticated security endpoints, I would fail closed if the shared production rate-limit store becomes unavailable. Registration, login, password reset, and verification are all attractive attack targets. If I silently fail open, an attacker can use the outage to make unlimited password guesses, create many accounts, or send repeated reset emails.

Failing closed means refusing the request temporarily with a clear HTTP 503 service-unavailable response. I would not return HTTP 429, because the customer did not exceed a known limit; Kobo Watt could not check the limit safely. I would log and alert on the store failure so the team can restore it quickly.

This choice has a real trade-off. A genuine customer may be unable to sign in or request a reset while the rate-limit store is down. That is frustrating, especially for a customer trying to check an account or make a payment. However, allowing unlimited authentication attempts during a security-control outage creates a larger account-compromise risk.

I would reduce the customer impact with redundant shared-store infrastructure, health checks, monitoring, and a short maintenance message. I would also separate public routes from already authenticated, low-risk read-only routes where appropriate. For Kobo Watt’s current local prototype, the in-memory limiter has no shared store, so this production failure mode is documented rather than implemented.

## 17. What do my password-hashing timing numbers mean for a stolen database?

My local test showed that bcrypt at cost 12 took about 231.649 ms for one password hash. That is about 4.317 guesses each second on my computer. SHA-256 was much faster: about 661,862 guesses each second. On this computer, that is roughly 153,320 times more guesses than bcrypt.

If an attacker steals the database, they can guess passwords offline. They do not need to use the Kobo Watt login page, so the website rate limit does not stop them. Bcrypt does not make guessing impossible, but it makes every guess much slower. This gives customers with strong, unique passwords much better protection.

These are measurements from my Windows computer, not a promise about every attacker’s computer. An attacker may have faster hardware or many machines. That is why Kobo Watt also needs strong passwords, unique salts, breached-password checks, and later stronger controls such as MFA.

## 18. How does the HIBP range check protect the password?

When somebody registers, Kobo Watt makes a SHA-1 version of the password locally. It sends HIBP only the first five characters of that SHA-1 value. HIBP sends back a list of possible hash endings. Kobo Watt compares the remaining 35 characters of its own hash against that list locally.

HIBP therefore does not receive the plain password or the complete SHA-1 hash from Kobo Watt. It receives a short prefix, plus normal request information such as the server connection. This is safer, but it is not the same as saying HIBP learns nothing.

Sending the plain password would be dangerous because it is the customer’s real secret. An outside service, its logs, or compromised systems could misuse it. Sending the full SHA-1 hash would also be unsafe because it is an exact, stable fingerprint that can be tested against guessed passwords and wordlists. Sending only the first five characters gives HIBP a group to search while Kobo Watt keeps the final matching decision locally.

## 19. Why is “SHA-256 plus a salt and IP rate limiting makes brute force impossible” wrong?

That statement is too strong. A random salt is useful because two people with the same password get different stored hashes. It also makes precomputed rainbow-table attacks much less useful. But a salt does not make SHA-256 slow. My test showed SHA-256 can still make about 661,862 guesses each second on my computer.

IP rate limiting helps with online attacks against Kobo Watt’s login route. It can slow down repeated attempts from one IP address. It does not protect a stolen password database, because an attacker can guess offline without calling Kobo Watt at all. It can also affect innocent people who share an office, school, or campus IP address, while determined attackers may use many IP addresses.

The better claim is that Kobo Watt uses several layers. It stores passwords with bcrypt cost 12 and a unique salt, checks new passwords against known breaches, validates inputs on the server, and rate-limits online attempts. These controls reduce risk; they do not make password guessing impossible.