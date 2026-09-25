import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchAdminUsers, fetchTeams, fetchTickets, type TicketFilters } from "../lib/ticketApi";
import { fetchNotifications } from "../lib/notificationApi";
import type { AdminUser, Priority, Team, TicketStatus, TicketSummary } from "../types/ticket";
import { TicketTable } from "../components/TicketTable";
import { AdminSummaryBar } from "../components/AdminSummaryBar";
import { BrowserNotificationButton } from "../components/BrowserNotificationWatcher";

export function TicketListPage() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    fetchTickets(filters)
      .then(setTickets)
      .catch(() => setError("Failed to load tickets."))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(load, [load]);

  useEffect(() => {
    fetchNotifications()
      .then((notifications) => setUnreadCount(notifications.filter((n) => !n.readAt).length))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchTeams().then(setTeams).catch(() => undefined);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAdminUsers(filters.assignedTeamId).then(setAdmins).catch(() => undefined);
  }, [filters.assignedTeamId, isAdmin]);

  function updateFilter<K extends keyof TicketFilters>(key: K, value: TicketFilters[K] | undefined) {
    setFilters((current) => ({ ...current, ...(value ? { [key]: value } : { [key]: undefined }) }));
  }

  return (
    <div className="dashboard-page">
      <header>
        <div>
          <h1>{isAdmin ? "All tickets" : "My tickets"}</h1>
          <p>Signed in as {user?.displayName} ({user?.role})</p>
        </div>
        <div className="header-actions">
          <BrowserNotificationButton />
          <Link id="nav-notifications" className="nav-button" data-name="notifications" to="/notifications">Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}</Link>
          {isAdmin && <Link id="nav-manage-users" className="nav-button" data-name="manage-users" to="/admin/users">Manage users</Link>}
          {isAdmin && <Link id="nav-manage-categories" className="nav-button" data-name="manage-categories" to="/admin/categories">Manage categories</Link>}
          <Link id="nav-change-password" className="nav-button" data-name="change-password" to="/change-password">Change password</Link>
          <Link id="nav-new-ticket" className="nav-button" data-name="new-ticket" to="/tickets/new">New ticket</Link>
          <button onClick={() => logout()}>Sign out</button>
        </div>
      </header>

      {isAdmin && user && <AdminSummaryBar currentUserId={user.id} onFilter={setFilters} />}

      <div className="ticket-filters">
        <select
          value={filters.createdByMe ? "created" : filters.assignedToMe ? "assigned" : ""}
          onChange={(event) => {
            updateFilter("createdByMe", event.target.value === "created" ? true : undefined);
            updateFilter("assignedToMe", event.target.value === "assigned" ? true : undefined);
          }}
        >
          <option value="">All my visible tickets</option>
          <option value="created">Created by me</option>
          <option value="assigned">Assigned to me</option>
        </select>
      </div>

      {isAdmin && (
        <div className="ticket-filters">
          <input
            placeholder="Search ticket number or subject"
            value={filters.search ?? ""}
            onChange={(event) => updateFilter("search", event.target.value || undefined)}
          />
          <select
            value={filters.assignedTeamId ?? ""}
            onChange={(event) => {
              updateFilter("assignedTeamId", event.target.value || undefined);
              updateFilter("assignedUserId", undefined);
            }}
          >
            <option value="">All teams</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          <select
            value={filters.assignedUserId ?? ""}
            onChange={(event) => updateFilter("assignedUserId", event.target.value || undefined)}
          >
            <option value="">All assigned admins</option>
            {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.displayName}</option>)}
          </select>
          <select
            value={filters.status ?? ""}
            onChange={(event) => updateFilter("status", (event.target.value || undefined) as TicketStatus | undefined)}
          >
            <option value="">All statuses</option>
            {(["NEW", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_USER", "WAITING_FOR_THIRD_PARTY", "RESOLVED", "CLOSED"] as TicketStatus[]).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={filters.priority ?? ""}
            onChange={(event) => updateFilter("priority", (event.target.value || undefined) as Priority | undefined)}
          >
            <option value="">All priorities</option>
            {(["LOW", "NORMAL", "HIGH", "CRITICAL"] as Priority[]).map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          <button className="link-button" onClick={() => setFilters({})}>Clear filters</button>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      {isAdmin ? (
        <>
          {Object.keys(filters).length > 0 && (
            <p className="hint">
              Filtered view —{" "}
              <button className="link-button" onClick={() => setFilters({})}>
                clear filter
              </button>
            </p>
          )}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <TicketTable tickets={tickets} emptyLabel="No tickets match this filter." />
          )}
        </>
      ) : (
        <RequesterTicketSections tickets={tickets} loading={loading} />
      )}
    </div>
  );
}

function RequesterTicketSections({ tickets, loading }: { tickets: TicketSummary[]; loading: boolean }) {
  if (loading) return <p>Loading...</p>;

  const open = tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED");
  const resolved = tickets.filter((t) => t.status === "RESOLVED");
  const closed = tickets.filter((t) => t.status === "CLOSED");

  return (
    <>
      <h2>Open tickets</h2>
      <TicketTable tickets={open} emptyLabel="No open tickets." />
      <h2>Resolved tickets</h2>
      <TicketTable tickets={resolved} emptyLabel="No resolved tickets." />
      <h2>Closed tickets</h2>
      <TicketTable tickets={closed} emptyLabel="No closed tickets." />
    </>
  );
}
