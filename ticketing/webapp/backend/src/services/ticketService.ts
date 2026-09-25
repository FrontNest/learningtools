import fs from "fs";
import path from "path";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { nextTicketNumber } from "./ticketNumberService";
import { writeAuditLog } from "./auditService";
import { notify } from "./notificationService";
import { appConfig, env } from "../config";
import { assertValidStatus } from "../domain/ticketRules";
import type { PriorityValue, TicketStatusValue } from "../domain/enums";
import { ticketInclude } from "./ticketInclude";

interface CreateTicketInput {
  subject: string;
  description: string;
  categoryId: string;
  otherCategoryDescription?: string;
  priority: PriorityValue;
  deviceId?: string;
  otherDeviceDescription?: string;
}

export async function createTicket(requester: User, input: CreateTicketInput) {
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category || !category.active) {
    throw AppError.badRequest("Invalid category");
  }

  let device = null;
  if (input.deviceId) {
    device = await prisma.device.findUnique({ where: { id: input.deviceId } });
    if (!device) {
      throw AppError.badRequest("Invalid device");
    }
  }

  const year = new Date().getFullYear();

  return prisma.$transaction(async (tx) => {
    const ticketNumber = await nextTicketNumber(tx, year);

    const ticket = await tx.ticket.create({
      data: {
        ticketNumber,
        requesterId: requester.id,
        requesterTeamId: requester.teamId,
        subject: input.subject,
        description: input.description,
        categoryId: category.id,
        otherCategoryDescription: input.otherCategoryDescription,
        priority: input.priority,
        status: "NEW",
        deviceId: device?.id,
        otherDeviceDescription: device ? null : input.otherDeviceDescription,
      },
    });

    if (device) {
      await tx.ticketDeviceSnapshot.create({
        data: {
          ticketId: ticket.id,
          deviceId: device.id,
          deviceName: device.deviceName,
          entraDeviceId: device.entraDeviceId,
          intuneDeviceId: device.intuneDeviceId,
          serialNumber: device.serialNumber,
          manufacturer: device.manufacturer,
          model: device.model,
          operatingSystem: device.operatingSystem,
          osVersion: device.osVersion,
          complianceState: device.complianceState,
          managementState: device.managementState,
          lastCheckIn: device.lastCheckIn,
          ipAddress: device.ipAddress,
        },
      });
    }

    await writeAuditLog(tx, {
      ticketId: ticket.id,
      actorId: requester.id,
      action: "TICKET_CREATED",
      newValue: ticket.ticketNumber,
    });

    return tx.ticket.findUniqueOrThrow({ where: { id: ticket.id }, include: ticketInclude });
  });
}

interface ListTicketsFilters {
  status?: TicketStatusValue;
  priority?: PriorityValue;
  assignedTeamId?: string;
  assignedUserId?: string;
  categoryId?: string;
  search?: string;
  unassigned?: boolean;
  openOnly?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
  createdByMe?: boolean;
  assignedToMe?: boolean;
}

export async function listTickets(currentUser: User, filters: ListTicketsFilters) {
  const where: Record<string, unknown> = {};

  if (currentUser.role === "REQUESTER") {
    where.OR = [
      { requesterId: currentUser.id },
      ...(currentUser.teamId
        ? [
            { assignedTeamId: currentUser.teamId, assignedUserId: null },
            { assignedTeamId: currentUser.teamId, assignedUserId: currentUser.id },
          ]
        : []),
    ];
  }

  if (filters.status) where.status = filters.status;
  if (filters.openOnly) where.status = { in: ["NEW", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_USER", "WAITING_FOR_THIRD_PARTY"] };
  if (filters.priority) where.priority = filters.priority;
  if (filters.assignedTeamId) where.assignedTeamId = filters.assignedTeamId;
  if (filters.assignedUserId) where.assignedUserId = filters.assignedUserId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.createdByMe) where.requesterId = currentUser.id;
  if (filters.assignedToMe) where.assignedUserId = currentUser.id;
  if (filters.unassigned) {
    where.assignedTeamId = null;
    where.assignedUserId = null;
  }
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {
      ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
      ...(filters.createdTo ? { lte: filters.createdTo } : {}),
    };
  }
  if (filters.search) {
    const searchConditions = [
      { subject: { contains: filters.search } },
      { ticketNumber: { contains: filters.search } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchConditions }];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  return prisma.ticket.findMany({
    where,
    include: ticketInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getTicketById(currentUser: User, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: ticketInclude });
  if (!ticket) {
    throw AppError.notFound("Ticket not found");
  }

  if (currentUser.role === "REQUESTER" && !canRequesterAccessTicket(currentUser, ticket)) {
    throw AppError.forbidden();
  }

  const canReopen = ticket.status === "CLOSED"
    ? currentUser.isMaster
    : ticket.status === "RESOLVED" && await canAdminReopenResolvedTicket(currentUser, ticket);

  return { ...ticket, canReopen };
}

export function canRequesterAccessTicket(
  currentUser: Pick<User, "id" | "teamId" | "role">,
  ticket: { requesterId: string; requesterTeamId: string | null; assignedTeamId: string | null; assignedUserId: string | null }
) {
  if (currentUser.role !== "REQUESTER") return true;
  if (ticket.requesterId === currentUser.id) return true;
  return Boolean(
    currentUser.teamId &&
      ticket.assignedTeamId === currentUser.teamId &&
      (ticket.assignedUserId === null || ticket.assignedUserId === currentUser.id)
  );
}

interface UpdateTicketInput {
  priority?: PriorityValue;
  status?: TicketStatusValue;
  categoryId?: string;
  otherCategoryDescription?: string | null;
}

// Callers (routes) must already restrict this to Admin users.
export async function updateTicketAsAdmin(admin: User, ticketId: string, input: UpdateTicketInput) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { category: { select: { name: true } } },
  });
  if (!ticket) {
    throw AppError.notFound("Ticket not found");
  }

  const isReopening = input.status === "IN_PROGRESS";
  if (ticket.status === "CLOSED") {
    if (!admin.isMaster || !isReopening || Object.keys(input).length !== 1) {
      throw AppError.forbidden("Closed tickets can only be reopened by the master administrator");
    }
  }
  if (ticket.status === "RESOLVED") {
    if (!isReopening || Object.keys(input).length !== 1 || !await canAdminReopenResolvedTicket(admin, ticket)) {
      throw AppError.forbidden("Only the resolving Admin can reopen this ticket after a requester follow-up within five days");
    }
  }

  return prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = {};

    if (input.categoryId && input.categoryId !== ticket.categoryId) {
      const category = await tx.category.findUnique({ where: { id: input.categoryId } });
      if (!category || !category.active) throw AppError.badRequest("Invalid category");
      data.categoryId = input.categoryId;
      await writeAuditLog(tx, {
        ticketId,
        actorId: admin.id,
        action: "CATEGORY_CHANGED",
        oldValue: ticket.category.name,
        newValue: category.name,
      });
    }
    if (input.otherCategoryDescription !== undefined) {
      data.otherCategoryDescription = input.otherCategoryDescription;
      if (input.otherCategoryDescription !== ticket.otherCategoryDescription) {
        await writeAuditLog(tx, {
          ticketId,
          actorId: admin.id,
          action: "CATEGORY_DESCRIPTION_CHANGED",
          oldValue: ticket.otherCategoryDescription,
          newValue: input.otherCategoryDescription,
        });
      }
    }

    if (input.priority && input.priority !== ticket.priority) {
      data.priority = input.priority;
      await writeAuditLog(tx, {
        ticketId,
        actorId: admin.id,
        action: "PRIORITY_CHANGED",
        oldValue: ticket.priority,
        newValue: input.priority,
      });
    }

    if (input.status && input.status !== ticket.status) {
      assertValidStatus(input.status);
      const now = new Date();

      data.status = input.status;
      if (isReopening) {
        data.resolvedAt = null;
        data.autoCloseAt = null;
        data.closedAt = null;
      }
      if (input.status === "RESOLVED") {
        data.resolvedAt = now;
        data.autoCloseAt = new Date(now.getTime() + appConfig.autoCloseAfterDays * 24 * 60 * 60 * 1000);
      }
      if (input.status === "CLOSED") {
        data.closedAt = now;
      }

      await writeAuditLog(tx, {
        ticketId,
        actorId: admin.id,
        action: "STATUS_CHANGED",
        oldValue: ticket.status,
        newValue: input.status,
      });

      const requester = await tx.user.findUnique({ where: { id: ticket.requesterId } });
      if (requester && requester.active) {
        const notificationType =
          input.status === "RESOLVED" ? "TICKET_RESOLVED" : input.status === "CLOSED" ? "TICKET_CLOSED" : "STATUS_CHANGED";
        await notify(tx, {
          ticketId,
          recipients: [requester],
          type: notificationType,
          message: `${ticket.ticketNumber} status changed to ${input.status}`,
        });
      }
    }

    if (Object.keys(data).length === 0) {
      return tx.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: ticketInclude });
    }

    await tx.ticket.update({ where: { id: ticketId }, data });
    return tx.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: ticketInclude });
  });
}

async function canAdminReopenResolvedTicket(admin: User, ticket: { id: string; requesterId: string }) {
  if (admin.role !== "ADMIN") return false;

  const resolution = await prisma.auditLog.findFirst({
    where: { ticketId: ticket.id, action: "STATUS_CHANGED", newValue: "RESOLVED" },
    orderBy: { createdAt: "desc" },
  });
  if (!resolution || resolution.actorId !== admin.id) return false;

  const followUpDeadline = new Date(resolution.createdAt.getTime() + appConfig.autoCloseAfterDays * 24 * 60 * 60 * 1000);
  const followUp = await prisma.comment.findFirst({
    where: {
      ticketId: ticket.id,
      authorId: ticket.requesterId,
      createdAt: { gte: resolution.createdAt, lte: followUpDeadline },
    },
  });
  return Boolean(followUp);
}

export async function deleteTicketAsMaster(master: User, ticketId: string) {
  if (!master.isMaster) {
    throw AppError.forbidden("Only the master administrator can delete tickets");
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, attachments: { select: { storageKey: true } } },
  });
  if (!ticket) {
    throw AppError.notFound("Ticket not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.ticketDeviceSnapshot.deleteMany({ where: { ticketId } });
    await tx.comment.deleteMany({ where: { ticketId } });
    await tx.worklog.deleteMany({ where: { ticketId } });
    await tx.attachment.deleteMany({ where: { ticketId } });
    await tx.auditLog.deleteMany({ where: { ticketId } });
    await tx.notification.deleteMany({ where: { ticketId } });
    await tx.ticket.delete({ where: { id: ticketId } });
  });

  await Promise.all(ticket.attachments.map(async ({ storageKey }) => {
    const attachmentPath = path.join(env.uploadDir, storageKey);
    const relativePath = path.relative(path.resolve(env.uploadDir), attachmentPath);
    if (relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
      await fs.promises.unlink(attachmentPath).catch(() => undefined);
    }
  }));
}
