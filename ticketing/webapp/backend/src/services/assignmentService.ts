import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { writeAuditLog } from "./auditService";
import { notify } from "./notificationService";
import { formatAssignmentLabel } from "../domain/assignmentRules";
import { ticketInclude } from "./ticketInclude";

interface AssignmentInput {
  assignedTeamId?: string | null;
  assignedUserId?: string | null;
}

export async function updateTicketAssignment(admin: User, ticketId: string, input: AssignmentInput) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { assignedTeam: true, assignedUser: true },
  });
  if (!ticket) {
    throw AppError.notFound("Ticket not found");
  }

  const nextTeamId = input.assignedTeamId !== undefined ? input.assignedTeamId : ticket.assignedTeamId;
  const nextUserId = input.assignedUserId !== undefined ? input.assignedUserId : ticket.assignedUserId;

  let nextTeam = ticket.assignedTeam;
  if (input.assignedTeamId !== undefined) {
    nextTeam = nextTeamId ? await prisma.team.findUnique({ where: { id: nextTeamId } }) : null;
    if (nextTeamId && (!nextTeam || !nextTeam.active)) {
      throw AppError.badRequest("Invalid team");
    }
  }

  let nextUser = ticket.assignedUser;
  if (input.assignedUserId !== undefined) {
    nextUser = nextUserId ? await prisma.user.findUnique({ where: { id: nextUserId } }) : null;
    if (nextUserId) {
      if (!nextUser || !nextUser.active || nextUser.role !== "ADMIN") {
        throw AppError.badRequest("Assigned user must be an active Admin");
      }
    }
  }

  // An individually-assigned Admin must belong to the team the ticket is assigned to
  // (spec section 5/9 — any Admin can still be reassigned regardless of current owner).
  if (nextUserId) {
    if (!nextTeamId) {
      throw AppError.badRequest("A team must be set when assigning an individual Admin");
    }
    if (nextUser!.teamId !== nextTeamId) {
      throw AppError.badRequest("Assigned Admin must belong to the assigned team");
    }
  }

  const oldLabel = formatAssignmentLabel(ticket.assignedTeam, ticket.assignedUser);
  const newLabel = formatAssignmentLabel(nextTeam, nextUser);

  if (oldLabel === newLabel) {
    return prisma.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: ticketInclude });
  }

  return prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticketId },
      data: { assignedTeamId: nextTeamId, assignedUserId: nextUserId },
    });

    await writeAuditLog(tx, {
      ticketId,
      actorId: admin.id,
      action: "ASSIGNMENT_CHANGED",
      oldValue: oldLabel,
      newValue: newLabel,
    });

    // Notify the newly assigned individual Admin, if any (spec section 16).
    if (nextUser && nextUser.id !== ticket.assignedUserId) {
      const wasAssignedBefore = Boolean(ticket.assignedUserId);
      await notify(tx, {
        ticketId,
        recipients: [nextUser],
        type: wasAssignedBefore ? "TICKET_REASSIGNED" : "TICKET_ASSIGNED",
        message: `Ticket ${ticket.ticketNumber} was assigned to you`,
      });
    }

    return tx.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: ticketInclude });
  });
}
