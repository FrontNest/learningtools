import { createApp } from "./app";
import { env } from "./config";
import { logger } from "./lib/logger";
import { startAutoCloseJob } from "./jobs/autoCloseJob";

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Backend listening on port ${env.port} (${env.nodeEnv})`);
  startAutoCloseJob();
});
