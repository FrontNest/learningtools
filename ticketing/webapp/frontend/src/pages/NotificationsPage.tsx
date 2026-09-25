import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { fetchNotifications, markNotificationRead } from "../lib/notificationApi";
import type { AppNotification } from "../types/ticket";

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  async function handleOpen(notification: AppNotification) {
    if (!notification.readAt) {
      await markNotificationRead(notification.id);
    }
    if (notification.ticket) {
      navigate(`/tickets/${notification.ticket.id}`);
    }
  }

  return (
    <div className="dashboard-page">
      <header>      
        <h1>Notifications</h1>
        <Link id="nav-back-to-tickets-notifications" className="nav-button" data-name="back-to-tickets" to="/">Back to tickets</Link>
      </header>
      {loading && <p>Loading...</p>}
      {!loading && notifications.length === 0 && <p>No notifications yet.</p>}
      <ul className="notification-list">
        {notifications.map((n) => (
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
    </div>
  );
}
