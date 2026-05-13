import { Router } from "express";
import { z } from "zod";
import { getUncachableResendClient } from "../lib/resendClient";
import { logger } from "../lib/logger";

const router = Router();

const ContactBody = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  subject: z.string().min(1).max(150),
  message: z.string().min(1).max(2000),
  treatment: z.string().max(100).optional(),
});

const TO_EMAIL = "hello@iatreia.gr";

router.post("/api/contact", async (req, res) => {
  const parsed = ContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
    return;
  }

  const { name, email, subject, message, treatment } = parsed.data;

  const safeEscape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const treatmentLine = treatment
    ? `<p><strong>Treatment:</strong> ${safeEscape(treatment)}</p>`
    : "";

  const html = `
    <h2>New contact message via iatreia.gr</h2>
    <p><strong>From:</strong> ${safeEscape(name)} &lt;${safeEscape(email)}&gt;</p>
    <p><strong>Subject:</strong> ${safeEscape(subject)}</p>
    ${treatmentLine}
    <hr/>
    <p>${safeEscape(message).replace(/\n/g, "<br/>")}</p>
  `;

  const text = [
    `From: ${name} <${email}>`,
    `Subject: ${subject}`,
    treatment ? `Treatment: ${treatment}` : "",
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const { error } = await client.emails.send({
      from: fromEmail,
      to: TO_EMAIL,
      replyTo: email,
      subject: `[iatreia.gr] ${subject}`,
      html,
      text,
    });

    if (error) {
      logger.error({ error, name, email }, "contact: Resend error");
      res.status(500).json({ error: "Failed to send message" });
      return;
    }

    logger.info({ name, email, subject }, "contact: message sent");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "contact: unexpected error");
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
