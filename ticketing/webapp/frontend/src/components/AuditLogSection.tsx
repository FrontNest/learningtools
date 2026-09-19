import { useEffect, useState } from "react";
import { fetchAuditLog } from "../lib/ticketApi";
import type { AuditLogEntry } from "../types/ticket";

export function AuditLogSection({ ticketId }: { ticketId: string }) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    fetchAuditLog(ticketId).then(setEntries).catch(() => undefined);
  }, [ticketId]);

  return (
    <section>
      <h2>Activity / Audit log</h2>
      <ul className="audit-list">
        {entries.length === 0 && <li className="hint">No activity yet.</li>}
        {entries.map((e) => (
          <li key={e.id}>
            <span className="hint">{new Date(e.createdAt).toLocaleString()}</span>{" "}
            <strong>{e.actor?.displayName ?? "SYSTEM"}</strong> — {e.action}
            {e.oldValue || e.newValue ? (
              <span>
                {" "}
                ({e.oldValue ?? "—"} → {e.newValue ?? "—"})
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
