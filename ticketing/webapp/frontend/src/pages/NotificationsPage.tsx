import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { fetchNotifications, markNotificationRead, setAllNotificationsReadState } from "../lib/notificationApi";
import type { AppNotification } from "../types/ticket";

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState("all");
  const [ticketNumberFilter, setTicketNumberFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ unread: true, read: false });
  const [updatingReadState, setUpdatingReadState] = useState(false);

  useEffect(() => {
    fetchNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  async function handleOpen(notification: AppNotification) {
    if (!notification.readAt) {
      const updated = await markNotificationRead(notification.id);
      setNotifications((current) => current.map((entry) => entry.id === updated.id ? { ...entry, readAt: updated.readAt } : entry));
    }
    if (notification.ticket) {
      navigate(`/tickets/${notification.ticket.id}`);
    }
  }

  async function handleSetAllReadState(read: boolean) {
    setUpdatingReadState(true);
    try {
      await setAllNotificationsReadState(read);
      const readAt = read ? new Date().toISOString() : null;
      setNotifications((current) => current.map((notification) => ({ ...notification, readAt })));
    } finally {
      setUpdatingReadState(false);
    }
  }

  const filteredNotifications = useMemo(() => {
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    const ticketNumber = ticketNumberFilter.trim().toLowerCase();

    return notifications
      .filter((notification) => {
        const createdAt = new Date(notification.createdAt);
        if (readFilter === "unread" && notification.readAt) return false;
        if (readFilter === "read" && !notification.readAt) return false;
        if (fromDate && createdAt < fromDate) return false;
        if (toDate && createdAt > toDate) return false;
        return !ticketNumber || notification.ticket?.ticketNumber.toLowerCase().includes(ticketNumber);
      })
      .sort((first, second) => {
        if (sortOrder === "oldest") return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
        if (sortOrder === "ticket-ascending") return (first.ticket?.ticketNumber ?? "").localeCompare(second.ticket?.ticketNumber ?? "");
        if (sortOrder === "ticket-descending") return (second.ticket?.ticketNumber ?? "").localeCompare(first.ticket?.ticketNumber ?? "");
        if (sortOrder === "unread-first") return Number(Boolean(first.readAt)) - Number(Boolean(second.readAt));
        if (sortOrder === "read-first") return Number(!first.readAt) - Number(!second.readAt);
        return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      });
  }, [dateFrom, dateTo, notifications, readFilter, sortOrder, ticketNumberFilter]);

  function clearFilters() {
    setReadFilter("all");
    setTicketNumberFilter("");
    setDateFrom("");
    setDateTo("");
    setSortOrder("newest");
  }

  const hasFilters = readFilter !== "all" || ticketNumberFilter !== "" || dateFrom !== "" || dateTo !== "" || sortOrder !== "newest";
  const notificationGroups = [
    {
      id: "unread",
      label: "Unread notifications",
      notifications: filteredNotifications.filter((notification) => !notification.readAt),
      defaultOpen: true,
    },
    {
      id: "read",
      label: "Read notifications",
      notifications: filteredNotifications.filter((notification) => notification.readAt),
      defaultOpen: false,
    },
  ].filter((group) => group.notifications.length > 0);

  return (
    <div className="dashboard-page">
      <header>      
        <h1>Notifications</h1>
        <Link id="nav-back-to-tickets-notifications" className="nav-button" data-name="back-to-tickets" to="/">Back to tickets</Link>
      </header>
      {loading && <p>Loading...</p>}
      {!loading && notifications.length === 0 && <p>No notifications yet.</p>}
      {!loading && notifications.length > 0 && (
        <>
          <div className="notification-bulk-actions">
            <button disabled={updatingReadState} onClick={() => void handleSetAllReadState(true)}>Mark all read</button>
            <button disabled={updatingReadState} onClick={() => void handleSetAllReadState(false)}>Mark all unread</button>
          </div>
          <div className="ticket-filters notification-filters">
            <select value={readFilter} onChange={(event) => setReadFilter(event.target.value)}>
              <option value="all">All notifications</option>
              <option value="unread">Unread only</option>
              <option value="read">Read only</option>
            </select>
            <input
              type="search"
              placeholder="Ticket number"
              value={ticketNumberFilter}
              onChange={(event) => setTicketNumberFilter(event.target.value)}
            />
            <input type="date" aria-label="Created from" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <input type="date" aria-label="Created to" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="ticket-ascending">Ticket number A-Z</option>
              <option value="ticket-descending">Ticket number Z-A</option>
              <option value="unread-first">Unread first</option>
              <option value="read-first">Read first</option>
            </select>
            {hasFilters && <button className="link-button" onClick={clearFilters}>Clear filters</button>}
          </div>
        </>
      )}
      {!loading && notifications.length > 0 && filteredNotifications.length === 0 && <p className="hint">No notifications match these filters.</p>}
      {notificationGroups.map((group) => (
        <details
          key={group.id}
          className="notification-group"
          open={expandedGroups[group.id] ?? group.defaultOpen}
          onToggle={(event) => {
            const isOpen = event.currentTarget.open;
            setExpandedGroups((current) => ({ ...current, [group.id]: isOpen }));
          }}
        >
          <summary>
            <span>{group.label}</span>
            <span className="notification-group-count">{group.notifications.length}</span>
          </summary>
          <ul className="notification-list">
            {group.notifications.map((n) => (
              <li
                key={n.id}
                className={n.readAt ? "notification-read" : "notification-unread"}
                onClick={() => handleOpen(n)}
              >
                <div>
                  <strong>{n.ticket?.ticketNumber}</strong> — {n.message}
                </div>
                <span className="hint">{new Date(n.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
