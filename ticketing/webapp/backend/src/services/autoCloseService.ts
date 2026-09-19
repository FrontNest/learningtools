import { prisma } from "../lib/prisma";
import { writeAuditLog } from "./auditService";
import { notify } from "./notificationService";
import { logger } from "../lib/logger";

// Periodic sweep: Resolved -> Closed after the configured auto-close window
// (spec section 12 / 26). Idempotent — each ticket is re-checked inside its
// own transaction so overlapping runs can never double-close a ticket.
export async function runAutoCloseSweep(): Promise<{ closed: number }> {
  const now = new Date();

  const candidates = await prisma.ticket.findMany({
    where: { status: "RESOLVED", autoCloseAt: { lte: now } },
    select: { id: true },
  });

  let closed = 0;

  for (const candidate of candidates) {
    try {
      const didClose = await prisma.$transaction(async (tx) => {
        const ticket = await tx.ticket.findUnique({ where: { id: candidate.id } });
        if (!ticket || ticket.status !== "RESOLVED" || !ticket.autoCloseAt || ticket.autoCloseAt > now) {
          return false;
        }

        await tx.ticket.update({
          where: { id: ticket.id },
          data: { status: "CLOSED", closedAt: now },
        });

        await writeAuditLog(tx, {
          ticketId: ticket.id,
          actorId: null,
          action: "AUTOMATIC_CLOSURE",
          oldValue: "RESOLVED",
          newValue: "CLOSED",
          details: "Automatic closure after configured auto-close period",
        });

        const requester = await tx.user.findUnique({ where: { id: ticket.requesterId } });
        if (requester && requester.active) {
          await notify(tx, {
            ticketId: ticket.id,
            recipients: [requester],
            type: "TICKET_CLOSED",
            message: `${ticket.ticketNumber} was automatically closed`,
          });
        }

        return true;
      });

      if (didClose) closed += 1;
    } catch (err) {
      logger.error("Auto-close sweep failed for ticket", { ticketId: candidate.id, err });
    }
  }

  return { closed };
}
