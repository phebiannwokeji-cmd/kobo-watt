# Known Defects and Production Impact

**Deliverable:** Task 2, Step 10 (`docs/defects.md`)  
**Context:** Auditing real defects and omissions in the Task 2 codebase with exact file and line references.

---

## Defect 1: Missing Rate Limiting and Endpoint Abuse Protection

- **File:** `task-02-repository-and-scaffold/server.js`
- **Lines:** 73–75
- **The Issue:**  
  The endpoint `POST /api/enquiries` accepts unauthenticated JSON payloads without any client request rate limiting, IP throttling, or captcha verification. The only incoming traffic guard is Express’s `limit: '4kb'` body parser limit.
- **Production Cost:**  
  In a production environment, an automated script or malicious actor could send thousands of concurrent POST requests per second. Because each request triggers a synchronous SQLite write transaction, this would exhaust available file handles, trigger `SQLITE_BUSY` lock timeouts for legitimate users, fill available server disk space with junk records, and degrade CPU performance for the entire application.

---

## Defect 2: Lack of Idempotency Mechanism on Form Submissions

- **File:** `task-02-repository-and-scaffold/server.js`
- **Lines:** 89–94
- **The Issue:**  
  The endpoint executes an unqualified SQL `INSERT INTO enquiries (name, phone, business_type) VALUES (?, ?, ?)` on every request without requiring a client-generated UUID idempotency key or enforcing uniqueness constraints on recent submissions.
- **Production Cost:**  
  On mobile networks with unstable latency (common in areas like Ikeja, Lagos), a customer submitting an enquiry on 3G may experience a connection drop right after the server completes the write but before the HTTP 201 response reaches the browser. Thinking the submission stalled, the user taps "Submit" again. Without idempotency checking, duplicate rows are created in the database, resulting in duplicate sales calls, confused customer records, and distorted conversion metrics.

---

## Defect 3: Single-Process Synchronous SQLite Write Contention

- **File:** `task-02-repository-and-scaffold/server.js`
- **Lines:** 90–93
- **The Issue:**  
  Database writes use synchronous `better-sqlite3` execution on the main Node event loop thread (`db.prepare(...).run(...)`). SQLite locks the database file exclusively during write operations.
- **Production Cost:**  
  While SQLite is optimal for local development and fast reads, handling concurrent traffic in production without a write queue or transition to a multi-client relational database (such as PostgreSQL) means any slow disk I/O blocks the Node.js event loop for all incoming requests, spiking request latency from 15ms to several seconds.

---

## Defect 4: Synchronous Server Startup Without Read-Only Fallback Grace

- **File:** `task-02-repository-and-scaffold/server.js`
- **Lines:** 8–9
- **The Issue:**  
  The database connection is opened at the top level during module execution (`const db = openDatabase(...)`). If the database file is corrupted or locked by another process during container startup, the entire server crashes immediately with an unhandled exception before listening on the port.
- **Production Cost:**  
  Container orchestrators (like Kubernetes or Cloud Run) would enter a crash loop backoff, preventing the application from serving even static cached assets or health-check endpoints.
