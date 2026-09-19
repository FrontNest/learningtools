import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { writeAuditLog } from "./auditService";
import { getTicketNotificationRecipients, notify } from "./notificationService";
import { appConfig } from "../config";
import type { CommentTypeValue } from "../domain/enums";

export async function listComments(currentUser: User, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw AppError.notFound("Ticket not found");
  }
  if (currentUser.role === "REQUESTER" && ticket.requesterId !== currentUser.id) {
    throw AppError.forbidden();
  }

  return prisma.comment.findMany({
    where: {
      ticketId,
      // Requesters must never see internal Admin-only notes.
      ...(currentUser.role === "REQUESTER" ? { type: "PUBLIC" } : {}),
    },
    include: { author: { select: { id: true, displayName: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createComment(
  currentUser: User,
  ticketId: string,
  input: { text: string; type: CommentTypeValue }
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw AppError.notFound("Ticket not found");
  }

  const isRequester = currentUser.role === "REQUESTER";
  if (isRequester) {
    if (ticket.requesterId !== currentUser.id) {
      throw AppError.forbidden();
    }
    if (input.type === "INTERNAL") {
      // Requesters may only ever create PUBLIC comments (spec section 14 / 24).
      throw AppError.forbidden("Requesters cannot create internal notes");
    }
  }

  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: { ticketId, authorId: currentUser.id, text: input.text, type: input.type },
      include: { author: { select: { id: true, displayName: true, role: true } } },
    });

    await writeAuditLog(tx, {
      ticketId,
      actorId: currentUser.id,
      action: input.type === "INTERNAL" ? "INTERNAL_NOTE_ADDED" : "COMMENT_ADDED",
    });

    // Requester comment while Resolved: keep status, reset the auto-close timer,
    // never auto-reopen (spec section 12.1).
    if (isRequester && ticket.status === "RESOLVED") {
      const newAutoCloseAt = new Date(Date.now() + appConfig.autoCloseAfterDays * 24 * 60 * 60 * 1000);
      await tx.ticket.update({ where: { id: ticketId }, data: { autoCloseAt: newAutoCloseAt } });
      await writeAuditLog(tx, {
        ticketId,
        actorId: currentUser.id,
        action: "AUTO_CLOSE_TIMER_RESET",
        newValue: newAutoCloseAt.toISOString(),
        details: "Requester commented on a Resolved ticket",
      });
    }

    if (isRequester) {
      const recipients = await getTicketNotificationRecipients(tx, ticket);
      await notify(tx, {
        ticketId,
        recipients,
        type: "REQUESTER_COMMENTED",
        message: `${currentUser.displayName} commented on ${ticket.ticketNumber}`,
      });
    }

    return comment;
  });
}
