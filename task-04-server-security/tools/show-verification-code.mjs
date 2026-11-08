import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.ts";
import { normalizeEmail } from "../src/normalization.js";

const email = normalizeEmail(process.argv[2]);
if (!email) {
  console.error("Usage: node tools/show-verification-code.mjs <account-email>");
  process.exitCode = 2;
} else {
  const adapter = new PrismaBetterSqlite3({ url: "file:./data/kobo-watt-04.db" });
  const prisma = new PrismaClient({ adapter });
  try {
    const account = await prisma.account.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isVerified: true,
        accountStatus: true,
        verificationCodes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { code: true, createdAt: true, expiresAt: true, usedAt: true, attemptCount: true },
        },
      },
    });
    if (!account) {
      console.error("No account found for that email.");
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify({ ...account, email: "[redacted]" }, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}
