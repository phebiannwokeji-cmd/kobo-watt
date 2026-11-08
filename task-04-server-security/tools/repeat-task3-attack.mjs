const baseUrl = "http://127.0.0.1:3002";
const payload = {
  name: "x",
  phone: "1",
  email: "not-an-email",
  address: "abc",
  password: "weak",
  terms: false,
};

console.log(`Captured at: ${new Date().toISOString()}`);
console.log("Command: node tools/repeat-task3-attack.mjs");
console.log("Original Task 3 request: POST http://127.0.0.1:3001/api/accounts");
console.log("Task 3 recorded response (evidence/16-direct-request-command-and-response.txt): HTTP 201 Created {\"id\":1}");
console.log("Task 4 request: POST http://127.0.0.1:3002/api/accounts");
console.log("Exact JSON payload:");
console.log(JSON.stringify(payload, null, 2));

const response = await fetch(`${baseUrl}/api/accounts`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
});
const responseText = await response.text();
console.log(`Task 4 response: HTTP ${response.status} ${responseText}`);

if (response.status !== 400) {
  console.error("Expected the Task 4 server to refuse this invalid request with HTTP 400.");
  process.exitCode = 1;
}
