import { parse } from "csv-parse/sync";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { hashPassword } from "./authService";
import { generateTempPassword } from "../lib/passwordGenerator";
import { writeAuditLog } from "./auditService";
import { ROLES, type RoleValue } from "../domain/enums";

// Expected (semicolon-delimited) header, matching the pattern already used
// for the device inventory import: email;displayName;department;jobTitle;role;team
const HEADER_MAP: Record<string, string> = {
  email: "email",
  displayname: "displayName",
  department: "department",
  jobtitle: "jobTitle",
  role: "role",
  team: "team",
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

interface ImportResult {
  created: { email: string; tempPassword: string }[];
  updated: string[];
  skipped: { row: number; reason: string }[];
}

// Bulk user import: never touches passwords for existing users (only sets a
// fresh temp password for newly created accounts) — CSV is a directory-sync
// source, not the authentication source of truth (see repo memory).
export async function importUsersFromCsv(actingAdmin: User, csvContent: string): Promise<ImportResult> {
  const records: Record<string, string>[] = parse(csvContent, {
    columns: (header: string[]) => header.map(normalizeHeader),
    delimiter: ";",
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const teams = await prisma.team.findMany({ where: { active: true } });
  const teamByName = new Map(teams.map((t) => [t.name.toLowerCase(), t.id]));

  const result: ImportResult = { created: [], updated: [], skipped: [] };

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const data: Record<string, string | undefined> = {};
    for (const [csvHeader, field] of Object.entries(HEADER_MAP)) {
      data[field] = row[csvHeader]?.trim() || undefined;
    }

    if (!data.email || !data.displayName) {
      result.skipped.push({ row: i + 2, reason: "Missing email or displayName" });
      continue;
    }

    const email = data.email.toLowerCase();
    let role: RoleValue = ROLES.includes(data.role as RoleValue) ? (data.role as RoleValue) : "REQUESTER";
    if (role === "ADMIN" && !actingAdmin.isMaster) {
      // Only the master may grant Admin via bulk import — silently downgrading
      // to Requester would be surprising, so the row is reported as skipped.
      result.skipped.push({ row: i + 2, reason: "Admin role requires master privileges" });
      continue;
    }
    const teamId = data.team ? teamByName.get(data.team.toLowerCase()) ?? null : null;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          displayName: data.displayName,
          department: data.department,
          jobTitle: data.jobTitle,
          teamId,
        },
      });
      result.updated.push(email);
      continue;
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    await prisma.user.create({
      data: {
        email,
        displayName: data.displayName,
        department: data.department,
        jobTitle: data.jobTitle,
        role,
        teamId,
        passwordHash,
        mustChangePassword: true,
      },
    });
    result.created.push({ email, tempPassword });
  }

  await writeAuditLog(prisma, {
    actorId: actingAdmin.id,
    action: "USERS_IMPORTED",
    details: `created=${result.created.length}, updated=${result.updated.length}, skipped=${result.skipped.length}`,
  });

  return result;
}
