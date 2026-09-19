import path from "path";
import dotenv from "dotenv";
import appConfigJson from "../../config/app.config.json";

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  sessionSecret: requireEnv("SESSION_SECRET"),
  databaseUrl: requireEnv("DATABASE_URL"),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./data/uploads"),
  maxAttachmentSizeMb: Number(process.env.MAX_ATTACHMENT_SIZE_MB ?? 10),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  deviceInventoryCsvPath: path.resolve(
    process.cwd(),
    process.env.DEVICE_INVENTORY_CSV_PATH ?? "./data/device-inventory.csv"
  ),
  // Whether to mark the session cookie Secure (requires HTTPS). Independent from
  // NODE_ENV so a LAN/HTTP-only demo can still use a "production"-style build.
  cookieSecure: process.env.COOKIE_SECURE === "true",
  // If present, Express also serves the built frontend (single-origin deployment,
  // e.g. for a LAN demo or a simple VM/IIS-reverse-proxy setup).
  frontendDistPath: process.env.SERVE_FRONTEND_DIST
    ? path.resolve(process.cwd(), process.env.SERVE_FRONTEND_DIST)
    : undefined,
};

// Non-secret, branding/deployment-site settings that admins tweak per environment.
export const appConfig = appConfigJson as {
  appName: string;
  appShortName: string;
  favicon: string;
  supportContact: string;
  ticketNumberPrefix: string;
  autoCloseAfterDays: number;
  worklogMaxLines: number;
  worklogMaxChars: number;
  allowedAttachmentExtensions: string[];
  deviceProvider: "INVENTORY" | "INTUNE";
  teams: { name: string; type: string }[];
};

export const isProduction = env.nodeEnv === "production";
