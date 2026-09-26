import rateLimit from "express-rate-limit";

// Throttle login attempts per IP to slow down brute-force/credential-stuffing attempts.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

// General per-IP ceiling across the whole API so a single authenticated
// account (of any role) cannot exhaust server/disk resources.
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

// Attachment uploads are more expensive (disk I/O, size limits) — throttle
// them more tightly than general API traffic.
export const attachmentUploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads. Please try again later." },
});
