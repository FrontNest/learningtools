// Centralized enum-like value definitions for fields stored as plain strings
// in SQLite (Prisma has no native enum support on the sqlite connector).
// These are the single source of truth for valid values — always validate
// incoming data against these, never trust a raw string from the client.

export const ROLES = ["REQUESTER", "ADMIN"] as const;
export type RoleValue = (typeof ROLES)[number];

export const TEAM_TYPES = ["REQUESTER_TEAM", "IT_TEAM"] as const;
export type TeamTypeValue = (typeof TEAM_TYPES)[number];

// Default seed keys only — the live, master-manageable priority list lives in
// the TicketPriority table (see priorityAdminService). Priority is no longer
// a fixed enum: Ticket.priority stores whatever active TicketPriority.key
// the master has configured.
export const PRIORITIES = ["LOW", "NORMAL", "HIGH", "CRITICAL"] as const;
export type PriorityValue = string;

export const TICKET_STATUSES = [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "WAITING_FOR_THIRD_PARTY",
  "RESOLVED",
  "CLOSED",
] as const;
export type TicketStatusValue = (typeof TICKET_STATUSES)[number];

// Status -> progress percentage mapping (single source of truth; never
// let clients submit an arbitrary progress value).
export const STATUS_PROGRESS: Record<TicketStatusValue, number> = {
  NEW: 0,
  ASSIGNED: 10,
  IN_PROGRESS: 50,
  WAITING_FOR_USER: 50,
  WAITING_FOR_THIRD_PARTY: 50,
  RESOLVED: 90,
  CLOSED: 100,
};

export const COMMENT_TYPES = ["PUBLIC", "INTERNAL"] as const;
export type CommentTypeValue = (typeof COMMENT_TYPES)[number];

export const DEVICE_SOURCES = ["INVENTORY", "INTUNE", "MANUAL"] as const;
export type DeviceSourceValue = (typeof DEVICE_SOURCES)[number];

export const NOTIFICATION_TYPES = [
  "TICKET_CREATED",
  "TICKET_ASSIGNED",
  "TICKET_REASSIGNED",
  "STATUS_CHANGED",
  "PRIORITY_CHANGED",
  "REQUESTER_COMMENTED",
  "ADMIN_COMMENTED",
  "COMMENT_ADDED",
  "INTERNAL_NOTE_ADDED",
  "WORKLOG_ADDED",
  "ASSIGNMENT_UPDATED",
  "ATTACHMENT_ADDED",
  "ATTACHMENT_DELETED",
  "TICKET_RESOLVED",
  "TICKET_CLOSED",
] as const;
export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_STATUSES = ["PENDING", "SENT", "FAILED"] as const;
export type NotificationStatusValue = (typeof NOTIFICATION_STATUSES)[number];
