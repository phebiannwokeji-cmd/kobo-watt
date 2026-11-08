import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

const label = process.argv[2];
const requestedEmail = process.argv[3]?.trim();
if (!label) {
  console.error("Usage: node tools/measure-signup.mjs <label> [email-you-can-check]");
  process.exit(2);
}

const email = requestedEmail || `step6.${label}.${randomUUID().replaceAll("-", "")}@example.test`;
const body = {
  name: "Step Six Timing Sample",
  phone: "08012345678",
  email,
  address: "Local test data",
  password: `TimingSample-${randomUUID()}`,
  terms: true,
};

console.log(`Captured at: ${new Date().toISOString()}`);
console.log(`Command: node tools/measure-signup.mjs ${label}${requestedEmail ? " <email-you-can-check>" : ""}`);
console.log("Request: POST http://127.0.0.1:3002/api/accounts");
console.log(requestedEmail ? "Email destination: supplied test mailbox (value omitted)." : `Unique email: ${email}`);

const start = performance.now();
const response = await fetch("http://127.0.0.1:3002/api/accounts", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const responseText = await response.text();
const elapsedMs = performance.now() - start;

console.log(`Elapsed: ${elapsedMs.toFixed(3)} ms`);
console.log(`Response: HTTP ${response.status} ${responseText}`);

if (response.status !== 201) {
  process.exitCode = 1;
}
