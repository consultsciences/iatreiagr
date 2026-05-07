import { z } from "zod";

const emailSchema = z.string().email();

/**
 * Extract an email address from a Supabase password-recovery URL.
 *
 * Supabase places auth params in the URL hash (e.g. `#access_token=...&email=...`),
 * but some flows also send the email as a regular query param (`?email=...`).
 * This helper checks both and returns the first valid email it finds, or null.
 *
 * Accepts either:
 *  - a full URL string (e.g. `window.location.href`)
 *  - a `{ search, hash }` pair (e.g. `window.location`)
 */
export function extractEmailFromRecoveryUrl(
  input: string | { search?: string; hash?: string },
): string | null {
  let search = "";
  let hash = "";

  if (typeof input === "string") {
    try {
      const url = new URL(input);
      search = url.search;
      hash = url.hash;
    } catch {
      return null;
    }
  } else {
    search = input.search ?? "";
    hash = input.hash ?? "";
  }

  const hashBody = hash.startsWith("#") ? hash.slice(1) : hash;
  const searchBody = search.startsWith("?") ? search.slice(1) : search;

  const hashParams = new URLSearchParams(hashBody);
  const searchParams = new URLSearchParams(searchBody);

  // Prefer hash (where Supabase puts recovery params), then query string
  const raw = hashParams.get("email") ?? searchParams.get("email");
  if (!raw) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw.replace(/\+/g, " ")).trim();
  } catch {
    decoded = raw.trim();
  }

  return emailSchema.safeParse(decoded).success ? decoded : null;
}

/**
 * Extract an `error_description` (or `error`) message from a Supabase recovery URL hash.
 * Returns null when no error is present.
 */
export function extractErrorFromRecoveryUrl(
  input: string | { hash?: string },
): string | null {
  let hash = "";
  if (typeof input === "string") {
    try {
      hash = new URL(input).hash;
    } catch {
      return null;
    }
  } else {
    hash = input.hash ?? "";
  }

  const body = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(body);
  const err = params.get("error_description") ?? params.get("error");
  if (!err) return null;
  try {
    return decodeURIComponent(err.replace(/\+/g, " "));
  } catch {
    return err;
  }
}
