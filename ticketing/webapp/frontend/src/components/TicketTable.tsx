import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { PriorityOption, StatusLabelOption, TicketSummary } from "../types/ticket";
import { STATUS_PROGRESS } from "../types/ticket";

export function TicketTable({
  tickets,
  emptyLabel,
  priorities = [],
  statusLabels = [],
}: {
  tickets: TicketSummary[];
  emptyLabel: string;
  priorities?: PriorityOption[];
  statusLabels?: StatusLabelOption[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("ticketNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  function priorityLabel(key: string): string {
    return priorities.find((p) => p.key === key)?.label ?? key;
  }
  function statusLabel(key: string): string {
    return statusLabels.find((s) => s.key === key)?.label ?? key;
  }

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((left, right) => {
      const leftValue = sortValue(left, sortKey);
      const rightValue = sortValue(right, sortKey);
      const result = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? result : -result;
    });
  }, [tickets, sortDirection, sortKey]);

  function changeSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  }

  const heading = (label: string, key: SortKey) => (
    <button className="table-sort-button" onClick={() => changeSort(key)}>
      {label} {sortKey === key ? (sortDirection === "asc" ? "A-Z" : "Z-A") : ""}
    </button>
  );

  return (
    <table className="ticket-table">
      <thead>
        <tr>
          <th>{heading("Ticket #", "ticketNumber")}</th>
          <th>{heading("Subject", "subject")}</th>
          <th>{heading("Requester", "requester")}</th>
          <th>{heading("Priority", "priority")}</th>
          <th>{heading("Status", "status")}</th>
          <th>{heading("Progress", "progress")}</th>
          <th>{heading("Assigned", "assigned")}</th>
        </tr>
      </thead>
      <tbody>
        {tickets.length === 0 && (
          <tr>
            <td colSpan={7}>{emptyLabel}</td>
          </tr>
        )}
        {sortedTickets.map((ticket) => (
          <tr key={ticket.id}>
            <td>
              <Link to={`/tickets/${ticket.id}`}>{ticket.ticketNumber}</Link>
            </td>
            <td>{ticket.subject}</td>
            <td>{ticket.requester.displayName}</td>
            <td>{priorityLabel(ticket.priority)}</td>
            <td>{statusLabel(ticket.status)}</td>
            <td>{STATUS_PROGRESS[ticket.status]}%</td>
            <td>{ticket.assignedUser?.displayName ?? ticket.assignedTeam?.name ?? "Unassigned"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type SortKey = "ticketNumber" | "subject" | "requester" | "priority" | "status" | "progress" | "assigned";
type SortDirection = "asc" | "desc";

function sortValue(ticket: TicketSummary, key: SortKey): string {
  switch (key) {
    case "requester":
      return ticket.requester.displayName;
    case "assigned":
      return ticket.assignedUser?.displayName ?? ticket.assignedTeam?.name ?? "Unassigned";
    case "progress":
      return String(STATUS_PROGRESS[ticket.status]);
    case "ticketNumber":
      return ticket.ticketNumber;
    case "subject":
      return ticket.subject;
    case "priority":
      return ticket.priority;
    case "status":
      return ticket.status;
  }
}
