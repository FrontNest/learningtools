export type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type TicketStatus =
  | "NEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "WAITING_FOR_THIRD_PARTY"
  | "RESOLVED"
  | "CLOSED";

// Single source of truth for status -> progress mapping in the UI
// (must stay in sync with backend src/domain/enums.ts).
export const STATUS_PROGRESS: Record<TicketStatus, number> = {
  NEW: 0,
  ASSIGNED: 10,
  IN_PROGRESS: 50,
  WAITING_FOR_USER: 50,
  WAITING_FOR_THIRD_PARTY: 50,
  RESOLVED: 90,
  CLOSED: 100,
};

export interface Category {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  active: boolean;
}

export interface Team {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  teamId: string | null;
}

export interface DeviceOption {
  id: string;
  deviceName: string;
  model: string | null;
  operatingSystem: string | null;
  serialNumber: string | null;
}

export interface TicketSummary {
  id: string;
  ticketNumber: string;
  subject: string;
  priority: Priority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  requester: { id: string; displayName: string; email: string; department: string | null };
  category: Category;
  assignedTeam: Team | null;
  assignedUser: { id: string; displayName: string; email: string } | null;
}

export interface Ticket extends TicketSummary {
  description: string;
  otherDeviceDescription: string | null;
  resolvedAt: string | null;
  autoCloseAt: string | null;
  closedAt: string | null;
  deviceSnapshot: {
    deviceName: string | null;
    model: string | null;
    operatingSystem: string | null;
    serialNumber: string | null;
  } | null;
}

export type CommentType = "PUBLIC" | "INTERNAL";

export interface Comment {
  id: string;
  ticketId: string;
  text: string;
  type: CommentType;
  createdAt: string;
  author: { id: string; displayName: string; role: string };
}

export interface Worklog {
  id: string;
  ticketId: string;
  durationMinutes: number;
  description: string;
  createdAt: string;
  admin: { id: string; displayName: string };
}

export interface Attachment {
  id: string;
  ticketId: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: { id: string; displayName: string };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  details: string | null;
  createdAt: string;
  actor: { id: string; displayName: string } | null;
}

export interface DashboardSummary {
  totalOpen: number;
  unassigned: number;
  highPriority: number;
  criticalPriority: number;
  waitingForUser: number;
  waitingForThirdParty: number;
  myAssigned: number;
  teamCounts: { teamId: string; teamName: string; count: number }[];
  recentlyUpdated: TicketSummary[];
}

export type NotificationType =
  | "TICKET_CREATED"
  | "TICKET_ASSIGNED"
  | "TICKET_REASSIGNED"
  | "STATUS_CHANGED"
  | "PRIORITY_CHANGED"
  | "REQUESTER_COMMENTED"
  | "TICKET_RESOLVED"
  | "TICKET_CLOSED";

export interface AppNotification {
  id: string;
  ticketId: string | null;
  type: NotificationType;
  message: string;
  createdAt: string;
  readAt: string | null;
  ticket: { id: string; ticketNumber: string; subject: string } | null;
}
