import { z } from "zod";

// Centralized password complexity policy — single source of truth, enforced
// server-side (never trust client-side validation alone).
export const PASSWORD_MIN_LENGTH = 10;

export const passwordPolicySchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
  .refine((v) => /[a-z]/.test(v), "Password must contain at least one lowercase letter")
  .refine((v) => /[A-Z]/.test(v), "Password must contain at least one uppercase letter")
  .refine((v) => /[0-9]/.test(v), "Password must contain at least one number")
  .refine((v) => /[^a-zA-Z0-9]/.test(v), "Password must contain at least one special character");
