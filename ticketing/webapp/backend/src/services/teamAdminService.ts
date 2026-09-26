import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { writeAuditLog } from "./auditService";
import type { TeamTypeValue } from "../domain/enums";

const teamSelect = {
  id: true,
  name: true,
  type: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listAllTeams() {
  return prisma.team.findMany({ select: teamSelect, orderBy: { name: "asc" } });
}

export async function createTeam(actingAdmin: User, input: { name: string; type: TeamTypeValue }) {
  try {
    const team = await prisma.team.create({
      data: { name: input.name, type: input.type },
      select: teamSelect,
    });

    await writeAuditLog(prisma, {
      actorId: actingAdmin.id,
      action: "TEAM_CREATED",
      newValue: `${team.name} (${team.type})`,
    });

    return team;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw AppError.conflict("A team with this name already exists");
    }
    throw error;
  }
}

export async function updateTeam(
  actingAdmin: User,
  teamId: string,
  input: { name?: string; type?: TeamTypeValue; active?: boolean }
) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw AppError.notFound("Team not found");

  try {
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: input,
      select: teamSelect,
    });

    if (input.name !== undefined && input.name !== team.name) {
      await writeAuditLog(prisma, {
        actorId: actingAdmin.id,
        action: "TEAM_RENAMED",
        oldValue: team.name,
        newValue: updated.name,
      });
    }
    if (input.active !== undefined && input.active !== team.active) {
      await writeAuditLog(prisma, {
        actorId: actingAdmin.id,
        action: input.active ? "TEAM_ACTIVATED" : "TEAM_DEACTIVATED",
        newValue: `${updated.name} (${updated.type})`,
      });
    }
    if (input.type !== undefined && input.type !== team.type) {
      await writeAuditLog(prisma, {
        actorId: actingAdmin.id,
        action: "TEAM_TYPE_CHANGED",
        oldValue: team.type,
        newValue: updated.type,
      });
    }

    return updated;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw AppError.conflict("A team with this name already exists");
    }
    throw error;
  }
}
