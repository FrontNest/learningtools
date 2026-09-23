import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { writeAuditLog } from "./auditService";
import { ticketInclude } from "./ticketInclude";
import { canRequesterAccessTicket } from "./ticketService";
import type { TicketStatusValue } from "../domain/enums";

export async function claimTeamTicket(requester: User, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { assignedTeam: true, assignedUser: true },
  });
  if (!ticket) throw AppError.notFound("Ticket not found");
  if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    throw AppError.forbidden("Resolved and closed tickets cannot be claimed");
  }
  if (!requester.teamId || ticket.assignedTeamId !== requester.teamId || ticket.assignedUserId) {
    throw AppError.forbidden("You can only claim unassigned tickets in your own team queue");
  }

  return prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticketId },
      data: { assignedUserId: requester.id, status: ticket.status === "NEW" ? "ASSIGNED" : undefined },
    });
    await writeAuditLog(tx, {
      ticketId,
      actorId: requester.id,
      action: "REQUESTER_CLAIMED_TICKET",
      oldValue: `${ticket.assignedTeam?.name ?? "Unassigned"} / Unassigned`,
      newValue: `${ticket.assignedTeam?.name ?? "Unassigned"} / ${requester.displayName}`,
    });
    return tx.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: ticketInclude });
  });
}

export async function updateTeamRequesterTicket(requester: User, ticketId: string, status: TicketStatusValue) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw AppError.notFound("Ticket not found");
  if (!canRequesterAccessTicket(requester, ticket)) throw AppError.forbidden();
  if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    throw AppError.forbidden("Resolved and closed tickets cannot have their status changed");
  }
  if (status === "CLOSED") throw AppError.forbidden("Requesters cannot close tickets");

  return prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id: ticketId }, data: { status } });
    await writeAuditLog(tx, {
      ticketId,
      actorId: requester.id,
      action: "STATUS_CHANGED",
      oldValue: ticket.status,
      newValue: status,
      details: "Status changed by requester team member",
    });
    return tx.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: ticketInclude });
  });
}
