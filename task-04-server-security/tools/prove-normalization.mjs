import { randomUUID } from "node:crypto";

const baseUrl = "http://127.0.0.1:3002";
const tag = randomUUID().replaceAll("-", "");

async function post(path, body, expectedStatus) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();
  console.log(`POST ${path} -> HTTP ${response.status} ${responseText}`);
  if (response.status !== expectedStatus) {
    throw new Error(`Expected HTTP ${expectedStatus} from ${path}, got ${response.status}.`);
  }
}

console.log(`Captured at: ${new Date().toISOString()}`);
console.log("Command: node tools/prove-normalization.mjs");

const mixedCaseEmail = `Step5.Email.${tag}@EXAMPLE.TEST`;
const emailProofPassword = `EmailProof-${randomUUID()}`;

console.log("\nCase 1: register using capitalized email; log in using lowercase email.");
console.log(`Registration email: ${mixedCaseEmail}`);
await post("/api/accounts", {
  name: "Step Five Email Proof",
  phone: "08012345678",
  email: mixedCaseEmail,
  address: "Local test data",
  password: emailProofPassword,
  terms: true,
}, 201);
console.log(`Login email: ${mixedCaseEmail.toLowerCase()}`);
await post("/api/sessions", {
  email: mixedCaseEmail.toLowerCase(),
  password: emailProofPassword,
}, 403);

const passwordEmail = `step5.password.${tag}@example.test`;
const passwordWithoutSpace = `TrimProof-${randomUUID()}`;
const passwordWithTrailingSpace = `${passwordWithoutSpace} `;

console.log("\nCase 2: register with one trailing password space; log in without it.");
console.log(`Registration email: ${passwordEmail}`);
console.log("Registration password includes one trailing space (value omitted).");
await post("/api/accounts", {
  name: "Step Five Password Proof",
  phone: "08012345678",
  email: passwordEmail,
  address: "Local test data",
  password: passwordWithTrailingSpace,
  terms: true,
}, 201);
console.log("Login password has no trailing space (value omitted).");
await post("/api/sessions", {
  email: passwordEmail,
  password: passwordWithoutSpace,
}, 403);

console.log("\nBoth normalization proofs reached the email-verification gate.");
