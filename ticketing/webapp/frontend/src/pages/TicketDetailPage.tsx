import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../auth/AuthContext";
import { deleteTicket, fetchAdminUsers, fetchCategories, fetchPriorities, fetchStatusLabels, fetchTeams, fetchTicket, updateAssignment, updateTicket } from "../lib/ticketApi";
import type { AdminUser, Category, Priority, PriorityOption, StatusLabelOption, Team, Ticket, TicketStatus } from "../types/ticket";
import { STATUS_PROGRESS } from "../types/ticket";
import { CommentsSection } from "../components/CommentsSection";
import { WorklogSection } from "../components/WorklogSection";
import { AttachmentsSection } from "../components/AttachmentsSection";
import { AuditLogSection } from "../components/AuditLogSection";

const OTHER_CATEGORY_VALUE = "__other_category__";

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamAdmins, setTeamAdmins] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<PriorityOption[]>([]);
  const [statusLabels, setStatusLabels] = useState<StatusLabelOption[]>([]);
  const [categoryDescription, setCategoryDescription] = useState("");
  const [auditRefreshToken, setAuditRefreshToken] = useState(0);

  const isAdmin = user?.role === "ADMIN";
  const isMaster = Boolean(user?.isMaster);

  function statusLabel(status: TicketStatus): string {
    return statusLabels.find((s) => s.key === status)?.label ?? status;
  }

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
    fetchPriorities().then(setPriorities).catch(() => undefined);
    fetchStatusLabels().then(setStatusLabels).catch(() => undefined);
  }, []);

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

  async function handleDeleteTicket() {
    if (!id || !window.confirm("Delete this ticket and all of its history permanently?")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteTicket(id);
      navigate("/", { replace: true });
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to delete ticket.");
      setDeleting(false);
    }
  }

  async function handleReopenTicket() {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateTicket(id, { status: "IN_PROGRESS" });
      setTicket(updated);
      setAuditRefreshToken((token) => token + 1);
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to reopen ticket.");
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
  const isFinalized = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
  const canEditTicketMeta = isAdmin && (!isFinalized || isMaster);
  const canChangeStatus = (isAdmin || canManageAsTeamRequester) && (!isFinalized || isMaster);

  return (
    <div className="dashboard-page">
      <header>
      <h1>
        {ticket.ticketNumber} — {ticket.subject}
      </h1>
      <Link id="nav-back-to-tickets-detail" className="nav-button" data-name="back-to-tickets" to="/">Back to tickets</Link>
    </header>
      <div className="ticket-meta">
        <span>Requester: {ticket.requester.displayName}</span>
        <span>Category: {ticket.category.name}</span>
        <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
      </div>

      <div className="ticket-meta">
        {canEditTicketMeta && (
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
        {canEditTicketMeta && (
          <label>
            Problem category:{" "}
            <select
              disabled={saving}
              value={ticket.otherCategoryDescription ? OTHER_CATEGORY_VALUE : findProblemCategoryId(categories, ticket.category.id)}
              onChange={(event) => {
                if (event.target.value === OTHER_CATEGORY_VALUE) {
                  setCategoryDescription(ticket.otherCategoryDescription ?? "");
                } else {
                  setCategoryDescription("");
                  const firstSubcategory = categories.find((category) => category.parentId === event.target.value);
                  handleCategoryChange(firstSubcategory?.id ?? event.target.value);
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
        {canEditTicketMeta && !ticket.otherCategoryDescription && (() => {
          const problemCategoryId = findProblemCategoryId(categories, ticket.category.id);
          const subcategories = categories.filter((category) => category.parentId === problemCategoryId);
          if (subcategories.length === 0) return null;
          return (
            <label>
              Problem subcategory:{" "}
              <select
                disabled={saving}
                value={ticket.category.id}
                onChange={(event) => handleCategoryChange(event.target.value)}
              >
                {subcategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          );
        })()}
        {canEditTicketMeta && (ticket.otherCategoryDescription !== null || categoryDescription !== "") && (
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
          {canEditTicketMeta ? (
            <select
              value={ticket.priority}
              disabled={saving}
              onChange={(e) => handleAdminChange({ priority: e.target.value })}
            >
              {priorities.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          ) : (
            priorities.find((p) => p.key === ticket.priority)?.label ?? ticket.priority
          )}
        </label>

        <label>
          Status:{" "}
          {canChangeStatus ? (
            <select
              value={ticket.status}
              disabled={saving}
              onChange={(e) => handleAdminChange({ status: e.target.value as TicketStatus })}
            >
              {statusLabels.map(({ key: s, label }) => (
                s === "CLOSED" && !isAdmin ? null : (
                <option key={s} value={s}>
                  {label}
                </option>
                )
              ))}
            </select>
          ) : (
            statusLabel(ticket.status)
          )}
          {ticket.canReopen && (
            <button className="link-button" disabled={saving} onClick={handleReopenTicket}>
              REOPEN
            </button>
          )}
        </label>

        <span>Progress: {STATUS_PROGRESS[ticket.status]}%</span>
      </div>

      {canEditTicketMeta ? (
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
          {canClaim && !isFinalized && (
            <button disabled={saving} onClick={() => handleAssignmentChange({ assignedUserId: user!.id })}>
              Assign to me
            </button>
          )}
        </>
      )}
      {ticket.otherDeviceDescription && <p>Device: {ticket.otherDeviceDescription}</p>}
      {ticket.otherCategoryDescription && <p>Category description: {ticket.otherCategoryDescription}</p>}
      {ticket.deviceSnapshot && (
        <div className="device-details">
          <h3>Device details</h3>
          <p>Name: {ticket.deviceSnapshot.deviceName ?? "—"}{ticket.deviceSnapshot.manufacturer ? ` (${ticket.deviceSnapshot.manufacturer})` : ""}</p>
          {ticket.deviceSnapshot.model && <p>Model: {ticket.deviceSnapshot.model}</p>}
          {ticket.deviceSnapshot.serialNumber && <p>Serial number: {ticket.deviceSnapshot.serialNumber}</p>}
          {(ticket.deviceSnapshot.operatingSystem || ticket.deviceSnapshot.osVersion) && (
            <p>OS: {ticket.deviceSnapshot.operatingSystem ?? "—"} {ticket.deviceSnapshot.osVersion ?? ""}</p>
          )}
          {ticket.deviceSnapshot.complianceState && <p>Compliance state: {ticket.deviceSnapshot.complianceState}</p>}
          {ticket.deviceSnapshot.managementState && <p>Management state: {ticket.deviceSnapshot.managementState}</p>}
          {ticket.deviceSnapshot.entraDeviceId && <p className="hint">Entra device ID: {ticket.deviceSnapshot.entraDeviceId}</p>}
          {ticket.deviceSnapshot.intuneDeviceId && <p className="hint">Intune managed device ID: {ticket.deviceSnapshot.intuneDeviceId}</p>}
          {ticket.deviceSnapshot.lastCheckIn && (
            <p className="hint">Last check-in (at ticket creation): {new Date(ticket.deviceSnapshot.lastCheckIn).toLocaleString()}</p>
          )}
        </div>
      )}
      {ticket.resolvedAt && <p>Resolved at: {new Date(ticket.resolvedAt).toLocaleString()}</p>}
      {ticket.autoCloseAt && <p>Auto-close at: {new Date(ticket.autoCloseAt).toLocaleString()}</p>}
      {ticket.closedAt && <p>Closed at: {new Date(ticket.closedAt).toLocaleString()}</p>}

      <h2>Description</h2>
      <p className="ticket-description">{ticket.description}</p>

      {error && <p className="form-error">{error}</p>}

      {isMaster && (
        <button className="danger-button" disabled={deleting} onClick={handleDeleteTicket}>
          {deleting ? "Deleting..." : "Delete ticket"}
        </button>
      )}

      <CommentsSection
        ticketId={ticket.id}
        isAdmin={isAdmin}
        canComment={ticket.status !== "CLOSED"}
        onActivityAdded={() => setAuditRefreshToken((token) => token + 1)}
      />
      <AttachmentsSection ticketId={ticket.id} />
      {isAdmin && <WorklogSection ticketId={ticket.id} onActivityAdded={() => setAuditRefreshToken((token) => token + 1)} />}
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

function findProblemCategoryId(categories: Category[], categoryId: string): string {
  let current = categories.find((category) => category.id === categoryId);
  while (current?.parentId) {
    const parent = categories.find((category) => category.id === current?.parentId);
    if (!parent?.parentId) return current.id;
    current = parent;
  }
  return current?.id ?? categoryId;
}
