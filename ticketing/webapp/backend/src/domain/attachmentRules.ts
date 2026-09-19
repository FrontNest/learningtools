import path from "path";
import { appConfig, env } from "../config";
import { AppError } from "../errors/AppError";

// Extension -> acceptable MIME types. Extension AND MIME must both be
// validated server-side (spec section 15 / 27) — never trust the browser.
const MIME_BY_EXTENSION: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".gif": ["image/gif"],
  ".txt": ["text/plain"],
};

export function assertValidAttachment(originalFileName: string, mimeType: string, fileSize: number) {
  const ext = path.extname(originalFileName).toLowerCase();

  if (!appConfig.allowedAttachmentExtensions.includes(ext)) {
    throw AppError.badRequest(`File type ${ext || "(none)"} is not allowed`);
  }

  const allowedMimes = MIME_BY_EXTENSION[ext] ?? [];
  if (!allowedMimes.includes(mimeType.toLowerCase())) {
    throw AppError.badRequest("File content does not match its extension");
  }

  const maxBytes = env.maxAttachmentSizeMb * 1024 * 1024;
  if (fileSize > maxBytes) {
    throw AppError.badRequest(`File exceeds the maximum allowed size of ${env.maxAttachmentSizeMb} MB`);
  }
}
