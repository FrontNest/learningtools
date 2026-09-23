import type { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Prisma.TransactionClient | PrismaClient;

interface AuditEntryInput {
  ticketId?: string;
  actorId?: string | null;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  details?: string | null;
}

// Single place that writes AuditLog rows — append-only, actor may be null (SYSTEM).
export async function writeAuditLog(tx: TxClient, entry: AuditEntryInput) {
  await tx.auditLog.create({
    data: {
      ticketId: entry.ticketId,
      actorId: entry.actorId ?? null,
      action: entry.action,
      oldValue: entry.oldValue ?? null,
      newValue: entry.newValue ?? null,
      details: entry.details ?? null,
    },
  });
}

// Admin-only activity view (spec section 20/30). Actor is null for SYSTEM
// (e.g. automatic closure) entries.
export async function listAuditLogsForTicket(tx: TxClient, ticketId: string) {
  const auditLogs = await tx.auditLog.findMany({
    where: { ticketId },
    include: { actor: { select: { id: true, displayName: true } } },
    orderBy: { createdAt: "asc" },
  });

  const categoryIds = auditLogs
    .filter((entry) => entry.action === "CATEGORY_CHANGED")
    .flatMap((entry) => [entry.oldValue, entry.newValue])
    .filter((value): value is string => value !== null);
  const categories = categoryIds.length === 0
    ? []
    : await tx.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return auditLogs.map((entry) => entry.action === "CATEGORY_CHANGED"
    ? {
      ...entry,
      oldValue: entry.oldValue ? categoryNames.get(entry.oldValue) ?? entry.oldValue : null,
      newValue: entry.newValue ? categoryNames.get(entry.newValue) ?? entry.newValue : null,
    }
    : entry);
}
