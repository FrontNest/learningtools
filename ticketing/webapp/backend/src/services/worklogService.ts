import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { writeAuditLog } from "./auditService";
import { assertValidWorklogDescription } from "../domain/worklogRules";

// Worklogs are Admin-only to view and create (spec section 14 / 20).
export async function listWorklogs(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw AppError.notFound("Ticket not found");
  }

  return prisma.worklog.findMany({
    where: { ticketId },
    include: { admin: { select: { id: true, displayName: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createWorklog(
  admin: User,
  ticketId: string,
  input: { durationMinutes: number; description: string }
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw AppError.notFound("Ticket not found");
  }

  assertValidWorklogDescription(input.description);

  return prisma.$transaction(async (tx) => {
    const worklog = await tx.worklog.create({
      data: {
        ticketId,
        adminId: admin.id,
        durationMinutes: input.durationMinutes,
        description: input.description,
      },
      include: { admin: { select: { id: true, displayName: true } } },
    });

    await writeAuditLog(tx, {
      ticketId,
      actorId: admin.id,
      action: "WORKLOG_ADDED",
      newValue: `${input.durationMinutes} min`,
    });

    return worklog;
  });
}
