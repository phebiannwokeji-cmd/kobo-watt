import * as z from "zod";

// Match Task 3's exact email-shape rule, including its intentionally accepted
// short TLD examples. Ownership is checked by verification, not by this regex.
const email = z.string()
  .trim()
  .max(254, "Email address must be 254 characters or fewer.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address.");

export const registrationBody = z.strictObject({
  name: z.string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be 100 characters or fewer.")
    .regex(/\s/, "Enter at least two words for your full name."),
  phone: z.string()
    .trim()
    .regex(/^[0-9]{10,14}$/, "Phone number must contain 10 to 14 digits only."),
  email,
  address: z.string()
    .trim()
    .min(10, "Service address must be at least 10 characters.")
    .max(200, "Service address must be 200 characters or fewer."),
  password: z.string()
    .trim()
    .min(12, "Password must be at least 12 characters after trimming outer whitespace.")
    .max(128, "Password must be 128 characters or fewer."),
  terms: z.literal(true),
});

export const loginBody = z.strictObject({
  email,
  password: z.string()
    .trim()
    .min(1, "Password is required.")
    .max(128, "Password must be 128 characters or fewer."),
});

export const resetBody = z.strictObject({
  email,
});

export const verificationBody = z.strictObject({
  email,
  code: z.string().regex(/^[0-9]{6}$/, "Enter the six-digit code from your email."),
});

export const verificationResendBody = z.strictObject({
  email,
});

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request body.",
        issues: result.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    req.body = result.data;
    return next();
  };
}
