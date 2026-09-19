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
  return tx.auditLog.findMany({
    where: { ticketId },
    include: { actor: { select: { id: true, displayName: true } } },
    orderBy: { createdAt: "asc" },
  });
}
