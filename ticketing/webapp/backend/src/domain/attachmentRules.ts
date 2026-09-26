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

// File signatures ("magic numbers") for the extensions we accept — the
// client-supplied MIME type above is attacker-controlled (it comes from the
// browser's Content-Type header), so it must never be the only content
// check. Extensions without a reliable fixed signature (.txt) are skipped.
const SIGNATURES_BY_EXTENSION: Record<string, number[][]> = {
  ".png": [[0x89, 0x50, 0x4e, 0x47]],
  ".jpg": [[0xff, 0xd8, 0xff]],
  ".jpeg": [[0xff, 0xd8, 0xff]],
  ".gif": [[0x47, 0x49, 0x46, 0x38]],
  ".pdf": [[0x25, 0x50, 0x44, 0x46, 0x2d]],
  // Legacy OLE-compound formats (.doc/.xls).
  ".doc": [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  ".xls": [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  // Modern Office formats are ZIP containers.
  ".docx": [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]],
  ".xlsx": [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]],
};

function matchesSignature(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

export function assertFileContentMatchesSignature(buffer: Buffer, originalFileName: string) {
  const ext = path.extname(originalFileName).toLowerCase();
  const signatures = SIGNATURES_BY_EXTENSION[ext];
  if (!signatures) return; // no reliable fixed signature for this extension (e.g. .txt)

  const matches = signatures.some((signature) => matchesSignature(buffer, signature));
  if (!matches) {
    throw AppError.badRequest("File content does not match its extension");
  }
}
