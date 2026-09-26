import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ticketInclude } from "./ticketInclude";

const OPEN_STATUSES = [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "WAITING_FOR_THIRD_PARTY",
] as const;

// Admin dashboard summary (spec section 18). Both SD and L2 Admins see the
// same totals across all tickets — visibility is not restricted by team.
// NOTE: highPriority/criticalPriority below assume the default HIGH/CRITICAL
// priority keys still exist and are active; if a master renames or
// deactivates them these widgets will simply read 0 (see priorityAdminService).
export async function getDashboardSummary(admin: User) {
  const [
    totalOpen,
    unassigned,
    highPriority,
    criticalPriority,
    waitingForUser,
    waitingForThirdParty,
    myAssigned,
    teams,
    recentlyUpdated,
  ] = await Promise.all([
    prisma.ticket.count({ where: { status: { in: [...OPEN_STATUSES] } } }),
    prisma.ticket.count({ where: { assignedTeamId: null, assignedUserId: null, status: { in: [...OPEN_STATUSES] } } }),
    prisma.ticket.count({ where: { priority: "HIGH", status: { in: [...OPEN_STATUSES] } } }),
    prisma.ticket.count({ where: { priority: "CRITICAL", status: { in: [...OPEN_STATUSES] } } }),
    prisma.ticket.count({ where: { status: "WAITING_FOR_USER" } }),
    prisma.ticket.count({ where: { status: "WAITING_FOR_THIRD_PARTY" } }),
    prisma.ticket.count({ where: { assignedUserId: admin.id, status: { in: [...OPEN_STATUSES] } } }),
    prisma.team.findMany({ where: { active: true } }),
    prisma.ticket.findMany({
      include: ticketInclude,
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const teamCounts = await Promise.all(
    teams.map(async (team) => ({
      teamId: team.id,
      teamName: team.name,
      count: await prisma.ticket.count({ where: { assignedTeamId: team.id, status: { in: [...OPEN_STATUSES] } } }),
    }))
  );

  return {
    totalOpen,
    unassigned,
    highPriority,
    criticalPriority,
    waitingForUser,
    waitingForThirdParty,
    myAssigned,
    teamCounts,
    recentlyUpdated,
  };
}
