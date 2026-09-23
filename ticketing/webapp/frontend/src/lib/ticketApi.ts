import { api } from "./api";
import type {
  AdminUser,
  Attachment,
  AuditLogEntry,
  Category,
  Comment,
  CommentType,
  DashboardSummary,
  DeviceOption,
  Priority,
  Team,
  Ticket,
  TicketStatus,
  TicketSummary,
  Worklog,
} from "../types/ticket";

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<{ categories: Category[] }>("/categories");
  return data.categories;
}

export async function fetchTeams(): Promise<Team[]> {
  const { data } = await api.get<{ teams: Team[] }>("/teams");
  return data.teams;
}

export async function fetchAdminUsers(teamId?: string): Promise<AdminUser[]> {
  const { data } = await api.get<{ users: AdminUser[] }>("/admin/users", {
    params: teamId ? { teamId } : undefined,
  });
  return data.users;
}

export async function fetchMyDevices(): Promise<DeviceOption[]> {
  const { data } = await api.get<{ devices: DeviceOption[] }>("/me/devices");
  return data.devices;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: Priority;
  assignedTeamId?: string;
  assignedUserId?: string;
  unassigned?: boolean;
  search?: string;
  createdByMe?: boolean;
  assignedToMe?: boolean;
}

export async function fetchTickets(filters?: TicketFilters): Promise<TicketSummary[]> {
  const { data } = await api.get<{ tickets: TicketSummary[] }>("/tickets", { params: filters });
  return data.tickets;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/dashboard/summary");
  return data;
}

export async function fetchTicket(id: string): Promise<Ticket> {
  const { data } = await api.get<{ ticket: Ticket }>(`/tickets/${id}`);
  return data.ticket;
}

export async function deleteTicket(id: string): Promise<void> {
  await api.delete(`/tickets/${id}`);
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
  categoryId: string;
  otherCategoryDescription?: string;
  priority: Priority;
  deviceId?: string;
  otherDeviceDescription?: string;
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const { data } = await api.post<{ ticket: Ticket }>("/tickets", payload);
  return data.ticket;
}

export async function updateTicket(
  id: string,
  payload: { status?: TicketStatus; priority?: Priority; categoryId?: string; otherCategoryDescription?: string | null }
): Promise<Ticket> {
  const { data } = await api.patch<{ ticket: Ticket }>(`/tickets/${id}`, payload);
  return data.ticket;
}

export async function updateAssignment(
  id: string,
  payload: { assignedTeamId?: string | null; assignedUserId?: string | null }
): Promise<Ticket> {
  const { data } = await api.patch<{ ticket: Ticket }>(`/tickets/${id}/assignment`, payload);
  return data.ticket;
}

export async function fetchComments(ticketId: string): Promise<Comment[]> {
  const { data } = await api.get<{ comments: Comment[] }>(`/tickets/${ticketId}/comments`);
  return data.comments;
}

export async function createComment(
  ticketId: string,
  payload: { text: string; type?: CommentType }
): Promise<Comment> {
  const { data } = await api.post<{ comment: Comment }>(`/tickets/${ticketId}/comments`, payload);
  return data.comment;
}

export async function fetchWorklogs(ticketId: string): Promise<Worklog[]> {
  const { data } = await api.get<{ worklogs: Worklog[] }>(`/tickets/${ticketId}/worklogs`);
  return data.worklogs;
}

export async function createWorklog(
  ticketId: string,
  payload: { durationMinutes: number; description: string }
): Promise<Worklog> {
  const { data } = await api.post<{ worklog: Worklog }>(`/tickets/${ticketId}/worklogs`, payload);
  return data.worklog;
}

export async function fetchAttachments(ticketId: string): Promise<Attachment[]> {
  const { data } = await api.get<{ attachments: Attachment[] }>(`/tickets/${ticketId}/attachments`);
  return data.attachments;
}

export async function uploadAttachment(ticketId: string, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ attachment: Attachment }>(
    `/tickets/${ticketId}/attachments`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.attachment;
}

export function attachmentDownloadUrl(ticketId: string, attachmentId: string): string {
  return `/api/tickets/${ticketId}/attachments/${attachmentId}`;
}

export async function fetchAuditLog(ticketId: string): Promise<AuditLogEntry[]> {
  const { data } = await api.get<{ auditLogs: AuditLogEntry[] }>(`/tickets/${ticketId}/audit`);
  return data.auditLogs;
}
