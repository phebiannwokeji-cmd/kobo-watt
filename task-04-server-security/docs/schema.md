# Database Schema Architecture — Kobo Watt Task 4

## 1. Schema Overview & Relational Topology

The Kobo Watt database manages solar/inverter installations, authenticated customer sessions, commercial settlements, payment audit trails, and technical manual knowledge retrieval for the Ikeja, Lagos operations.

The relational design enforces referential integrity through foreign keys, prevents floating-point monetary precision corruption by storing currency in integer kobo, and isolates settled payments from transient or failed payment attempts.

```
       +-----------------------+
       |       accounts        |
       +-----------------------+
       | id (PK)               |
       | email (UNIQUE)        |
       +-----------+-----------+
                   |
       +-----------+-----------+-----------------------+
       | 1:N                   | 1:N                   | 1:N (optional)
       v                       v                       v
+---------------+       +---------------+       +------------------+
|   sessions    |       |   payments    |       | payment_attempts |
+---------------+       +---------------+       +------------------+
| id (PK)       |       | id (PK)       |       | id (PK)          |
| account_id(FK)|       | account_id(FK)|       | account_id(FK)   |
+---------------+       +---------------+       +------------------+

Standalone Knowledge Engine:
+-----------------------+
|   knowledge_chunks    |
+-----------------------+
| id (PK)               |
| document_title        |
| chunk_index           |
+-----------------------+
```

---

## 2. Table Specifications

### Table 1: `accounts` (The People Who Use the System)
Stores user credentials, contact identities, verification states, and legal consent audit timestamps.

| Column | Type | Nullable | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `NOT NULL` | Primary Key, Auto-incrementing internal integer identifier. |
| `email` | `TEXT` | `NOT NULL` | Normalized lowercase email address. Unique constraint. |
| `password_hash` | `TEXT` | `NOT NULL` | Cryptographic bcrypt password hash (60 characters). |
| `full_name` | `TEXT` | `NOT NULL` | Legal full name (for service contracts and warranty certificates). |
| `phone` | `TEXT` | `NOT NULL` | Digits-only mobile contact number (10 to 14 digits). |
| `service_address` | `TEXT` | `NOT NULL` | Physical installation address for engineer dispatch. |
| `is_verified` | `INTEGER` | `NOT NULL` | `0` = pending activation, `1` = email verified via token. Default `0`. |
| `terms_accepted_at`| `TEXT` | `NOT NULL` | ISO-8601 timestamp of NDPR legal consent acceptance. |
| `created_at` | `TEXT` | `NOT NULL` | ISO-8601 timestamp of record insertion (`datetime('now')`). |
| `updated_at` | `TEXT` | `NOT NULL` | ISO-8601 timestamp of last record mutation. |

- **Indexes:**
  - `idx_accounts_email` ON `accounts(email)`:
    - *Why:* Optimizes authentication lookups (`WHERE email = ?`) during login, password reset, and registration deduplication.
    - *Write Cost:* Minimal write overhead; requires updating a single B-tree node per account creation.

---

### Table 2: `sessions` (User Sessions)
Maintains active authentication sessions with cryptographically secure random token identifiers.

| Column | Type | Nullable | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `NOT NULL` | Primary Key. 64-character hex cryptographically random token. |
| `account_id` | `INTEGER` | `NOT NULL` | Foreign Key referencing `accounts(id)` ON DELETE CASCADE. |
| `ip_address` | `TEXT` | `NOT NULL` | Client IP address (IPv4 or IPv6) for session binding and anomaly detection. |
| `user_agent` | `TEXT` | `NOT NULL` | Client browser user-agent header string for session fingerprinting. |
| `expires_at` | `TEXT` | `NOT NULL` | ISO-8601 timestamp after which the session is invalid (e.g. 14 days). |
| `created_at` | `TEXT` | `NOT NULL` | ISO-8601 timestamp of session creation. |

- **Relationship:** One-to-Many (`accounts.id -> sessions.account_id`). One user can have multiple concurrent active sessions across mobile and laptop devices.
- **Indexes:**
  - `idx_sessions_account_id` ON `sessions(account_id)`:
    - *Why:* Enables fast retrieval of all active sessions belonging to a user (e.g. "log out everywhere").
    - *Write Cost:* Incurred upon each login; trivial overhead relative to argon2/bcrypt hashing compute latency.
  - `idx_sessions_expires_at` ON `sessions(expires_at)`:
    - *Why:* Enables high-speed automated garbage collection queries (`DELETE FROM sessions WHERE expires_at < datetime('now')`).
    - *Write Cost:* Marginal B-tree insertion cost; saves table scans on cron cleanup.

---

### Table 3: `payments` (Settled Money Transactions)
Stores settled, verified monetary receipts for completed solar hardware deposits and service calls.

| Column | Type | Nullable | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `NOT NULL` | Primary Key, Auto-incrementing integer. |
| `account_id` | `INTEGER` | `NOT NULL` | Foreign Key referencing `accounts(id)` ON DELETE RESTRICT. |
| `reference` | `TEXT` | `NOT NULL` | Unique settlement reference (e.g. `KW-PAY-202611-0042`). Unique constraint. |
| `amount_kobo` | `INTEGER` | `NOT NULL` | Transaction amount in smallest currency unit (Kobo). No floating point. |
| `currency` | `TEXT` | `NOT NULL` | ISO 4217 currency code (default `'NGN'`). |
| `service_type` | `TEXT` | `NOT NULL` | Settlement category (`INVERTER_DEPOSIT`, `BATTERY_UPGRADE`, `MAINTENANCE`). |
| `status` | `TEXT` | `NOT NULL` | Final ledger state (`SETTLED`, `REFUNDED`). |
| `paid_at` | `TEXT` | `NOT NULL` | ISO-8601 timestamp of confirmed gateway settlement. |
| `created_at` | `TEXT` | `NOT NULL` | ISO-8601 timestamp of database record generation. |

- **Relationship:** One-to-Many (`accounts.id -> payments.account_id`).
- **Indexes:**
  - `idx_payments_account_id` ON `payments(account_id)`:
    - *Why:* Speeds up customer invoice and payment history retrieval in the customer portal.
    - *Write Cost:* Added cost only when payment settles; read benefits during invoice generation far outweigh write cost.
  - `idx_payments_reference` ON `payments(reference)`:
    - *Why:* Enforces strict idempotency and instant lookups when gateway webhooks deliver settlement notifications.
    - *Write Cost:* B-tree maintenance on insert; indispensable for double-spend prevention.

---

### Table 4: `payment_attempts` (Failed, Abandoned, or Timed-Out Attempts)
Maintains an immutable forensic audit log of all payment attempts regardless of outcome.

| Column | Type | Nullable | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `NOT NULL` | Primary Key, Auto-incrementing integer. |
| `account_id` | `INTEGER` | `NULL` | Nullable Foreign Key referencing `accounts(id)`. Null if user dropped off before auth. |
| `reference` | `TEXT` | `NOT NULL` | Gateway attempt tracking reference (e.g. `KW-ATT-98124`). Unique constraint. |
| `amount_kobo` | `INTEGER` | `NOT NULL` | Attempted amount in Kobo. |
| `currency` | `TEXT` | `NOT NULL` | ISO 4217 currency code (default `'NGN'`). |
| `service_type` | `TEXT` | `NOT NULL` | Target service category. |
| `provider` | `TEXT` | `NOT NULL` | Payment channel (`PAYSTACK`, `FLUTTERWAVE`, `DIRECT_BANK_TRANSFER`). |
| `failure_reason` | `TEXT` | `NOT NULL` | Diagnostic category (`INSUFFICIENT_FUNDS`, `NETWORK_TIMEOUT`, `USER_ABANDONED`). |
| `error_code` | `TEXT` | `NULL` | Raw provider error payload or bank gateway code (e.g. `ERR_NIBSS_ROUTING`). |
| `created_at` | `TEXT` | `NOT NULL` | ISO-8601 timestamp of attempt initiation. |

- **Relationship:** One-to-Many (`accounts.id -> payment_attempts.account_id`, optional).
- **Indexes:**
  - `idx_payment_attempts_account_id` ON `payment_attempts(account_id)`:
    - *Why:* Allows support staff to review recent failed checkout attempts when assisting a customer on the phone.
    - *Write Cost:* Incurred on failed checkouts; negligible impact on overall system throughput.
  - `idx_payment_attempts_created_at` ON `payment_attempts(created_at)`:
    - *Why:* Essential for time-series funnel analysis (aggregating failure rates by hour or week) and date-range tax audits.
    - *Write Cost:* Sequential B-tree appends; highly efficient under SQLite.

---

### Table 5: `knowledge_chunks` (RAG Retrieval Engine for Inverter Manuals)
Stores segmented textual passages, token counts, and vector embeddings for technical troubleshooting and customer support AI retrieval.

| Column | Type | Nullable | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `NOT NULL` | Primary Key, Auto-incrementing integer. |
| `document_title` | `TEXT` | `NOT NULL` | Source manual title (e.g. `Luminous 5kVA Inverter User Manual`). |
| `chunk_index` | `INTEGER` | `NOT NULL` | Sequential segment index within the document (0, 1, 2...). |
| `content` | `TEXT` | `NOT NULL` | Raw verbatim text passage (200–500 tokens). |
| `token_count` | `INTEGER` | `NOT NULL` | Computed token length of the chunk. |
| `embedding_json` | `TEXT` | `NULL` | Serialized float vector array for cosine similarity search. |
| `created_at` | `TEXT` | `NOT NULL` | ISO-8601 timestamp of knowledge ingestion. |

- **Indexes:**
  - `idx_chunks_doc_chunk` ON `knowledge_chunks(document_title, chunk_index)`:
    - *Why:* Accelerates windowed context retrieval (fetching adjacent chunks before and after a hit) during RAG generation.
    - *Write Cost:* Incurred only during offline ingestion or document updates; zero overhead on runtime user requests.

---

## 3. Denormalisation & Stored Duplications

In strict Third Normal Form (3NF), storing the customer's phone number or service address in transaction receipts is prohibited if it already lives in `accounts`. However, in `payments` and `payment_attempts`, the customer's `amount_kobo`, `currency`, and `service_type` are recorded alongside the transaction timestamp:

- **Where the same fact is stored twice:** The intended `service_type` is recorded in `payment_attempts` when initiated, and replicated in `payments` when settled. Furthermore, when customer invoicing is generated, site address snapshots are frozen at the point of billing.
- **Why this is accepted:** Financial accounting requires point-in-time immutability. If a customer changes their installation address in their profile next year, historical payment receipts from today must reflect the physical site and pricing agreed upon at the moment of payment, not current profile mutations. Denormalizing point-in-time transaction snapshots prevents retroactive ledger distortion.

---

## 4. The Two Essential Justifications for `payment_attempts`

Most beginner applications build a single `payments` table and overwrite failed rows or discard them entirely. Kobo Watt isolates `payment_attempts` from `payments` for two indispensable operational reasons:

### Reason 1: Operational Drop-Off & Checkout Funnel Analytics
Without tracking failed and abandoned attempts, the business is blind to checkout attrition. If 40 out of 100 customers attempting to pay a ₦50,000 inverter repair fee abandon the payment modal, `payment_attempts` captures whether the friction stems from user hesitation (`USER_ABANDONED`), card authorization declines (`INSUFFICIENT_FUNDS`), or inter-bank gateway failures (`ERR_NIBSS_ROUTING`). This diagnostic telemetry directly informs gateway failover strategies, checkout UI redesigns, and automated recovery notifications.

### Reason 2: Regulatory Audit, Commercial Litigation & Tax Authority Compliance
In Nigeria, companies operating digital payment channels are subject to strict scrutiny by the Federal Inland Revenue Service (FIRS) and the Lagos State Internal Revenue Service (LIRS). Tax authorities do not merely examine revenue; they audit reconciliation discrepancies between gateway gross transaction volumes and settled bank disbursements. 

If a tax auditor or commercial arbitrator questions why gateway logs record ₦12,500,000 in payment requests while Kobo Watt's books declare only ₦8,000,000 in revenue, the immutable `payment_attempts` table provides immediate, forensic legal proof that the ₦4,500,000 variance comprised timed-out, canceled, or reversed bank charges that never settled into Kobo Watt's custody.

---

## 5. Tax Authority Audit Scenario (14-Month Retrospective Inquiry)

> *If the state or federal tax authority (LIRS/FIRS) asked Kobo Watt to account for a specific transaction from fourteen months ago, what would we do?*

We would execute a deterministic, multi-ledger reconciliation across our database and gateway records:

1. Query `payments` using the transaction reference or timestamp window:
   ```sql
   SELECT p.*, a.full_name, a.email, a.phone 
   FROM payments p 
   JOIN accounts a ON p.account_id = a.id 
   WHERE p.reference = 'KW-PAY-202509-0418' 
      OR (p.paid_at BETWEEN '2025-09-01' AND '2025-09-05' AND p.amount_kobo = 4500000);
   ```
2. If the transaction settled successfully, we extract the row containing the exact timestamp (`paid_at`), the immutable gross amount (`4500000` Kobo = ₦45,000.00), the associated account identity, and the processor settlement reference. We cross-reference this against the corresponding Paystack/Flutterwave monthly disbursement payout batch and our corporate bank statement for September 2025.
3. If the transaction was disputed because it failed or was reversed at the card network level, we query `payment_attempts`:
   ```sql
   SELECT * FROM payment_attempts WHERE reference LIKE '%0418%' OR created_at LIKE '2025-09%';
   ```
   This extracts the exact provider error code (`ERR_NIBSS_TIMEOUT` or `INSUFFICIENT_FUNDS`), proving that the customer initiated a charge but no funds were ever credited to Kobo Watt's ledger.
4. We compile the query output, raw JSON gateway response payload, and matching bank statement excerpt into a formal signed audit report, demonstrating complete ledger integrity without guessing or reconstructed data.

