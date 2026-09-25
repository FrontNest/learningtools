import { useEffect, useRef, useState } from "react";
import { fetchNotifications } from "../lib/notificationApi";
import { useAuth } from "../auth/AuthContext";
import type { AppNotification } from "../types/ticket";

const APP_TITLE = "HUA-IT Ticketing";
const POLL_INTERVAL_MS = 30_000;

export function BrowserNotificationWatcher() {
  const { user } = useAuth();
  const knownNotificationIds = useRef(new Set<string>());
  const initialized = useRef(false);

  useEffect(() => {
    if (!user) {
      updateTabIndicator(0);
      knownNotificationIds.current.clear();
      initialized.current = false;
      return;
    }

    async function refreshNotifications() {
      try {
        const notifications = await fetchNotifications();
        const unread = notifications.filter((notification) => !notification.readAt);
        updateTabIndicator(unread.length);

        if (initialized.current && Notification.permission === "granted") {
          unread
            .filter((notification) => !knownNotificationIds.current.has(notification.id))
            .forEach(showBrowserNotification);
        }

        notifications.forEach((notification) => knownNotificationIds.current.add(notification.id));
        initialized.current = true;
      } catch {
        // A transient refresh failure must not disrupt the current page.
      }
    }

    void refreshNotifications();
    const intervalId = window.setInterval(() => void refreshNotifications(), POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [user]);

  return null;
}

export function BrowserNotificationButton() {
  const [permission, setPermission] = useState(() => "Notification" in window ? Notification.permission : "unsupported");

  if (permission !== "default") return null;

  async function requestPermission() {
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
  }

  return (
    <button
      id="nav-enable-browser-alerts"
      className="header-menu-button"
      data-name="enable-browser-alerts"
      onClick={() => void requestPermission()}
    >
      Enable browser alerts
    </button>
  );
}

function showBrowserNotification(notification: AppNotification) {
  const browserNotification = new Notification(notification.ticket?.ticketNumber ?? APP_TITLE, {
    body: notification.message,
    icon: "/favicon.svg",
  });
  browserNotification.onclick = () => {
    window.focus();
    if (notification.ticket) window.location.assign(`/tickets/${notification.ticket.id}`);
    browserNotification.close();
  };
}

function updateTabIndicator(unreadCount: number) {
  document.title = unreadCount > 0 ? `(${unreadCount}) ${APP_TITLE}` : APP_TITLE;

  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!favicon) return;
  favicon.href = unreadCount > 0 ? createUnreadFavicon(unreadCount) : "/favicon.svg";
}

function createUnreadFavicon(unreadCount: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  if (!context) return "/favicon.svg";

  context.fillStyle = "#c92a2a";
  context.beginPath();
  context.arc(16, 16, 15, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "bold 18px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(unreadCount > 9 ? "9+" : String(unreadCount), 16, 17);
  return canvas.toDataURL("image/png");
}