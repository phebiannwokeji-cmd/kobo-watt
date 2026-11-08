import { sendVerificationEmail } from "./mailer.js";

function logDeliveryFailure(error) {
  // Do not log credentials, the recipient, or the verification code.
  let detail = String(error?.message || "Email transport failed.").slice(0, 240);
  for (const secret of [process.env.SMTP_PASS, process.env.SMTP_USER]) {
    if (secret) detail = detail.replaceAll(secret, "[redacted]");
  }
  console.error("Verification email delivery failed.", {
    code: error?.code || "EMAIL_DELIVERY_ERROR",
    responseCode: error?.responseCode || null,
    command: error?.command || null,
    detail,
  });
}

export async function deliverVerificationEmail(message) {
  const result = await sendVerificationEmail(message);
  console.log("Verification email accepted by SMTP.", { messageId: result.messageId });
  return result;
}

export async function queueVerificationEmail(message) {
  if (process.env.EMAIL_DELIVERY_MODE === "inline") {
    try {
      await deliverVerificationEmail(message);
    } catch (error) {
      logDeliveryFailure(error);
    }
    return;
  }

  // This small in-process queue keeps SMTP latency outside the registration
  // response. A production deployment should replace it with a durable worker.
  setImmediate(() => {
    void deliverVerificationEmail(message).catch(logDeliveryFailure);
  });
}
