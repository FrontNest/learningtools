import cron from "node-cron";
import { runAutoCloseSweep } from "../services/autoCloseService";
import { logger } from "../lib/logger";

// Every 15 minutes (spec section 26 / 11) — background processing must never
// crash the main process on failure.
export function startAutoCloseJob() {
  cron.schedule("*/15 * * * *", async () => {
    try {
      const { closed } = await runAutoCloseSweep();
      if (closed > 0) {
        logger.info(`Auto-close sweep closed ${closed} ticket(s)`);
      }
    } catch (err) {
      logger.error("Auto-close cron job failed", { err });
    }
  });
}
