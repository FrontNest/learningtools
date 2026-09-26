import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

// Expired session rows are lazily ignored by PrismaSessionStore.get(), but
// still need periodic physical deletion so the table doesn't grow unbounded.
export function startSessionCleanupJob() {
  cron.schedule("*/30 * * * *", async () => {
    try {
      const { count } = await prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
      if (count > 0) {
        logger.info(`Session cleanup removed ${count} expired session(s)`);
      }
    } catch (err) {
      logger.error("Session cleanup job failed", { err });
    }
  });
}
