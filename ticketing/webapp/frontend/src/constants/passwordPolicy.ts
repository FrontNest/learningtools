// Mirrors backend/src/domain/passwordPolicy.ts — client-side check only for
// immediate feedback; the backend is the actual source of truth.
export const PASSWORD_MIN_LENGTH = 10;

export function validatePasswordPolicy(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "Password must contain at least one special character.";
  }
  return null;
}
