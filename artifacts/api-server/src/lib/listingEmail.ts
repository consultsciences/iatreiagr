import { clerkClient } from "@clerk/express";
import { getUncachableResendClient } from "./resendClient";
import { logger } from "./logger";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getMyListingsUrl(): string {
  const base = process.env.APP_BASE_URL ?? "https://iatreia.gr";
  return `${base}/my-listings`;
}

export async function notifySellerOfListingStatusChange(
  userId: string,
  listingTitle: string,
  newStatus: string,
): Promise<void> {
  if (newStatus !== "published" && newStatus !== "archived") {
    return;
  }

  let email: string | null = null;
  try {
    const user = await clerkClient.users.getUser(userId);
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    );
    email = primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  } catch (err) {
    logger.warn({ err, userId }, "listingEmail: failed to fetch user from Clerk");
    return;
  }

  if (!email) {
    logger.warn({ userId }, "listingEmail: no email address found for user");
    return;
  }

  const myListingsUrl = getMyListingsUrl();
  const isApproved = newStatus === "published";
  const safeTitleHtml = escapeHtml(listingTitle);

  const subject = isApproved
    ? `Your listing "${listingTitle}" has been approved`
    : `Your listing "${listingTitle}" has been rejected`;

  const bodyHtml = isApproved
    ? `<p>Great news! Your listing <strong>${safeTitleHtml}</strong> has been <strong>approved</strong> and is now live on iatreia.gr.</p>
       <p><a href="${myListingsUrl}">View your listings</a></p>`
    : `<p>Unfortunately, your listing <strong>${safeTitleHtml}</strong> has been <strong>rejected</strong> and will not appear on the site.</p>
       <p>If you have questions, please contact us at <a href="mailto:hello@iatreia.gr">hello@iatreia.gr</a>.</p>
       <p><a href="${myListingsUrl}">View your listings</a></p>`;

  const bodyText = isApproved
    ? `Your listing "${listingTitle}" has been approved and is now live on iatreia.gr.\n\nView your listings: ${myListingsUrl}`
    : `Your listing "${listingTitle}" has been rejected and will not appear on the site.\n\nView your listings: ${myListingsUrl}`;

  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const { error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html: bodyHtml,
      text: bodyText,
    });
    if (error) {
      logger.error({ error, userId, listingTitle, newStatus }, "listingEmail: Resend returned an error");
    } else {
      logger.info({ userId, email, listingTitle, newStatus }, "listingEmail: notification sent");
    }
  } catch (err) {
    logger.error({ err, userId, listingTitle, newStatus }, "listingEmail: failed to send via Resend");
  }
}
