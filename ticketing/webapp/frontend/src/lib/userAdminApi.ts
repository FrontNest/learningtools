import { api } from "./api";
import type { Role } from "../types/user";

export interface ManagedUser {
  id: string;
  email: string;
  displayName: string;
  isMaster: boolean;
  department: string | null;
  jobTitle: string | null;
  role: Role;
  teamId: string | null;
  team: { id: string; name: string } | null;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  email: string;
  displayName: string;
  department?: string;
  role: Role;
  teamId?: string | null;
}

export interface ImportResult {
  created: { email: string; tempPassword: string }[];
  updated: string[];
  skipped: { row: number; reason: string }[];
}

export async function fetchAllUsers(): Promise<ManagedUser[]> {
  const { data } = await api.get<{ users: ManagedUser[] }>("/admin/user-management");
  return data.users;
}

export async function createManagedUser(
  payload: CreateUserPayload
): Promise<{ user: ManagedUser; tempPassword: string }> {
  const { data } = await api.post<{ user: ManagedUser; tempPassword: string }>(
    "/admin/user-management",
    payload
  );
  return data;
}

export async function updateManagedUser(
  id: string,
  payload: Partial<Pick<ManagedUser, "email" | "displayName" | "role" | "teamId" | "active">>
): Promise<ManagedUser> {
  const { data } = await api.patch<{ user: ManagedUser }>(`/admin/user-management/${id}`, payload);
  return data.user;
}

export async function resetManagedUserPassword(id: string): Promise<{ tempPassword: string }> {
  const { data } = await api.post<{ tempPassword: string }>(`/admin/user-management/${id}/reset-password`);
  return data;
}

export interface UserManagementAuditEntry {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  details: string | null;
  createdAt: string;
  actor: { id: string; displayName: string } | null;
}

// Master-only endpoint — the backend rejects this for non-master admins.
export async function fetchUserManagementAuditLog(): Promise<UserManagementAuditEntry[]> {
  const { data } = await api.get<{ entries: UserManagementAuditEntry[] }>("/admin/user-management/audit-log");
  return data.entries;
}

export async function deleteManagedUser(id: string, deleteHistory = false): Promise<void> {
  await api.delete(`/admin/user-management/${id}`, { params: { deleteHistory } });
}

export async function importUsersCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<ImportResult>("/admin/user-management/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
