import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchAdminUsers, fetchPriorities, fetchStatusLabels, fetchTeams, fetchTickets, type TicketFilters } from "../lib/ticketApi";
import { fetchNotifications } from "../lib/notificationApi";
import type { AdminUser, PriorityOption, StatusLabelOption, Team, TicketStatus, TicketSummary } from "../types/ticket";
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
  const [priorities, setPriorities] = useState<PriorityOption[]>([]);
  const [statusLabels, setStatusLabels] = useState<StatusLabelOption[]>([]);

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
    fetchPriorities().then(setPriorities).catch(() => undefined);
    fetchStatusLabels().then(setStatusLabels).catch(() => undefined);
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
      <header className="ticket-list-header">
        <div>
          <h1>{isAdmin ? "All tickets" : "My tickets"}</h1>
          <p>Signed in as {user?.displayName} ({user?.role})</p>
        </div>
        <div className="header-actions">
          <BrowserNotificationButton />
          <Link id="nav-notifications" className="nav-button header-menu-button" data-name="notifications" to="/notifications">Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}</Link>
          {isAdmin && <Link id="nav-manage-users" className="nav-button header-menu-button" data-name="manage-users" to="/admin/users">Manage users</Link>}
          {isAdmin && <Link id="nav-manage-categories" className="nav-button header-menu-button" data-name="manage-categories" to="/admin/categories">Manage categories</Link>}
          {isAdmin && <Link id="nav-manage-devices" className="nav-button header-menu-button" data-name="manage-devices" to="/admin/devices">Device inventory</Link>}
          {user?.isMaster && <Link id="nav-workflow-settings" className="nav-button header-menu-button" data-name="workflow-settings" to="/admin/workflow-settings">Status &amp; priority</Link>}
          {user?.isMaster && <Link id="nav-email-settings" className="nav-button header-menu-button" data-name="email-settings" to="/admin/email-settings">Email settings</Link>}
          <Link id="nav-change-password" className="nav-button header-menu-button" data-name="change-password" to="/change-password">Change password</Link>
          <Link id="nav-new-ticket" className="nav-button header-menu-button" data-name="new-ticket" to="/tickets/new">New ticket</Link>
          <button className="signOutButton header-menu-button" onClick={() => logout()}>Sign out</button>
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
            {statusLabels.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filters.priority ?? ""}
            onChange={(event) => updateFilter("priority", event.target.value || undefined)}
          >
            <option value="">All priorities</option>
            {priorities.map((priority) => (
              <option key={priority.key} value={priority.key}>{priority.label}</option>
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
            <TicketTable tickets={tickets} emptyLabel="No tickets match this filter." priorities={priorities} statusLabels={statusLabels} />
          )}
        </>
      ) : (
        <RequesterTicketSections tickets={tickets} loading={loading} priorities={priorities} statusLabels={statusLabels} />
      )}
    </div>
  );
}

function RequesterTicketSections({
  tickets,
  loading,
  priorities,
  statusLabels,
}: {
  tickets: TicketSummary[];
  loading: boolean;
  priorities: PriorityOption[];
  statusLabels: StatusLabelOption[];
}) {
  if (loading) return <p>Loading...</p>;

  const open = tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED");
  const resolved = tickets.filter((t) => t.status === "RESOLVED");
  const closed = tickets.filter((t) => t.status === "CLOSED");

  return (
    <>
      <h2>Open tickets</h2>
      <TicketTable tickets={open} emptyLabel="No open tickets." priorities={priorities} statusLabels={statusLabels} />
      <h2>Resolved tickets</h2>
      <TicketTable tickets={resolved} emptyLabel="No resolved tickets." priorities={priorities} statusLabels={statusLabels} />
      <h2>Closed tickets</h2>
      <TicketTable tickets={closed} emptyLabel="No closed tickets." priorities={priorities} statusLabels={statusLabels} />
    </>
  );
}
