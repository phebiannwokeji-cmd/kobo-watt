import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";

const databasePath = fileURLToPath(
  new URL("../data/kobo-watt-04.db", import.meta.url),
);
const database = new Database(databasePath);

try {
  const result = database.prepare(`
    UPDATE accounts
    SET account_status = CASE
      WHEN is_verified = 1 THEN 'ACTIVE'
      ELSE 'PENDING_VERIFICATION'
    END
    WHERE account_status IS NULL
  `).run();

  const accounts = database.prepare(`
    SELECT id, email, is_verified, account_status
    FROM accounts
    ORDER BY id
  `).all();

  console.log(`Backfilled account rows: ${result.changes}`);
  console.log("Account status after backfill:");
  console.log(JSON.stringify(accounts, null, 2));
} finally {
  database.close();
}
