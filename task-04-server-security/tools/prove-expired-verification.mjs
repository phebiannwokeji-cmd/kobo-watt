import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.ts";

const email = process.argv[2]?.trim().toLowerCase();
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3002";
if (!email) {
  console.error("Usage: node tools/prove-expired-verification.mjs <unverified-account-email>");
  process.exit(2);
}

const adapter = new PrismaBetterSqlite3({ url: "file:./data/kobo-watt-04.db" });
const prisma = new PrismaClient({ adapter });

try {
  const account = await prisma.account.findUnique({
    where: { email },
    select: { id: true, isVerified: true, verificationCodes: {
      orderBy: { createdAt: "desc" },
      take: 1,
      select: { id: true, code: true, createdAt: true, expiresAt: true, usedAt: true },
    } },
  });
  const challenge = account?.verificationCodes[0];
  if (!account || account.isVerified || !challenge || challenge.usedAt) {
    throw new Error("Use a new, unverified account with an unused code.");
  }

  const expiredAt = new Date(Date.now() - 1000);
  await prisma.verificationCode.update({
    where: { id: challenge.id },
    data: { expiresAt: expiredAt },
  });

  console.log(`Captured at: ${new Date().toISOString()}`);
  console.log("Command: node tools/prove-expired-verification.mjs <test-account-email>");
  console.log("Expired verification row:");
  console.log(JSON.stringify({ ...challenge, expiresAt: expiredAt }, null, 2));
  const response = await fetch(`${baseUrl}/api/email-verifications`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, code: challenge.code }),
  });
  const body = await response.text();
  console.log(`Expired-code response: HTTP ${response.status} ${body}`);
  if (response.status !== 400) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
