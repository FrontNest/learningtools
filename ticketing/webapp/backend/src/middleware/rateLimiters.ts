import rateLimit from "express-rate-limit";

// Throttle login attempts per IP to slow down brute-force/credential-stuffing attempts.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});
