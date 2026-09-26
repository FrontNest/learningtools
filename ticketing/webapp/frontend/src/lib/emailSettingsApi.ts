import { api } from "./api";

export interface EmailSettings {
  enabled: boolean;
  tenantId: string | null;
  clientId: string | null;
  senderMailbox: string | null;
  hasClientSecret: boolean;
  updatedByEmail: string | null;
  updatedAt: string | null;
}

export interface UpdateEmailSettingsPayload {
  enabled: boolean;
  confirm: boolean;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  senderMailbox?: string;
}

export async function fetchEmailSettings(): Promise<EmailSettings> {
  const { data } = await api.get<EmailSettings>("/admin/email-settings");
  return data;
}

export async function updateEmailSettings(payload: UpdateEmailSettingsPayload): Promise<EmailSettings> {
  const { data } = await api.put<EmailSettings>("/admin/email-settings", payload);
  return data;
}
