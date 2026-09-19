import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { createWorklog, fetchWorklogs } from "../lib/ticketApi";
import type { Worklog } from "../types/ticket";

const MAX_LINES = 20;
const MAX_CHARS = 10000;

export function WorklogSection({ ticketId }: { ticketId: string }) {
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [duration, setDuration] = useState(15);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetchWorklogs(ticketId)
      .then(setWorklogs)
      .catch(() => setError("Failed to load worklogs."));
  }

  useEffect(load, [ticketId]);

  const lineCount = description.split(/\r\n|\r|\n/).length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (lineCount > MAX_LINES) {
      setError(`Description must not exceed ${MAX_LINES} lines.`);
      return;
    }
    if (description.length > MAX_CHARS) {
      setError(`Description must not exceed ${MAX_CHARS} characters.`);
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    setSubmitting(true);
    try {
      await createWorklog(ticketId, { durationMinutes: duration, description });
      setDescription("");
      setDuration(15);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to add worklog.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Worklog</h2>
      <ul className="comment-list">
        {worklogs.length === 0 && <li className="hint">No worklog entries yet.</li>}
        {worklogs.map((w) => (
          <li key={w.id} className="comment-public">
            <div className="comment-header">
              <strong>{w.admin.displayName}</strong>
              <span>{w.durationMinutes} min</span>
              <span className="hint">{new Date(w.createdAt).toLocaleString()}</span>
            </div>
            <p style={{ whiteSpace: "pre-wrap" }}>{w.description}</p>
          </li>
        ))}
      </ul>

      <form className="ticket-form" onSubmit={handleSubmit}>
        <label htmlFor="worklog-duration">Duration (minutes)</label>
        <input
          id="worklog-duration"
          type="number"
          min={0}
          max={1440}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />

        <label htmlFor="worklog-description">Description (max {MAX_LINES} lines)</label>
        <textarea
          id="worklog-description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <span className="hint">
          {lineCount}/{MAX_LINES} lines, {description.length}/{MAX_CHARS} characters
        </span>

        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Add worklog"}
        </button>
      </form>
    </section>
  );
}
