// Shared Prisma include shape for ticket reads across ticket/assignment services.
export const ticketInclude = {
  requester: { select: { id: true, displayName: true, email: true, department: true } },
  category: true,
  assignedTeam: true,
  assignedUser: { select: { id: true, displayName: true, email: true } },
  device: true,
  deviceSnapshot: true,
} as const;
