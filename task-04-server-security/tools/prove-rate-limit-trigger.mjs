const baseUrl = "http://127.0.0.1:3002";
const invalidBody = {};
const policies = [
  { path: "/api/accounts", label: "registration", limit: 10 },
  { path: "/api/sessions", label: "login", limit: 20 },
  { path: "/api/password-resets", label: "password reset", limit: 5 },
];

console.log(`Captured at: ${new Date().toISOString()}`);
console.log("Command: node tools/prove-rate-limit-trigger.mjs");
console.log(`Base URL: ${baseUrl}`);
console.log("Each body is valid JSON but fails Zod validation; this verifies rate limiting runs before request validation.");

for (const policy of policies) {
  const statuses = new Map();
  let limitedResponse = null;

  for (let attempt = 1; attempt <= policy.limit + 1; attempt += 1) {
    const response = await fetch(`${baseUrl}${policy.path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(invalidBody),
    });
    const responseText = await response.text();
    statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
    if (response.status === 429) {
      limitedResponse = { status: response.status, body: responseText };
    }
  }

  console.log(`\n${policy.label} (${policy.limit} allowed per 15 minutes):`);
  console.log(`Status counts: ${JSON.stringify(Object.fromEntries(statuses))}`);
  console.log(`Lockout: HTTP ${limitedResponse?.status ?? "none"} ${limitedResponse?.body ?? ""}`);

  if (!limitedResponse) {
    throw new Error(`The ${policy.label} limiter did not return HTTP 429.`);
  }
}

console.log("\nAll three endpoint limits triggered.");
