import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { AppError } from "../errors/AppError";
import { env } from "../config";

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Defense-in-depth double-submit-cookie CSRF check on top of SameSite=strict
// session cookies: a non-httpOnly token is echoed back by the SPA in a
// request header, which a cross-site attacker cannot read (same-origin
// policy), even if a future config change ever weakens SameSite/CORS.
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
  if (!token) {
    token = crypto.randomBytes(24).toString("hex");
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: env.cookieSecure,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 8,
    });
  }

  // Only enforce on state-changing requests against an authenticated session —
  // login itself is already protected by rate limiting and has no session yet.
  if (SAFE_METHODS.has(req.method) || !req.session.userId) {
    next();
    return;
  }

  const header = req.header(CSRF_HEADER_NAME);
  if (!header || header !== token) {
    throw AppError.forbidden("Invalid or missing CSRF token");
  }
  next();
}
