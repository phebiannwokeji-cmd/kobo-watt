/**
 * Task 4 Step 5 input handling.
 * Emails are trimmed and lowercased. Password letter case is preserved,
 * while leading and trailing whitespace is removed before hash/compare.
 */
export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function trimPassword(value) {
  return typeof value === "string" ? value.trim() : "";
}
