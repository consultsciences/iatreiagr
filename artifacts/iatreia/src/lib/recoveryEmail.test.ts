import { describe, it, expect } from "vitest";
import {
  extractEmailFromRecoveryUrl,
  extractErrorFromRecoveryUrl,
} from "./recoveryEmail";

describe("extractEmailFromRecoveryUrl", () => {
  it("returns email from the URL hash", () => {
    const url =
      "https://app.example.com/reset-password#access_token=abc&type=recovery&email=doctor%40example.com";
    expect(extractEmailFromRecoveryUrl(url)).toBe("doctor@example.com");
  });

  it("returns email from the query string when hash has none", () => {
    const url = "https://app.example.com/reset-password?email=jane.doe%40clinic.gr";
    expect(extractEmailFromRecoveryUrl(url)).toBe("jane.doe@clinic.gr");
  });

  it("prefers the hash over the query string", () => {
    const url =
      "https://app.example.com/reset-password?email=query%40example.com#email=hash%40example.com";
    expect(extractEmailFromRecoveryUrl(url)).toBe("hash@example.com");
  });

  it("decodes '+' as space then validates (rejects invalid)", () => {
    const url = "https://app.example.com/reset-password#email=not+an+email";
    expect(extractEmailFromRecoveryUrl(url)).toBeNull();
  });

  it("returns null when no email is present", () => {
    const url =
      "https://app.example.com/reset-password#access_token=abc&type=recovery";
    expect(extractEmailFromRecoveryUrl(url)).toBeNull();
  });

  it("returns null for an invalid email value", () => {
    const url = "https://app.example.com/reset-password#email=notanemail";
    expect(extractEmailFromRecoveryUrl(url)).toBeNull();
  });

  it("accepts a Location-like { search, hash } object", () => {
    expect(
      extractEmailFromRecoveryUrl({
        search: "",
        hash: "#email=hello%40iatreia.gr&type=recovery",
      }),
    ).toBe("hello@iatreia.gr");
  });

  it("returns null for malformed URL strings", () => {
    expect(extractEmailFromRecoveryUrl("not a url")).toBeNull();
  });

  it("returns null when the hash is empty", () => {
    expect(
      extractEmailFromRecoveryUrl({ search: "", hash: "" }),
    ).toBeNull();
  });

  it("returns null when only unrelated hash params are present", () => {
    expect(
      extractEmailFromRecoveryUrl({
        search: "",
        hash: "#access_token=abc&type=recovery&expires_in=3600",
      }),
    ).toBeNull();
  });

  it("returns null when email param exists but is empty", () => {
    expect(
      extractEmailFromRecoveryUrl({ search: "?email=", hash: "" }),
    ).toBeNull();
  });

  it("falls back to query when the hash has an unrelated key", () => {
    const url =
      "https://app.example.com/reset-password?email=fallback%40example.com#type=recovery";
    expect(extractEmailFromRecoveryUrl(url)).toBe("fallback@example.com");
  });

  it("treats encoded '+' (%2B) as a space due to '+' normalization (rejects result)", () => {
    // The helper normalizes '+' to space before decoding, so %2B → '+' → ' '.
    // This documents current form-decoding behavior; the resulting value is not a valid email.
    const url =
      "https://app.example.com/reset-password#email=user%2Btag%40example.com";
    expect(extractEmailFromRecoveryUrl(url)).toBeNull();
  });

  it("trims surrounding whitespace from the decoded email", () => {
    const url = "https://app.example.com/reset-password#email=%20me%40example.com%20";
    expect(extractEmailFromRecoveryUrl(url)).toBe("me@example.com");
  });

  it("tolerates a hash without a leading '#'", () => {
    expect(
      extractEmailFromRecoveryUrl({
        search: "",
        hash: "email=plain%40example.com",
      }),
    ).toBe("plain@example.com");
  });

  it("tolerates a search string without a leading '?'", () => {
    expect(
      extractEmailFromRecoveryUrl({
        search: "email=plain%40example.com",
        hash: "",
      }),
    ).toBe("plain@example.com");
  });

  it("returns null for malformed percent-encoding (raw value also invalid)", () => {
    // '%E0%A4%A' is an incomplete UTF-8 sequence; decodeURIComponent throws,
    // so the helper falls back to the raw value, which is not a valid email.
    const url = "https://app.example.com/reset-password#email=%E0%A4%A";
    expect(extractEmailFromRecoveryUrl(url)).toBeNull();
  });

  it("rejects an email missing the domain", () => {
    const url = "https://app.example.com/reset-password#email=user%40";
    expect(extractEmailFromRecoveryUrl(url)).toBeNull();
  });

  it("rejects an email with spaces inside the local part", () => {
    const url =
      "https://app.example.com/reset-password#email=first%20last%40example.com";
    expect(extractEmailFromRecoveryUrl(url)).toBeNull();
  });
});

describe("extractErrorFromRecoveryUrl", () => {
  it("returns the error_description from the hash", () => {
    const url =
      "https://app.example.com/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired";
    expect(extractErrorFromRecoveryUrl(url)).toBe(
      "Email link is invalid or has expired",
    );
  });

  it("falls back to error when error_description is missing", () => {
    const url = "https://app.example.com/reset-password#error=otp_expired";
    expect(extractErrorFromRecoveryUrl(url)).toBe("otp_expired");
  });

  it("returns null when no error params are present", () => {
    expect(
      extractErrorFromRecoveryUrl("https://app.example.com/reset-password"),
    ).toBeNull();
  });

  it("returns null for malformed URL strings", () => {
    expect(extractErrorFromRecoveryUrl("not a url")).toBeNull();
  });

  it("returns null when given a Location-like object with empty hash", () => {
    expect(extractErrorFromRecoveryUrl({ hash: "" })).toBeNull();
  });

  it("decodes '+' as space in error_description", () => {
    const url =
      "https://app.example.com/reset-password#error_description=Token+has+expired";
    expect(extractErrorFromRecoveryUrl(url)).toBe("Token has expired");
  });

  it("tolerates a hash without a leading '#'", () => {
    expect(
      extractErrorFromRecoveryUrl({ hash: "error=otp_expired" }),
    ).toBe("otp_expired");
  });

  it("prefers error_description over error when both are present", () => {
    const url =
      "https://app.example.com/reset-password#error=access_denied&error_description=Detailed+message";
    expect(extractErrorFromRecoveryUrl(url)).toBe("Detailed message");
  });
});
