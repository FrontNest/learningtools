import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchTickets, type TicketFilters } from "../lib/ticketApi";
import { fetchNotifications } from "../lib/notificationApi";
import type { TicketSummary } from "../types/ticket";
import { TicketTable } from "../components/TicketTable";
import { AdminSummaryBar } from "../components/AdminSummaryBar";

export function TicketListPage() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <div className="dashboard-page">
      <header>
        <div>
          <h1>{isAdmin ? "All tickets" : "My tickets"}</h1>
          <p>Signed in as {user?.displayName} ({user?.role})</p>
        </div>
        <div className="header-actions">
          <Link to="/notifications">Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}</Link>
          {isAdmin && <Link to="/admin/users">Manage users</Link>}
          <Link to="/change-password">Change password</Link>
          <Link to="/tickets/new" className="button-link">New ticket</Link>
          <button onClick={() => logout()}>Sign out</button>
        </div>
      </header>

      {isAdmin && user && <AdminSummaryBar currentUserId={user.id} onFilter={setFilters} />}

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
