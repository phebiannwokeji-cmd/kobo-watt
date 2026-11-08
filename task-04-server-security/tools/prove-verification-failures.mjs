import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.ts";

const email = process.argv[2]?.trim().toLowerCase();
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3002";
if (!email) {
  console.error("Usage: node tools/prove-verification-failures.mjs <unverified-account-email>");
  process.exit(2);
}

const adapter = new PrismaBetterSqlite3({ url: "file:./data/kobo-watt-04.db" });
const prisma = new PrismaClient({ adapter });

async function submit(code) {
  const response = await fetch(`${baseUrl}/api/email-verifications`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  return { status: response.status, body: await response.text() };
}

try {
  const account = await prisma.account.findUnique({
    where: { email },
    select: {
      id: true,
      isVerified: true,
      accountStatus: true,
      verificationCodes: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { code: true, createdAt: true, expiresAt: true, usedAt: true, attemptCount: true },
      },
    },
  });
  const challenge = account?.verificationCodes[0];
  if (!account || account.isVerified || !challenge || challenge.usedAt || challenge.expiresAt <= new Date()) {
    throw new Error("Use a new, unverified account with a current code and no previous attempts.");
  }

  console.log(`Captured at: ${new Date().toISOString()}`);
  console.log("Command: node tools/prove-verification-failures.mjs <test-account-email>");
  console.log("Verification row before attempts:");
  console.log(JSON.stringify(account, null, 2));

  const wrongCode = challenge.code === "999999" ? "000000" : "999999";
  const wrongResult = await submit(wrongCode);
  console.log(`Wrong-code response: HTTP ${wrongResult.status} ${wrongResult.body}`);

  const validResult = await submit(challenge.code);
  console.log(`Valid-code response: HTTP ${validResult.status} ${validResult.body}`);
  const reusedResult = await submit(challenge.code);
  console.log(`Reused-code response: HTTP ${reusedResult.status} ${reusedResult.body}`);

  const verified = await prisma.account.findUnique({
    where: { id: account.id },
    select: { id: true, isVerified: true, accountStatus: true },
  });
  console.log("Account state after verification:");
  console.log(JSON.stringify(verified, null, 2));

  if (wrongResult.status !== 400 || validResult.status !== 200 || reusedResult.status !== 400 || !verified.isVerified) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
