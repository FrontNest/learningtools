import type { PriorityValue, TicketStatusValue } from "./enums";
import { STATUS_PROGRESS, TICKET_STATUSES } from "./enums";
import { AppError } from "../errors/AppError";

// Centralized ticket business rules — never duplicate these checks in
// individual controllers/routes.

export function assertValidStatus(status: string): asserts status is TicketStatusValue {
  if (!TICKET_STATUSES.includes(status as TicketStatusValue)) {
    throw AppError.badRequest(`Invalid status: ${status}`);
  }
}

export function progressForStatus(status: TicketStatusValue): number {
  return STATUS_PROGRESS[status];
}

// A Requester may never set RESOLVED or CLOSED (spec section 10 / 24).
export function assertRequesterCanSetStatus(status: TicketStatusValue) {
  if (status === "RESOLVED" || status === "CLOSED") {
    throw AppError.forbidden("Requesters cannot set a ticket to Resolved or Closed");
  }
}

// A Requester may only ever set the initial priority at creation time;
// priority changes afterwards are Admin-only (spec section 8.4 / 24).
export function assertRequesterCanSetPriority(_priority: PriorityValue) {
  // Requesters are allowed to pick any valid priority at creation time.
  // (Kept as an explicit function so the rule has one authoritative home.)
}

export function isTicketOwnedByRequester(ticket: { requesterId: string }, requesterId: string) {
  return ticket.requesterId === requesterId;
}
