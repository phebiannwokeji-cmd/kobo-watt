import nodemailer from "nodemailer";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required email setting: ${name}`);
  return value;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export async function sendVerificationEmail({ email, name, code }) {
  const host = requiredEnv("SMTP_HOST");
  const port = Number(requiredEnv("SMTP_PORT"));
  const user = requiredEnv("SMTP_USER");
  const pass = requiredEnv("SMTP_PASS");
  const from = process.env.MAIL_FROM || user;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid TCP port.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });

  const safeCode = escapeHtml(String(code));
  const safeName = name ? escapeHtml(name) : "";
  const greetingLine = safeName ? `Hello ${safeName},` : "Hello,";
  const plainName = name ? String(name).replace(/[\r\n]+/g, " ").trim() : "";
  const plainGreetingLine = plainName ? `Hello ${plainName},` : "Hello,";

  // Plain-text fallback — same meaning, no HTML
  const plainText = [
    plainGreetingLine,
    "",
    "Verify your Kobo Watt email.",
    "",
    `Your verification code is: ${code}`,
    "",
    "This code expires in 7 minutes.",
    "",
    "If you did not create a Kobo Watt account, you can ignore this message.",
    "No further action is needed.",
    "",
    "The Kobo Watt team",
  ].join("\n");

  /*
   * Email-safe HTML template
   *
   * Colour values are resolved Task 1 light-mode roles — see
   * docs/task4-colour-mapping.md for the full mapping table.
   *
   * Role → hex used here:
   *   surface             #F8FAF7   outer background
   *   surface-container   #EFF1EE   card background
   *   on-surface          #191C1B   body text
   *   on-surface-variant  #3F4947   supporting text
   *   primary             #006B5E   header band fill
   *   on-primary          #FFFFFF   header text on primary
   *   primary-container   #9FF2E1   code block background
   *   on-primary-container #00201B  code text
   *   outline-variant     #BEC9C6   decorative border (decorative only)
   *
   * Email-client constraints applied:
   *   - All styles are inline; no <style> block, no linked stylesheet
   *   - No CSS custom properties (var(--...)) — not supported in email clients
   *   - No @font-face, no Google Fonts URL — Source Sans Pro via font-family
   *     stack with sans-serif fallback only
   *   - Table-based one-column layout — no flexbox or grid
   *   - No external images, trackers, or CSS URLs
   *   - max-width 600px; width 100% for mobile
   */
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Kobo Watt email</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAF7;font-family:'Source Sans Pro',Arial,Helvetica,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#F8FAF7;padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;background-color:#EFF1EE;border-radius:8px;overflow:hidden;border:1px solid #BEC9C6;">

          <!-- Header band -->
          <tr>
            <td style="background-color:#006B5E;padding:24px 32px;">
              <p style="margin:0;font-size:22px;font-weight:600;color:#FFFFFF;
                        font-family:'Source Sans Pro',Arial,Helvetica,sans-serif;
                        letter-spacing:0.01em;">
                Kobo Watt
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 16px 0;font-size:16px;color:#191C1B;
                        font-family:'Source Sans Pro',Arial,Helvetica,sans-serif;">
                ${greetingLine}
              </p>

              <!-- Heading -->
              <h1 style="margin:0 0 24px 0;font-size:24px;font-weight:600;color:#191C1B;
                         font-family:'Source Sans Pro',Arial,Helvetica,sans-serif;">
                Verify your email
              </h1>

              <!-- Instruction -->
              <p style="margin:0 0 20px 0;font-size:16px;color:#191C1B;
                        font-family:'Source Sans Pro',Arial,Helvetica,sans-serif;">
                Use this code to complete your Kobo Watt registration:
              </p>

              <!-- Code block -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="margin-bottom:20px;">
                <tr>
                  <td align="center"
                      style="background-color:#9FF2E1;border-radius:6px;padding:20px 16px;">
                    <span style="font-size:36px;font-weight:700;letter-spacing:0.18em;
                                 color:#00201B;font-family:'Source Sans Pro',Arial,Helvetica,sans-serif;">
                      ${safeCode}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry warning -->
              <p style="margin:0 0 24px 0;font-size:14px;color:#3F4947;
                        font-family:'Source Sans Pro',Arial,Helvetica,sans-serif;">
                This code expires in <strong>7 minutes</strong>.
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #BEC9C6;margin:0 0 24px 0;" aria-hidden="true">

              <!-- Non-account-holder notice -->
              <p style="margin:0;font-size:14px;color:#3F4947;
                        font-family:'Source Sans Pro',Arial,Helvetica,sans-serif;">
                If you did not create a Kobo Watt account, you can ignore this
                message. No further action is needed.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#EFF1EE;padding:16px 32px 24px 32px;
                       border-top:1px solid #BEC9C6;">
              <p style="margin:0;font-size:13px;color:#3F4947;
                        font-family:'Source Sans Pro',Arial,Helvetica,sans-serif;">
                The Kobo Watt team
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>`;

  return transporter.sendMail({
    from,
    to: email,
    subject: "Verify your Kobo Watt email",
    text: plainText,
    html: htmlBody,
  });
}
