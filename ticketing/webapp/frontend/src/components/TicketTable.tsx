import { Link } from "react-router-dom";
import type { TicketSummary } from "../types/ticket";
import { STATUS_PROGRESS } from "../types/ticket";

export function TicketTable({ tickets, emptyLabel }: { tickets: TicketSummary[]; emptyLabel: string }) {
  return (
    <table className="ticket-table">
      <thead>
        <tr>
          <th>Ticket #</th>
          <th>Subject</th>
          <th>Requester</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Progress</th>
          <th>Assigned</th>
        </tr>
      </thead>
      <tbody>
        {tickets.length === 0 && (
          <tr>
            <td colSpan={7}>{emptyLabel}</td>
          </tr>
        )}
        {tickets.map((ticket) => (
          <tr key={ticket.id}>
            <td>
              <Link to={`/tickets/${ticket.id}`}>{ticket.ticketNumber}</Link>
            </td>
            <td>{ticket.subject}</td>
            <td>{ticket.requester.displayName}</td>
            <td>{ticket.priority}</td>
            <td>{ticket.status}</td>
            <td>{STATUS_PROGRESS[ticket.status]}%</td>
            <td>{ticket.assignedUser?.displayName ?? ticket.assignedTeam?.name ?? "Unassigned"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
