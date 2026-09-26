import type { Prisma, PrismaClient, User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { writeAuditLog } from "./auditService";
import { PRIORITIES } from "../domain/enums";

type TxClient = Prisma.TransactionClient | PrismaClient;

const DEFAULT_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  CRITICAL: "Critical",
};

const DEFAULT_PRIORITIES = PRIORITIES.map((key, index) => ({
  key,
  label: DEFAULT_LABELS[key] ?? key,
  sortOrder: index,
}));

// Lazily seeds the four original priorities on first read so already-running
// deployments don't need a manual reseed after this feature ships.
async function ensureDefaultPriorities(tx: TxClient = prisma) {
  const count = await tx.ticketPriority.count();
  if (count === 0) {
    await tx.ticketPriority.createMany({ data: DEFAULT_PRIORITIES });
  }
}

function slugifyKey(label: string): string {
  const base = label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || "PRIORITY";
}

export async function listActivePriorities() {
  await ensureDefaultPriorities();
  return prisma.ticketPriority.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
}

export async function listAllPriorities() {
  await ensureDefaultPriorities();
  return prisma.ticketPriority.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function isValidActivePriorityKey(key: string, tx: TxClient = prisma): Promise<boolean> {
  await ensureDefaultPriorities(tx);
  const priority = await tx.ticketPriority.findUnique({ where: { key } });
  return Boolean(priority && priority.active);
}

function assertMaster(actor: User) {
  if (!actor.isMaster) {
    throw AppError.forbidden("Only the master administrator can manage priorities");
  }
}

export async function createPriority(master: User, input: { label: string }) {
  assertMaster(master);
  await ensureDefaultPriorities();

  const baseKey = slugifyKey(input.label);
  const maxSortOrder = await prisma.ticketPriority.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const key = attempt === 0 ? baseKey : `${baseKey}_${attempt + 1}`;
    try {
      const priority = await prisma.ticketPriority.create({
        data: { key, label: input.label, sortOrder },
      });

      await writeAuditLog(prisma, {
        actorId: master.id,
        action: "PRIORITY_CREATED",
        newValue: `${priority.key} (${priority.label})`,
      });

      return priority;
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002") throw error;
    }
  }

  throw AppError.conflict("Could not generate a unique priority key — try a different label");
}

export async function updatePriority(
  master: User,
  priorityId: string,
  input: { label?: string; active?: boolean; sortOrder?: number }
) {
  assertMaster(master);
  const priority = await prisma.ticketPriority.findUnique({ where: { id: priorityId } });
  if (!priority) throw AppError.notFound("Priority not found");

  const updated = await prisma.ticketPriority.update({
    where: { id: priorityId },
    data: {
      label: input.label,
      active: input.active,
      sortOrder: input.sortOrder,
    },
  });

  if (input.label !== undefined && input.label !== priority.label) {
    await writeAuditLog(prisma, {
      actorId: master.id,
      action: "PRIORITY_RENAMED",
      oldValue: `${priority.key}: ${priority.label}`,
      newValue: `${priority.key}: ${updated.label}`,
    });
  }
  if (input.active !== undefined && input.active !== priority.active) {
    await writeAuditLog(prisma, {
      actorId: master.id,
      action: input.active ? "PRIORITY_ACTIVATED" : "PRIORITY_DEACTIVATED",
      newValue: `${priority.key} (${priority.label})`,
    });
  }

  return updated;
}

export async function deletePriority(master: User, priorityId: string) {
  assertMaster(master);
  const priority = await prisma.ticketPriority.findUnique({ where: { id: priorityId } });
  if (!priority) throw AppError.notFound("Priority not found");

  const usageCount = await prisma.ticket.count({ where: { priority: priority.key } });
  if (usageCount > 0) {
    throw AppError.conflict(
      `${usageCount} ticket(s) still use this priority — deactivate it instead of deleting it`
    );
  }

  await prisma.ticketPriority.delete({ where: { id: priorityId } });

  await writeAuditLog(prisma, {
    actorId: master.id,
    action: "PRIORITY_DELETED",
    oldValue: `${priority.key} (${priority.label})`,
  });
}
