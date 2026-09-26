import { api } from "./api";

export interface StatusLabel {
  key: string;
  label: string;
}

export async function fetchManagedStatusLabels(): Promise<StatusLabel[]> {
  const { data } = await api.get<{ statuses: StatusLabel[] }>("/admin/status-management");
  return data.statuses;
}

export async function updateManagedStatusLabel(key: string, label: string): Promise<StatusLabel> {
  const { data } = await api.patch<{ status: StatusLabel }>(`/admin/status-management/${key}`, { label });
  return data.status;
}
