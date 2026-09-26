import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { attachmentDownloadUrl, deleteAttachment, fetchAttachments, uploadAttachment } from "../lib/ticketApi";
import type { Attachment } from "../types/ticket";
import { ALLOWED_ATTACHMENT_EXTENSIONS, MAX_ATTACHMENT_SIZE_MB } from "../constants/attachments";
import { useAuth } from "../auth/AuthContext";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : "";
}

export function AttachmentsSection({ ticketId }: { ticketId: string }) {
  const { user } = useAuth();
  const isMaster = Boolean(user?.isMaster);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    fetchAttachments(ticketId)
      .then(setAttachments)
      .catch(() => setError("Failed to load attachments."));
  }

  useEffect(load, [ticketId]);

  async function handleFileChange() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setError(null);

    const ext = extensionOf(file.name);
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext)) {
      setError(`File type ${ext || "(none)"} is not allowed.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds the maximum allowed size of ${MAX_ATTACHMENT_SIZE_MB} MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      await uploadAttachment(ticketId, file);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to upload attachment.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(attachment: Attachment) {
    if (!window.confirm(`Permanently delete "${attachment.originalFileName}"? This cannot be undone.`)) {
      return;
    }
    setError(null);
    setDeletingId(attachment.id);
    try {
      await deleteAttachment(ticketId, attachment.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to delete attachment.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <h2>Attachments</h2>
      <ul className="attachment-list">
        {attachments.length === 0 && <li className="hint">No attachments yet.</li>}
        {attachments.map((a) => (
          <li key={a.id}>
            <a href={attachmentDownloadUrl(ticketId, a.id)} target="_blank" rel="noreferrer">
              {a.originalFileName}
            </a>{" "}
            <span className="hint">
              ({formatSize(a.fileSize)}, uploaded by {a.uploadedBy.displayName})
            </span>{" "}
            {isMaster && (
              <button
                type="button"
                className="deleteButton"
                disabled={deletingId === a.id}
                onClick={() => handleDelete(a)}
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>

      <input ref={fileInputRef} type="file" onChange={handleFileChange} disabled={uploading} />
      <p className="hint">
        Allowed types: {ALLOWED_ATTACHMENT_EXTENSIONS.join(", ")} — max {MAX_ATTACHMENT_SIZE_MB} MB.
      </p>
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
