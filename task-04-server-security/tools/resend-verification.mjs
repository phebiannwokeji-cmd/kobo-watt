const email = process.argv[2]?.trim().toLowerCase();
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3002";
if (!email) {
  console.error("Usage: node tools/resend-verification.mjs <account-email>");
  process.exit(2);
}

console.log(`Captured at: ${new Date().toISOString()}`);
console.log("Command: node tools/resend-verification.mjs <test-account-email>");
const response = await fetch(`${baseUrl}/api/email-verifications/resend`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email }),
});
console.log(`Response: HTTP ${response.status} ${await response.text()}`);
if (response.status !== 202) process.exitCode = 1;
