import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../auth/AuthContext";
import { fetchAdminUsers, fetchCategories, fetchTeams, fetchTicket, updateAssignment, updateTicket } from "../lib/ticketApi";
import type { AdminUser, Category, Priority, Team, Ticket, TicketStatus } from "../types/ticket";
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
const OTHER_CATEGORY_VALUE = "__other_category__";

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamAdmins, setTeamAdmins] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryDescription, setCategoryDescription] = useState("");
  const [auditRefreshToken, setAuditRefreshToken] = useState(0);

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
    if (isAdmin) fetchCategories().then(setCategories).catch(() => undefined);
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
      setAuditRefreshToken((token) => token + 1);
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCategoryChange(categoryId: string) {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateTicket(id, {
        categoryId: categoryId === OTHER_CATEGORY_VALUE ? ticket?.category.id : categoryId,
        otherCategoryDescription: categoryId === OTHER_CATEGORY_VALUE ? categoryDescription : null,
      });
      setTicket(updated);
      setAuditRefreshToken((token) => token + 1);
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to update category.");
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
      setAuditRefreshToken((token) => token + 1);
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to update assignment.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !ticket) return <p className="form-error">{error}</p>;
  if (!ticket) return <p>Loading...</p>;

  const canManageAsTeamRequester = Boolean(
    !isAdmin &&
      user?.role === "REQUESTER" &&
      user.teamId &&
      ticket.assignedTeam?.id === user.teamId &&
      (!ticket.assignedUser || ticket.assignedUser.id === user.id)
  );
  const canClaim = canManageAsTeamRequester && !ticket.assignedUser;

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
        {isAdmin && (
          <label>
            Category group:{" "}
            <select
              disabled={saving}
              value={findTopCategoryId(categories, ticket.category.id)}
              onChange={(event) => {
                const nextGroup = categories.find((category) => category.id === event.target.value);
                const firstChild = categories.find((category) => category.parentId === nextGroup?.id);
                if (firstChild) handleCategoryChange(firstChild.id);
              }}
            >
              {categories.filter((category) => !category.parentId).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
        )}
        {isAdmin && (
          <label>
            Problem category:{" "}
            <select
              disabled={saving}
              value={ticket.otherCategoryDescription ? OTHER_CATEGORY_VALUE : ticket.category.id}
              onChange={(event) => {
                if (event.target.value === OTHER_CATEGORY_VALUE) {
                  setCategoryDescription(ticket.otherCategoryDescription ?? "");
                } else {
                  setCategoryDescription("");
                  handleCategoryChange(event.target.value);
                }
              }}
            >
              {categories
                .filter((category) => category.parentId === findTopCategoryId(categories, ticket.category.id))
                .map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              <option value={OTHER_CATEGORY_VALUE}>Other...</option>
            </select>
          </label>
        )}
        {isAdmin && (ticket.otherCategoryDescription !== null || categoryDescription !== "") && (
          <label>
            Category description:{" "}
            <input
              value={categoryDescription}
              onChange={(event) => setCategoryDescription(event.target.value)}
              onBlur={() => handleCategoryChange(OTHER_CATEGORY_VALUE)}
              placeholder="Describe the problem category"
            />
          </label>
        )}
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
          {isAdmin || canManageAsTeamRequester ? (
            <select
              value={ticket.status}
              disabled={saving}
              onChange={(e) => handleAdminChange({ status: e.target.value as TicketStatus })}
            >
              {STATUSES.map((s) => (
                s === "CLOSED" && !isAdmin ? null : (
                <option key={s} value={s}>
                  {s}
                </option>
                )
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
          {canClaim && (
            <button disabled={saving} onClick={() => handleAssignmentChange({ assignedUserId: user!.id })}>
              Assign to me
            </button>
          )}
        </>
      )}
      {ticket.otherDeviceDescription && <p>Device: {ticket.otherDeviceDescription}</p>}
      {ticket.otherCategoryDescription && <p>Category description: {ticket.otherCategoryDescription}</p>}
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
      {isAdmin && <AuditLogSection ticketId={ticket.id} refreshToken={auditRefreshToken} />}
    </div>
  );
}

function findTopCategoryId(categories: Category[], categoryId: string): string {
  let current = categories.find((category) => category.id === categoryId);
  while (current?.parentId) {
    current = categories.find((category) => category.id === current?.parentId);
  }
  return current?.id ?? categoryId;
}
