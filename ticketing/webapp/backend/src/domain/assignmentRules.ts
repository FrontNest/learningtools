// Centralized assignment business rules (spec section 5 / 9).
// - assignedUserId, when set, must reference an active Admin.
// - an assigned Admin must belong to the assigned team (assignedTeamId).
// - Unassigned / team-only / team+individual are the only valid combinations.

export function formatAssignmentLabel(
  team: { name: string } | null,
  user: { displayName: string } | null
): string {
  if (!team && !user) return "Unassigned";
  if (team && !user) return team.name;
  if (team && user) return `${team.name} / ${user.displayName}`;
  return "Unassigned";
}
