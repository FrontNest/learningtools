// Mirrors backend/config/app.config.json allowedAttachmentExtensions and
// MAX_ATTACHMENT_SIZE_MB — client-side check only; the backend re-validates
// everything and is the actual source of truth.
export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".txt",
];

export const MAX_ATTACHMENT_SIZE_MB = 10;
