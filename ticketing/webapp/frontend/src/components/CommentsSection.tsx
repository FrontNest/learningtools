import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { createComment, fetchComments } from "../lib/ticketApi";
import type { Comment, CommentType } from "../types/ticket";

export function CommentsSection({ ticketId, isAdmin, canComment }: { ticketId: string; isAdmin: boolean; canComment: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [type, setType] = useState<CommentType>("PUBLIC");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetchComments(ticketId)
      .then(setComments)
      .catch(() => setError("Failed to load comments."));
  }

  useEffect(load, [ticketId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createComment(ticketId, { text, type });
      setText("");
      setType("PUBLIC");
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to add comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Comments</h2>
      <ul className="comment-list">
        {comments.length === 0 && <li className="hint">No comments yet.</li>}
        {comments.map((c) => (
          <li key={c.id} className={c.type === "INTERNAL" ? "comment-internal" : "comment-public"}>
            <div className="comment-header">
              <strong>{c.author.displayName}</strong>
              {c.type === "INTERNAL" && <span className="badge">Internal note</span>}
              <span className="hint">{new Date(c.createdAt).toLocaleString()}</span>
            </div>
            <p>{c.text}</p>
          </li>
        ))}
      </ul>

      {canComment ? <form className="ticket-form" onSubmit={handleSubmit}>
        <label htmlFor="comment-text">Add comment</label>
        <textarea
          id="comment-text"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {isAdmin && (
          <label>
            <input
              type="checkbox"
              checked={type === "INTERNAL"}
              onChange={(e) => setType(e.target.checked ? "INTERNAL" : "PUBLIC")}
            />{" "}
            Internal note (Admins only)
          </label>
        )}
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Posting..." : "Post comment"}
        </button>
      </form> : <p className="hint">Closed tickets cannot receive new comments.</p>}
    </section>
  );
}
