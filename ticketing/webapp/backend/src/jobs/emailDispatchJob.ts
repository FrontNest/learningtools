import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { sendGraphEmail } from "../services/emailService";
import { appConfig } from "../config";

// Dispatches "PENDING" email deliveries queued by notify() — decoupled from
// the in-app notification transaction so a slow/failed Graph call never
// blocks or rolls back an otherwise-successful database write.
export function startEmailDispatchJob() {
  cron.schedule("* * * * *", async () => {
    try {
      const settings = await prisma.emailSettings.findUnique({ where: { id: "singleton" } });
      if (!settings?.enabled || !settings.tenantId || !settings.clientId || !settings.clientSecretEnc || !settings.senderMailbox) {
        return;
      }

      const pending = await prisma.notification.findMany({
        where: { emailStatus: "PENDING" },
        include: {
          recipient: { select: { email: true, active: true } },
          ticket: { select: { ticketNumber: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      });

      for (const notification of pending) {
        if (!notification.recipient.active) {
          await prisma.notification.update({
            where: { id: notification.id },
            data: { emailStatus: "FAILED", emailError: "Recipient account is inactive" },
          });
          continue;
        }

        try {
          await sendGraphEmail({
            tenantId: settings.tenantId,
            clientId: settings.clientId,
            clientSecretEnc: settings.clientSecretEnc,
            senderMailbox: settings.senderMailbox,
            to: notification.recipient.email,
            subject: notification.ticket
              ? `${appConfig.appName}: ${notification.ticket.ticketNumber}`
              : appConfig.appName,
            body: notification.message,
          });
          await prisma.notification.update({
            where: { id: notification.id },
            data: { emailStatus: "SENT", emailSentAt: new Date(), emailError: null },
          });
        } catch (err) {
          logger.error("Email dispatch failed", { notificationId: notification.id, err });
          await prisma.notification.update({
            where: { id: notification.id },
            data: { emailStatus: "FAILED", emailError: err instanceof Error ? err.message : "Unknown error" },
          });
        }
      }
    } catch (err) {
      logger.error("Email dispatch job failed", { err });
    }
  });
}
