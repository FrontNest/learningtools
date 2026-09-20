import { api } from "./api";

export interface ManagedCategory {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  active: boolean;
}

export async function fetchManagedCategories(): Promise<ManagedCategory[]> {
  const { data } = await api.get<{ categories: ManagedCategory[] }>("/admin/category-management");
  return data.categories;
}

export async function createManagedCategory(payload: {
  code: string;
  name: string;
  parentId?: string | null;
}): Promise<ManagedCategory> {
  const { data } = await api.post<{ category: ManagedCategory }>("/admin/category-management", payload);
  return data.category;
}

export async function updateManagedCategory(
  id: string,
  payload: Partial<Pick<ManagedCategory, "code" | "name" | "parentId" | "active">>
): Promise<ManagedCategory> {
  const { data } = await api.patch<{ category: ManagedCategory }>(`/admin/category-management/${id}`, payload);
  return data.category;
}
