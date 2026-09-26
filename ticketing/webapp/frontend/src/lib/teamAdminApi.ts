import { api } from "./api";

export interface ManagedTeam {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

export async function fetchManagedTeams(): Promise<ManagedTeam[]> {
  const { data } = await api.get<{ teams: ManagedTeam[] }>("/admin/team-management");
  return data.teams;
}

export async function createManagedTeam(input: { name: string; type: string }): Promise<ManagedTeam> {
  const { data } = await api.post<{ team: ManagedTeam }>("/admin/team-management", input);
  return data.team;
}

export async function updateManagedTeam(
  id: string,
  payload: Partial<Pick<ManagedTeam, "name" | "type" | "active">>
): Promise<ManagedTeam> {
  const { data } = await api.patch<{ team: ManagedTeam }>(`/admin/team-management/${id}`, payload);
  return data.team;
}
