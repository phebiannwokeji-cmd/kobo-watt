/*
  Warnings:

  - Made the column `account_status` on table `accounts` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "service_address" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "account_status" TEXT NOT NULL,
    "terms_accepted_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_accounts" ("account_status", "created_at", "email", "full_name", "id", "is_verified", "password_hash", "phone", "service_address", "terms_accepted_at", "updated_at") SELECT "account_status", "created_at", "email", "full_name", "id", "is_verified", "password_hash", "phone", "service_address", "terms_accepted_at", "updated_at" FROM "accounts";
DROP TABLE "accounts";
ALTER TABLE "new_accounts" RENAME TO "accounts";
CREATE UNIQUE INDEX "idx_accounts_email" ON "accounts"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
