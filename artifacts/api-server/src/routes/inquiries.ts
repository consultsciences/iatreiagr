import { Router } from "express";
import { db } from "@workspace/db";
import { inquiriesTable, listingsTable } from "@workspace/db";
import { CreateInquiryBody } from "@workspace/api-zod";
import { getUncachableResendClient } from "../lib/resendClient";
import { logger } from "../lib/logger";
import { eq } from "drizzle-orm";

const router = Router();

const ADMIN_EMAIL = "athanasios.papado@gmail.com";
const CONTACT_EMAIL = "contact@iatreia.gr";

router.post("/inquiries", async (req, res) => {
  const parsed = CreateInquiryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const { listing_id, sender_name, sender_email, sender_phone, message } = parsed.data;

  await db.insert(inquiriesTable).values(parsed.data);

  // Fetch listing title for the email subject
  let listingTitle = listing_id;
  try {
    const [row] = await db
      .select({ title: listingsTable.title })
      .from(listingsTable)
      .where(eq(listingsTable.id, listing_id))
      .limit(1);
    if (row?.title) listingTitle = row.title;
  } catch {
    // non-critical — continue without title
  }

  const safeEscape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `
    <h2>Νέο ενδιαφέρον για αγγελία — iatreia.gr</h2>
    <p><strong>Αγγελία:</strong> ${safeEscape(listingTitle)}</p>
    <hr/>
    <p><strong>Ονοματεπώνυμο:</strong> ${safeEscape(sender_name)}</p>
    <p><strong>Email:</strong> <a href="mailto:${safeEscape(sender_email)}">${safeEscape(sender_email)}</a></p>
    ${sender_phone ? `<p><strong>Τηλέφωνο:</strong> ${safeEscape(sender_phone)}</p>` : ""}
    <hr/>
    <p>${safeEscape(message).replace(/\n/g, "<br/>")}</p>
  `;

  const text = [
    `Αγγελία: ${listingTitle}`,
    "",
    `Ονοματεπώνυμο: ${sender_name}`,
    `Email: ${sender_email}`,
    sender_phone ? `Τηλέφωνο: ${sender_phone}` : "",
    "",
    message,
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const { error } = await client.emails.send({
      from: fromEmail,
      to: [ADMIN_EMAIL, CONTACT_EMAIL],
      replyTo: sender_email,
      subject: `[iatreia.gr] Ενδιαφέρον για: ${listingTitle}`,
      html,
      text,
    });

    if (error) {
      logger.error({ error, listing_id, sender_email }, "inquiries: Resend error");
    } else {
      logger.info({ listing_id, sender_email }, "inquiries: notification sent");
    }
  } catch (err) {
    logger.error({ err, listing_id }, "inquiries: unexpected email error");
  }

  res.status(201).end();
});

export default router;
