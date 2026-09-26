import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { writeAuditLog } from "./auditService";
import { TICKET_STATUSES } from "../domain/enums";

const DEFAULT_LABELS: Record<string, string> = {
  NEW: "New",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  WAITING_FOR_USER: "Waiting for user",
  WAITING_FOR_THIRD_PARTY: "Waiting for third party",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

// Lazily seeds default labels for the 7 fixed status keys on first read so
// already-running deployments don't need a manual reseed after this feature
// ships. The set of keys itself is never editable — only the label is.
async function ensureDefaultStatusLabels() {
  const count = await prisma.ticketStatusLabel.count();
  if (count === 0) {
    await prisma.ticketStatusLabel.createMany({
      data: TICKET_STATUSES.map((key) => ({ key, label: DEFAULT_LABELS[key] ?? key })),
    });
  }
}

export async function listStatusLabels() {
  await ensureDefaultStatusLabels();
  const labels = await prisma.ticketStatusLabel.findMany();
  const byKey = new Map(labels.map((entry) => [entry.key, entry.label]));
  return TICKET_STATUSES.map((key) => ({ key, label: byKey.get(key) ?? DEFAULT_LABELS[key] ?? key }));
}

export async function updateStatusLabel(master: User, key: string, input: { label: string }) {
  if (!master.isMaster) {
    throw AppError.forbidden("Only the master administrator can rename ticket statuses");
  }
  if (!TICKET_STATUSES.includes(key as (typeof TICKET_STATUSES)[number])) {
    throw AppError.badRequest("Unknown status key");
  }
  await ensureDefaultStatusLabels();

  const existing = await prisma.ticketStatusLabel.findUnique({ where: { key } });
  const updated = await prisma.ticketStatusLabel.upsert({
    where: { key },
    update: { label: input.label },
    create: { key, label: input.label },
  });

  await writeAuditLog(prisma, {
    actorId: master.id,
    action: "STATUS_LABEL_RENAMED",
    oldValue: existing ? `${key}: ${existing.label}` : null,
    newValue: `${key}: ${updated.label}`,
  });

  return updated;
}
