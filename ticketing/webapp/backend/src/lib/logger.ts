/* eslint-disable no-console */
// Minimal logger wrapper — central place to keep secrets out of logs.
const REDACTED_KEYS = ["password", "passwordHash", "token", "secret", "sessionSecret", "authorization"];

function redact(value: unknown): unknown {
  if (value && typeof value === "object") {
    const clone: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    for (const key of Object.keys(clone)) {
      if (REDACTED_KEYS.some((k) => key.toLowerCase().includes(k))) {
        clone[key] = "[REDACTED]";
      }
    }
    return clone;
  }
  return value;
}

export const logger = {
  info: (message: string, meta?: unknown) => console.log(`[INFO] ${message}`, meta ? redact(meta) : ""),
  warn: (message: string, meta?: unknown) => console.warn(`[WARN] ${message}`, meta ? redact(meta) : ""),
  error: (message: string, meta?: unknown) => console.error(`[ERROR] ${message}`, meta ? redact(meta) : ""),
};
