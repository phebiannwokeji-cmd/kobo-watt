import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const PASSWORD = "Kobo Watt Task 4 local benchmark only";
const BCRYPT_COST = 12;
const SHA256_ITERATIONS = 100_000;

const bcryptStart = performance.now();
const bcryptHashOne = await bcrypt.hash(PASSWORD, BCRYPT_COST);
const bcryptMs = performance.now() - bcryptStart;
const bcryptHashTwo = await bcrypt.hash(PASSWORD, BCRYPT_COST);

const shaStart = performance.now();
let lastSha256 = "";
for (let index = 0; index < SHA256_ITERATIONS; index += 1) {
  lastSha256 = createHash("sha256").update(PASSWORD).digest("hex");
}
const shaTotalMs = performance.now() - shaStart;
const shaAverageMs = shaTotalMs / SHA256_ITERATIONS;

const timestamp = new Date().toISOString();
const header = [
  "Command: node tools/benchmark-hashing.mjs",
  `Captured: ${timestamp}`,
  `Node: ${process.version}`,
  `Platform: ${process.platform} ${process.arch}`,
  `Sample password: ${PASSWORD}`,
  `bcrypt cost: ${BCRYPT_COST}`,
];

const hashEvidence = [
  ...header,
  "",
  "Hash twice:",
  `bcrypt hash 1: ${bcryptHashOne}`,
  `bcrypt hash 2: ${bcryptHashTwo}`,
  `Hashes differ: ${bcryptHashOne !== bcryptHashTwo}`,
  `Rounds in hash: ${bcrypt.getRounds(bcryptHashOne)}`,
].join("\n");

const timingEvidence = [
  ...header,
  "",
  "Timing:",
  `bcrypt one hash: ${bcryptMs.toFixed(3)} ms`,
  `SHA-256 ${SHA256_ITERATIONS} hashes: ${shaTotalMs.toFixed(3)} ms`,
  `SHA-256 average: ${shaAverageMs.toFixed(6)} ms/hash`,
  `SHA-256 sample digest: ${lastSha256}`,
  `bcrypt guesses/second: 1000 / ${bcryptMs.toFixed(6)} = ${(1000 / bcryptMs).toFixed(3)}`,
  `SHA-256 guesses/second: 1000 / ${shaAverageMs.toFixed(9)} = ${(1000 / shaAverageMs).toFixed(3)}`,
].join("\n");

await writeFile(new URL("../evidence/07-hash-twice-different.txt", import.meta.url), `${hashEvidence}\n`, "utf8");
await writeFile(new URL("../evidence/08-timing-bcrypt-vs-sha.txt", import.meta.url), `${timingEvidence}\n`, "utf8");

console.log(hashEvidence);
console.log(`\n${timingEvidence.slice(timingEvidence.indexOf("Timing:"))}`);
