import { randomUUID } from "node:crypto";

const email = `step9.pwned.${randomUUID().replaceAll("-", "")}@example.test`;
const knownPwnedDemoPassword = "Password123456";
const payload = {
  name: "Step Nine Breach Proof",
  phone: "08012345678",
  email,
  address: "Local test data",
  password: knownPwnedDemoPassword,
  terms: true,
};

console.log(`Captured at: ${new Date().toISOString()}`);
console.log("Command: node tools/prove-breached-password.mjs");
console.log("Request: POST http://127.0.0.1:3002/api/accounts");
console.log(`Unique email: ${email}`);
console.log("Password: known Pwned Passwords corpus sample (value omitted).");

const response = await fetch("http://127.0.0.1:3002/api/accounts", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
});
const responseText = await response.text();
console.log(`Response: HTTP ${response.status} ${responseText}`);

if (response.status !== 422) {
  console.error("Expected HTTP 422 because the demo password is present in Pwned Passwords.");
  process.exitCode = 1;
}
