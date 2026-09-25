import { api } from "./api";
import type { AppNotification } from "../types/ticket";

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<{ notifications: AppNotification[] }>("/notifications");
  return data.notifications;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data } = await api.patch<{ notification: AppNotification }>(`/notifications/${id}/read`);
  return data.notification;
}

export async function setAllNotificationsReadState(read: boolean): Promise<number> {
  const { data } = await api.patch<{ updated: number }>("/notifications/read-state", { read });
  return data.updated;
}
