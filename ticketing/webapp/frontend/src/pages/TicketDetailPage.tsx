import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../auth/AuthContext";
import { fetchAdminUsers, fetchTeams, fetchTicket, updateAssignment, updateTicket } from "../lib/ticketApi";
import type { AdminUser, Priority, Team, Ticket, TicketStatus } from "../types/ticket";
import { STATUS_PROGRESS } from "../types/ticket";
import { CommentsSection } from "../components/CommentsSection";
import { WorklogSection } from "../components/WorklogSection";
import { AttachmentsSection } from "../components/AttachmentsSection";
import { AuditLogSection } from "../components/AuditLogSection";

const STATUSES: TicketStatus[] = [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "WAITING_FOR_THIRD_PARTY",
  "RESOLVED",
  "CLOSED",
];
const PRIORITIES: Priority[] = ["LOW", "NORMAL", "HIGH", "CRITICAL"];

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamAdmins, setTeamAdmins] = useState<AdminUser[]>([]);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!id) return;
    fetchTicket(id)
      .then(setTicket)
      .catch(() => setError("Failed to load ticket."));
  }, [id]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchTeams().then(setTeams).catch(() => undefined);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const teamId = ticket?.assignedTeam?.id;
    if (!teamId) {
      setTeamAdmins([]);
      return;
    }
    fetchAdminUsers(teamId).then(setTeamAdmins).catch(() => undefined);
  }, [isAdmin, ticket?.assignedTeam?.id]);

  async function handleAdminChange(patch: { status?: TicketStatus; priority?: Priority }) {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateTicket(id, patch);
      setTicket(updated);
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignmentChange(patch: { assignedTeamId?: string | null; assignedUserId?: string | null }) {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAssignment(id, patch);
      setTicket(updated);
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to update assignment.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !ticket) return <p className="form-error">{error}</p>;
  if (!ticket) return <p>Loading...</p>;

  return (
    <div className="dashboard-page">
      <header>
      <h1>
        {ticket.ticketNumber} — {ticket.subject}
      </h1>
      <Link to="/">Back to tickets</Link>
    </header>
      <div className="ticket-meta">
        <span>Requester: {ticket.requester.displayName}</span>
        <span>Category: {ticket.category.name}</span>
        <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
      </div>

      <div className="ticket-meta">
        <label>
          Priority:{" "}
          {isAdmin ? (
            <select
              value={ticket.priority}
              disabled={saving}
              onChange={(e) => handleAdminChange({ priority: e.target.value as Priority })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            ticket.priority
          )}
        </label>

        <label>
          Status:{" "}
          {isAdmin ? (
            <select
              value={ticket.status}
              disabled={saving}
              onChange={(e) => handleAdminChange({ status: e.target.value as TicketStatus })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            ticket.status
          )}
        </label>

        <span>Progress: {STATUS_PROGRESS[ticket.status]}%</span>
      </div>

      {isAdmin ? (
        <div className="ticket-meta">
          <label>
            Team:{" "}
            <select
              value={ticket.assignedTeam?.id ?? ""}
              disabled={saving}
              onChange={(e) =>
                handleAssignmentChange({
                  assignedTeamId: e.target.value || null,
                  // Changing the team invalidates any previously assigned individual admin.
                  assignedUserId: null,
                })
              }
            >
              <option value="">Unassigned</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Assigned Admin:{" "}
            <select
              value={ticket.assignedUser?.id ?? ""}
              disabled={saving || !ticket.assignedTeam}
              onChange={(e) => handleAssignmentChange({ assignedUserId: e.target.value || null })}
            >
              <option value="">Unassigned</option>
              {teamAdmins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <>
          {ticket.assignedTeam && <p>Team: {ticket.assignedTeam.name}</p>}
          {ticket.assignedUser && <p>Assigned to: {ticket.assignedUser.displayName}</p>}
        </>
      )}
      {ticket.otherDeviceDescription && <p>Device: {ticket.otherDeviceDescription}</p>}
      {ticket.deviceSnapshot && (
        <p>
          Device: {ticket.deviceSnapshot.deviceName}
          {ticket.deviceSnapshot.model ? ` (${ticket.deviceSnapshot.model})` : ""}
          {ticket.deviceSnapshot.serialNumber ? ` — SN ${ticket.deviceSnapshot.serialNumber}` : ""}
        </p>
      )}
      {ticket.resolvedAt && <p>Resolved at: {new Date(ticket.resolvedAt).toLocaleString()}</p>}
      {ticket.autoCloseAt && <p>Auto-close at: {new Date(ticket.autoCloseAt).toLocaleString()}</p>}
      {ticket.closedAt && <p>Closed at: {new Date(ticket.closedAt).toLocaleString()}</p>}

      <h2>Description</h2>
      <p className="ticket-description">{ticket.description}</p>

      {error && <p className="form-error">{error}</p>}

      <CommentsSection ticketId={ticket.id} isAdmin={isAdmin} />
      <AttachmentsSection ticketId={ticket.id} />
      {isAdmin && <WorklogSection ticketId={ticket.id} />}
      {isAdmin && <AuditLogSection ticketId={ticket.id} />}
    </div>
  );
}
