import express from "express";
import bcrypt from "bcrypt";
import { randomInt } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client.ts";
import { normalizeEmail, trimPassword } from "./src/normalization.js";
import { BreachCheckUnavailableError, checkPwnedPassword } from "./src/breach-check.js";
import { queueVerificationEmail } from "./src/email-queue.js";
import {
  loginBody,
  registrationBody,
  resetBody,
  validateBody,
  verificationBody,
  verificationResendBody,
} from "./src/validation.js";

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT) || 3002;
const BCRYPT_COST = 12;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const VERIFICATION_CODE_TTL_MS = 7 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

const adapter = new PrismaBetterSqlite3({
  url: "file:./data/kobo-watt-04.db",
});
const prisma = new PrismaClient({ adapter });

const app = express();
app.set("trust proxy", false);
app.use(express.json({ limit: "16kb" }));

function createIpLimiter(identifier, limit, message) {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit,
    identifier,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: message },
  });
}

const registrationLimiter = createIpLimiter(
  "registration-per-ip",
  10,
  "Too many registration requests from this IP. Try again after the 15-minute window.",
);
const loginLimiter = createIpLimiter(
  "login-per-ip",
  20,
  "Too many sign-in attempts from this IP. Try again after the 15-minute window.",
);
const resetLimiter = createIpLimiter(
  "password-reset-per-ip",
  5,
  "Too many password reset requests from this IP. Try again after the 15-minute window.",
);
const verificationLimiter = createIpLimiter(
  "email-verification-per-ip",
  30,
  "Too many verification attempts from this IP. Try again after the 15-minute window.",
);
const verificationResendLimiter = createIpLimiter(
  "verification-resend-per-ip",
  5,
  "Too many verification email requests from this IP. Try again after the 15-minute window.",
);

function createVerificationCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

app.post("/api/accounts", registrationLimiter, validateBody(registrationBody), async (req, res) => {
  const { name, phone, email, address, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = trimPassword(password);

  try {
    const breachCheck = await checkPwnedPassword(trimmedPassword);
    if (breachCheck.found) {
      return res.status(422).json({
        error: "This password has appeared in known breaches. Choose a different password.",
      });
    }

    const passwordHash = await bcrypt.hash(trimmedPassword, BCRYPT_COST);
    const code = createVerificationCode();
    const now = new Date();
    const account = await prisma.$transaction(async (transaction) => {
      const created = await transaction.account.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: name,
          phone,
          serviceAddress: address,
          accountStatus: "PENDING_VERIFICATION",
          termsAcceptedAt: now,
        },
        select: { id: true, email: true, fullName: true },
      });
      await transaction.verificationCode.create({
        data: {
          accountId: created.id,
          code,
          expiresAt: new Date(now.getTime() + VERIFICATION_CODE_TTL_MS),
        },
      });
      return created;
    });

    await queueVerificationEmail({ email: account.email, name: account.fullName, code });
    return res.status(201).json({ id: account.id });
  } catch (error) {
    if (error instanceof BreachCheckUnavailableError) {
      console.error("Pwned Passwords lookup unavailable; registration was not saved.");
      return res.status(503).json({
        error: "Password security check is temporarily unavailable. Please try again later.",
      });
    }
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "An account with that email already exists." });
    }
    console.error("Account registration failed:", error);
    return res.status(500).json({ error: "Server error." });
  }
});

app.post("/api/sessions", loginLimiter, validateBody(loginBody), async (req, res) => {
  const { email, password } = req.body ?? {};
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = trimPassword(password);

  try {
    const account = await prisma.account.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, passwordHash: true, isVerified: true },
    });
    const passwordMatches = account
      ? await bcrypt.compare(trimmedPassword, account.passwordHash)
      : false;

    if (!account || !passwordMatches) {
      return res.status(401).json({ error: "Sign-in details are incorrect." });
    }
    if (!account.isVerified) {
      return res.status(403).json({ error: "Verify your email before signing in." });
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });
    return res.status(200).json({ message: "Signed in." });
  } catch (error) {
    console.error("Sign-in failed:", error);
    return res.status(500).json({ error: "Server error." });
  }
});

app.post(
  "/api/email-verifications/resend",
  verificationResendLimiter,
  validateBody(verificationResendBody),
  async (req, res) => {
    const normalizedEmail = normalizeEmail(req.body.email);

    try {
      const account = await prisma.account.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true, fullName: true, isVerified: true, accountStatus: true },
      });

      if (account && !account.isVerified && account.accountStatus === "PENDING_VERIFICATION") {
        const code = createVerificationCode();
        const now = new Date();
        await prisma.$transaction(async (transaction) => {
          await transaction.verificationCode.updateMany({
            where: { accountId: account.id, usedAt: null, expiresAt: { gt: now } },
            data: { usedAt: now },
          });
          await transaction.verificationCode.create({
            data: {
              accountId: account.id,
              code,
              expiresAt: new Date(now.getTime() + VERIFICATION_CODE_TTL_MS),
            },
          });
        });
        await queueVerificationEmail({ email: account.email, name: account.fullName, code });
      }

      return res.status(202).json({
        message: "If that address needs verification, a new code is on its way.",
      });
    } catch (error) {
      console.error("Verification code resend failed:", error);
      return res.status(500).json({ error: "Server error." });
    }
  },
);

app.post(
  "/api/email-verifications",
  verificationLimiter,
  validateBody(verificationBody),
  async (req, res) => {
    const normalizedEmail = normalizeEmail(req.body.email);
    const { code } = req.body;
    const now = new Date();

    try {
      const result = await prisma.$transaction(async (transaction) => {
        const account = await transaction.account.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, isVerified: true, accountStatus: true },
        });
        if (!account || account.isVerified || account.accountStatus !== "PENDING_VERIFICATION") {
          return "invalid";
        }

        const challenge = await transaction.verificationCode.findFirst({
          where: { accountId: account.id, usedAt: null },
          orderBy: { createdAt: "desc" },
        });
        if (!challenge || challenge.expiresAt <= now) return "invalid";
        if (challenge.attemptCount >= MAX_VERIFICATION_ATTEMPTS) return "locked";

        if (challenge.code !== code) {
          await transaction.verificationCode.updateMany({
            where: {
              id: challenge.id,
              usedAt: null,
              expiresAt: { gt: now },
              attemptCount: { lt: MAX_VERIFICATION_ATTEMPTS },
            },
            data: { attemptCount: { increment: 1 } },
          });
          return "invalid";
        }

        const consumed = await transaction.verificationCode.updateMany({
          where: {
            id: challenge.id,
            code,
            usedAt: null,
            expiresAt: { gt: now },
            attemptCount: { lt: MAX_VERIFICATION_ATTEMPTS },
          },
          data: { usedAt: now },
        });
        if (consumed.count !== 1) return "invalid";

        await transaction.account.update({
          where: { id: account.id },
          data: { isVerified: true, accountStatus: "ACTIVE" },
        });
        return "verified";
      });

      if (result === "verified") return res.status(200).json({ message: "Email verified." });
      if (result === "locked") {
        return res.status(429).json({ error: "Too many incorrect codes. Request a new code to continue." });
      }
      return res.status(400).json({ error: "Verification code is invalid or expired." });
    } catch (error) {
      console.error("Email verification failed:", error);
      return res.status(500).json({ error: "Server error." });
    }
  },
);

app.post("/api/password-resets", resetLimiter, validateBody(resetBody), async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email);

  // Password-reset token generation and delivery are outside this Task 4 step.
  if (normalizedEmail) {
    await prisma.account.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
  }
  return res.status(202).json({
    message: "If that address is registered, a reset link is on its way.",
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }
  console.error("Request failed:", error);
  return res.status(500).json({ error: "Server error." });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Task 4 server listening at http://${HOST}:${PORT}`);
  console.log("Database: data/kobo-watt-04.db");
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down Task 4 server.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
