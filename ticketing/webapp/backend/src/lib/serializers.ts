import type { User } from "@prisma/client";

// Never send the password hash (or other sensitive fields) to the client.
export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    department: user.department,
    jobTitle: user.jobTitle,
    role: user.role,
    isMaster: user.isMaster,
    teamId: user.teamId,
    mustChangePassword: user.mustChangePassword,
    active: user.active,
  };
}
