const loopbackUrl = "http://127.0.0.1:3002";
const alternateBaseUrl = process.argv[2]?.replace(/\/$/, "");

if (!alternateBaseUrl) {
  console.error("Usage: node tools/prove-rate-limit-ip-change.mjs http://<this-computer-lan-ip>:3002");
  process.exit(2);
}

const invalidBody = {};

async function post(url) {
  const response = await fetch(`${url}/api/accounts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(invalidBody),
  });
  return { status: response.status, body: await response.text() };
}

console.log(`Captured at: ${new Date().toISOString()}`);
console.log("Command: node tools/prove-rate-limit-ip-change.mjs <alternate-base-url>");
console.log("This proof uses two genuine local network addresses, not a forwarded-IP header.");
console.log(`First route: ${loopbackUrl}`);

let loopbackLimited = null;
for (let attempt = 1; attempt <= 11; attempt += 1) {
  const result = await post(loopbackUrl);
  if (result.status === 429) loopbackLimited = result;
}
console.log(`After 11 loopback requests: HTTP ${loopbackLimited?.status ?? "none"} ${loopbackLimited?.body ?? ""}`);

console.log(`Alternate route: ${alternateBaseUrl}`);
const alternateResult = await post(alternateBaseUrl);
console.log(`After the limit, alternate-address request: HTTP ${alternateResult.status} ${alternateResult.body}`);

if (loopbackLimited?.status !== 429 || alternateResult.status !== 400) {
  console.error("Expected loopback to be limited (429) and the different local address to have a fresh quota (400 validation response).");
  process.exitCode = 1;
} else {
  console.log("The request passed the IP-only limiter under the alternate address and was then rejected by validation.");
}
