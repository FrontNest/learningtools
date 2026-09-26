import { api } from "./api";

export interface ManagedDevice {
  id: string;
  source: string;
  deviceName: string;
  primaryUserEmail: string | null;
  entraDeviceId: string | null;
  intuneDeviceId: string | null;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  operatingSystem: string | null;
  osVersion: string | null;
  complianceState: string | null;
  managementState: string | null;
  lastCheckIn: string | null;
}

export async function fetchManagedDevices(): Promise<ManagedDevice[]> {
  const { data } = await api.get<{ devices: ManagedDevice[] }>("/admin/devices");
  return data.devices;
}

export async function syncDeviceInventory(): Promise<{ imported: number }> {
  const { data } = await api.post<{ imported: number }>("/admin/devices/sync");
  return data;
}

export async function importDeviceInventory(file: File): Promise<{ imported: number }> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ imported: number }>("/admin/devices/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
