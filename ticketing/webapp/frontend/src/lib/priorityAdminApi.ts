import { api } from "./api";

export interface ManagedPriority {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

export async function fetchManagedPriorities(): Promise<ManagedPriority[]> {
  const { data } = await api.get<{ priorities: ManagedPriority[] }>("/admin/priority-management");
  return data.priorities;
}

export async function createManagedPriority(label: string): Promise<ManagedPriority> {
  const { data } = await api.post<{ priority: ManagedPriority }>("/admin/priority-management", { label });
  return data.priority;
}

export async function updateManagedPriority(
  id: string,
  payload: Partial<Pick<ManagedPriority, "label" | "active" | "sortOrder">>
): Promise<ManagedPriority> {
  const { data } = await api.patch<{ priority: ManagedPriority }>(`/admin/priority-management/${id}`, payload);
  return data.priority;
}

export async function deleteManagedPriority(id: string): Promise<void> {
  await api.delete(`/admin/priority-management/${id}`);
}
