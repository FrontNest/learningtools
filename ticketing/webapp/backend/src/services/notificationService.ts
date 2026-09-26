import type { Prisma, PrismaClient, Ticket, User } from "@prisma/client";
import type { NotificationTypeValue } from "../domain/enums";
import type { CommentTypeValue } from "../domain/enums";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";

type TxClient = Prisma.TransactionClient | PrismaClient;

// Recipient rule (spec section 16.1 / master prompt section 17):
// - if the ticket has an individually assigned Admin, only that Admin is notified.
// - else if it is only assigned to a team, all active Admins of that team are notified.
// - if fully unassigned, there is no defined recipient yet.
export async function getTicketNotificationRecipients(tx: TxClient, ticket: Ticket): Promise<User[]> {
  if (ticket.assignedUserId) {
    const user = await tx.user.findUnique({ where: { id: ticket.assignedUserId } });
    return user && user.active ? [user] : [];
  }
  if (ticket.assignedTeamId) {
    return tx.user.findMany({ where: { teamId: ticket.assignedTeamId, role: "ADMIN", active: true } });
  }
  return [];
}

export async function getCommentNotificationRecipients(
  tx: TxClient,
  ticket: Ticket,
  commentType: CommentTypeValue,
  authorId: string
): Promise<User[]> {
  const admins = await tx.user.findMany({ where: { role: "ADMIN", active: true } });
  const recipients = admins.filter((admin) => admin.id !== authorId);

  if (commentType === "INTERNAL") return recipients;

  const requesterAccessConditions = [
    { id: ticket.requesterId },
    ...(ticket.assignedTeamId && !ticket.assignedUserId ? [{ teamId: ticket.assignedTeamId }] : []),
  ];
  const requesters = await tx.user.findMany({
    where: { role: "REQUESTER", active: true, OR: requesterAccessConditions },
  });

  for (const requester of requesters) {
    if (requester.id !== authorId && !recipients.some((recipient) => recipient.id === requester.id)) {
      recipients.push(requester);
    }
  }

  return recipients;
}

interface NotifyInput {
  ticketId: string;
  recipients: User[];
  type: NotificationTypeValue;
  message: string;
}

// Creates one Notification row per recipient. No outbound email in this
// standalone MVP — these are surfaced only as in-app notifications.
export async function notify(tx: TxClient, input: NotifyInput) {
  if (input.recipients.length === 0) return;

  await tx.notification.createMany({
    data: input.recipients.map((recipient) => ({
      ticketId: input.ticketId,
      recipientId: recipient.id,
      type: input.type,
      status: "SENT",
      message: input.message,
    })),
  });
}

export async function listNotificationsForUser(user: User) {
  return prisma.notification.findMany({
    where: { recipientId: user.id },
    include: { ticket: { select: { id: true, ticketNumber: true, subject: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(user: User, notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.recipientId !== user.id) {
    throw AppError.notFound("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

export async function setAllNotificationsReadState(user: User, read: boolean) {
  const result = await prisma.notification.updateMany({
    where: {
      recipientId: user.id,
      readAt: read ? null : { not: null },
    },
    data: { readAt: read ? new Date() : null },
  });
  return { updated: result.count };
}

