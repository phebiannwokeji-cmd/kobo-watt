import { createHash } from "node:crypto";

const RANGE_API = "https://api.pwnedpasswords.com/range/";
const REQUEST_TIMEOUT_MS = 8_000;
const USER_AGENT = "Kobo-Watt-Task4/1.0";

export class BreachCheckUnavailableError extends Error {
  constructor() {
    super("Pwned Passwords lookup failed.");
    this.name = "BreachCheckUnavailableError";
  }
}

/**
 * Check a password through HIBP's range API. Only the first five SHA-1
 * characters leave this process; the full suffix comparison stays local.
 * SHA-1 is used only as the API lookup format, never as a stored password hash.
 */
export async function checkPwnedPassword(password) {
  const hash = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  let response;
  try {
    response = await fetch(`${RANGE_API}${prefix}`, {
      headers: {
        "Add-Padding": "true",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new BreachCheckUnavailableError();
  }

  if (!response.ok) {
    throw new BreachCheckUnavailableError();
  }

  let rangeText;
  try {
    rangeText = await response.text();
  } catch {
    throw new BreachCheckUnavailableError();
  }

  let validRows = 0;
  for (const line of rangeText.split(/\r?\n/)) {
    const [candidateSuffix, countText] = line.trim().split(":", 2);
    if (!/^[0-9a-f]{35}$/i.test(candidateSuffix ?? "") || !/^\d+$/.test(countText ?? "")) {
      continue;
    }
    validRows += 1;
    const count = Number(countText);
    if (candidateSuffix.toUpperCase() === suffix && Number.isFinite(count) && count > 0) {
      return { found: true, count };
    }
  }

  if (validRows === 0) {
    throw new BreachCheckUnavailableError();
  }

  return { found: false, count: 0 };
}
