import crypto from "crypto";

// Generates a readable, sufficiently random temporary password for
// admin-created accounts / password resets (admin must communicate it to
// the user out-of-band — there is no email delivery in this MVP).
export function generateTempPassword(): string {
  const raw = crypto.randomBytes(9).toString("base64url"); // 12 chars, url-safe
  return `Tk-${raw}`;
}
