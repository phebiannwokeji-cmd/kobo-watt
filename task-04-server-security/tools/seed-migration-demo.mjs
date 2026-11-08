import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";

const databasePath = fileURLToPath(
  new URL("../data/kobo-watt-04.db", import.meta.url),
);
const database = new Database(databasePath);
const timestamp = new Date().toISOString();

try {
  database.prepare(`
    INSERT INTO accounts (
      email,
      password_hash,
      full_name,
      phone,
      service_address,
      is_verified,
      terms_accepted_at,
      updated_at
    ) VALUES (
      @email,
      @passwordHash,
      @fullName,
      @phone,
      @serviceAddress,
      0,
      @termsAcceptedAt,
      @updatedAt
    )
    ON CONFLICT(email) DO NOTHING
  `).run({
    email: "migration-demo@example.test",
    passwordHash: "not-a-real-password-hash-for-migration-practice",
    fullName: "Migration Demo",
    phone: "08000000000",
    serviceAddress: "1 Sample Street, Ikeja, Lagos",
    termsAcceptedAt: timestamp,
    updatedAt: timestamp,
  });

  const account = database
    .prepare(`
      SELECT id, email, full_name, is_verified, created_at, updated_at
      FROM accounts
      WHERE email = ?
    `)
    .get("migration-demo@example.test");
  const { count } = database
    .prepare("SELECT COUNT(*) AS count FROM accounts")
    .get();

  console.log("Migration exercise seed row:");
  console.log(JSON.stringify(account, null, 2));
  console.log(`Total account rows: ${count}`);
  console.log("The password_hash value is a placeholder, not a usable credential.");
} finally {
  database.close();
}
