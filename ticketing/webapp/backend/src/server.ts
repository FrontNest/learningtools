import { createApp } from "./app";
import { env } from "./config";
import { logger } from "./lib/logger";
import { startAutoCloseJob } from "./jobs/autoCloseJob";
import { startSessionCleanupJob } from "./jobs/sessionCleanupJob";

if (env.nodeEnv === "production" && !env.cookieSecure) {
  logger.warn(
    "COOKIE_SECURE is not enabled while NODE_ENV=production — session cookies and CSP hardening " +
      "are running in the reduced-security LAN/demo mode. Set COOKIE_SECURE=true behind HTTPS " +
      "before exposing this deployment to real users."
  );
}

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Backend listening on port ${env.port} (${env.nodeEnv})`);
  startAutoCloseJob();
  startSessionCleanupJob();
});
