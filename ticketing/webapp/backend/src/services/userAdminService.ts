import fs from "fs";
import path from "path";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { hashPassword } from "./authService";
import { generateTempPassword } from "../lib/passwordGenerator";
import { writeAuditLog } from "./auditService";
import type { RoleValue } from "../domain/enums";
import { env } from "../config";

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  department: true,
  jobTitle: true,
  role: true,
  isMaster: true,
  teamId: true,
  active: true,
  mustChangePassword: true,
  createdAt: true,
  team: { select: { id: true, name: true } },
} as const;

export async function listAllUsers() {
  return prisma.user.findMany({ select: userSelect, orderBy: { displayName: "asc" } });
}

interface CreateUserInput {
  email: string;
  displayName: string;
  department?: string;
  jobTitle?: string;
  role: RoleValue;
  teamId?: string | null;
}

export async function createUser(actingAdmin: User, input: CreateUserInput) {
  if (input.role === "ADMIN" && !actingAdmin.isMaster) {
    throw AppError.forbidden("Only the master administrator can grant the Admin role");
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw AppError.conflict("A user with this email already exists");
  }

  if (input.teamId) {
    const team = await prisma.team.findUnique({ where: { id: input.teamId } });
    if (!team || !team.active) {
      throw AppError.badRequest("Invalid team");
    }
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      displayName: input.displayName,
      department: input.department,
      jobTitle: input.jobTitle,
      role: input.role,
      teamId: input.teamId ?? null,
      passwordHash,
      mustChangePassword: true,
    },
    select: userSelect,
  });

  await writeAuditLog(prisma, {
    actorId: actingAdmin.id,
    action: "USER_CREATED",
    newValue: normalizedEmail,
    details: `role=${input.role}`,
  });

  return { user, tempPassword };
}

interface UpdateUserInput {
  email?: string;
  role?: RoleValue;
  teamId?: string | null;
  active?: boolean;
  displayName?: string;
  department?: string | null;
}

export async function updateUser(actingAdmin: User, userId: string, input: UpdateUserInput) {
  if (input.active === false && userId === actingAdmin.id) {
    throw AppError.badRequest("You cannot deactivate your own account");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    throw AppError.notFound("User not found");
  }

  if (target.isMaster && !actingAdmin.isMaster) {
    throw AppError.forbidden("Only the master administrator can edit the master account");
  }

  if (target.isMaster && (input.active === false || input.role === "REQUESTER")) {
    throw AppError.forbidden("The master user cannot be deactivated or downgraded");
  }

  if (input.role === "ADMIN" && target.role !== "ADMIN" && !actingAdmin.isMaster) {
    throw AppError.forbidden("Only the master administrator can grant the Admin role");
  }

  if (input.teamId) {
    const team = await prisma.team.findUnique({ where: { id: input.teamId } });
    if (!team || !team.active) {
      throw AppError.badRequest("Invalid team");
    }
  }

  const normalizedEmail = input.email?.trim().toLowerCase();
  if (normalizedEmail && normalizedEmail !== target.email) {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw AppError.conflict("A user with this email already exists");
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      email: normalizedEmail,
      role: input.role,
      teamId: input.teamId === undefined ? undefined : input.teamId,
      active: input.active,
      displayName: input.displayName,
      department: input.department === undefined ? undefined : input.department,
    },
    select: userSelect,
  });

  await writeAuditLog(prisma, {
    actorId: actingAdmin.id,
    action: "USER_UPDATED",
    newValue: target.email,
    details: `changed fields: ${Object.keys(input).join(", ")}`,
  });

  return updated;
}

export async function resetUserPassword(actingAdmin: User, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("User not found");
  }

  // Only the master may reset another admin's (or their own) master-level
  // credentials — otherwise any regular Admin could hijack the master account
  // by resetting its password and reading the returned temporary password.
  if (user.isMaster && !actingAdmin.isMaster) {
    throw AppError.forbidden("Only the master administrator can reset the master account's password");
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  await writeAuditLog(prisma, {
    actorId: actingAdmin.id,
    action: "USER_PASSWORD_RESET",
    newValue: user.email,
  });

  return { tempPassword };
}

// Hard delete is only allowed for accounts with zero history (never had
// tickets/comments/worklogs/attachments/audit entries/notifications) —
// otherwise it would either violate referential integrity or silently erase
// audit trail data. Anything with history must be deactivated instead.
export async function deleteUser(actingAdmin: User, userId: string, deleteHistory = false) {
  if (!actingAdmin.isMaster) {
    throw AppError.forbidden("Only the master user can delete accounts");
  }
  if (userId === actingAdmin.id) {
    throw AppError.badRequest("You cannot delete your own account");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    throw AppError.notFound("User not found");
  }

  if (target.isMaster) {
    throw AppError.forbidden("The master user cannot be deleted");
  }

  if (deleteHistory) {
    const requestedTickets = await prisma.ticket.findMany({
      where: { requesterId: userId },
      select: { id: true },
    });
    const requestedTicketIds = requestedTickets.map((ticket) => ticket.id);
    const ownedAttachments = await prisma.attachment.findMany({
      where: { OR: [{ uploadedById: userId }, { ticketId: { in: requestedTicketIds } }] },
      select: { storageKey: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.ticket.updateMany({ where: { assignedUserId: userId }, data: { assignedUserId: null } });
      await tx.auditLog.updateMany({ where: { actorId: userId }, data: { actorId: null } });
      await tx.comment.deleteMany({ where: { authorId: userId } });
      await tx.worklog.deleteMany({ where: { adminId: userId } });
      await tx.notification.deleteMany({ where: { recipientId: userId } });
      await tx.attachment.deleteMany({ where: { uploadedById: userId } });

      if (requestedTicketIds.length > 0) {
        await tx.ticketDeviceSnapshot.deleteMany({ where: { ticketId: { in: requestedTicketIds } } });
        await tx.comment.deleteMany({ where: { ticketId: { in: requestedTicketIds } } });
        await tx.worklog.deleteMany({ where: { ticketId: { in: requestedTicketIds } } });
        await tx.attachment.deleteMany({ where: { ticketId: { in: requestedTicketIds } } });
        await tx.auditLog.deleteMany({ where: { ticketId: { in: requestedTicketIds } } });
        await tx.notification.deleteMany({ where: { ticketId: { in: requestedTicketIds } } });
        await tx.ticket.deleteMany({ where: { id: { in: requestedTicketIds } } });
      }

      await tx.loginAttempt.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });

      await writeAuditLog(tx, {
        actorId: actingAdmin.id,
        action: "USER_DELETED",
        newValue: target.email,
        details: "Deleted with full ticket history",
      });
    });

    await Promise.all(
      ownedAttachments.map(async ({ storageKey }) => {
        const attachmentPath = path.join(env.uploadDir, storageKey);
        const relativePath = path.relative(path.resolve(env.uploadDir), attachmentPath);
        if (relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
          await fs.promises.unlink(attachmentPath).catch(() => undefined);
        }
      })
    );

    return { deleted: true, deletedTicketCount: requestedTicketIds.length, storageKeys: ownedAttachments.map((file) => file.storageKey) };
  }

  const [
    ticketsAsRequester,
    ticketsAssigned,
    comments,
    worklogs,
    attachments,
    auditLogs,
    notifications,
  ] = await Promise.all([
    prisma.ticket.count({ where: { requesterId: userId } }),
    prisma.ticket.count({ where: { assignedUserId: userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.worklog.count({ where: { adminId: userId } }),
    prisma.attachment.count({ where: { uploadedById: userId } }),
    prisma.auditLog.count({ where: { actorId: userId } }),
    prisma.notification.count({ where: { recipientId: userId } }),
  ]);

  const hasHistory =
    ticketsAsRequester + ticketsAssigned + comments + worklogs + attachments + auditLogs + notifications > 0;

  if (hasHistory) {
    throw AppError.conflict(
      "This user has tickets, comments, worklogs, attachments or other activity and cannot be deleted. Deactivate the account instead."
    );
  }

  await prisma.$transaction([
    // Login attempts are security telemetry, not business/audit data — safe to remove with the account.
    prisma.loginAttempt.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  await writeAuditLog(prisma, {
    actorId: actingAdmin.id,
    action: "USER_DELETED",
    newValue: target.email,
    details: "Deleted with no prior activity",
  });

  return { deleted: true, deletedTicketCount: 0, storageKeys: [] as string[] };
}
