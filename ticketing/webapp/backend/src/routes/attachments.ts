import { Router } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError";
import { env } from "../config";
import { attachmentUploadRateLimiter } from "../middleware/rateLimiters";
import {
  createAttachment,
  deleteAttachmentAsMaster,
  getAttachmentForDownload,
  listAttachments,
} from "../services/attachmentService";

export const attachmentsRouter = Router({ mergeParams: true });

// Buffered in memory only long enough to validate + write to disk with a
// generated name — never persisted under the client-supplied filename.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxAttachmentSizeMb * 1024 * 1024 },
});

attachmentsRouter.get("/", async (req, res) => {
  const ticketId = (req.params as { id: string }).id;
  const attachments = await listAttachments(req.currentUser!, ticketId);
  res.json({ attachments });
});

attachmentsRouter.post("/", attachmentUploadRateLimiter, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    next();
  });
}, async (req, res) => {
  const ticketId = (req.params as { id: string }).id;
  if (!req.file) {
    throw AppError.badRequest("No file uploaded");
  }

  const attachment = await createAttachment(req.currentUser!, ticketId, req.file);
  res.status(201).json({ attachment });
});

attachmentsRouter.get("/:attachmentId", async (req, res) => {
  const params = req.params as unknown as { id: string; attachmentId: string };
  const { absolutePath, originalFileName, mimeType } = await getAttachmentForDownload(
    req.currentUser!,
    params.id,
    params.attachmentId
  );

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(originalFileName)}"`);
  res.sendFile(absolutePath);
});

attachmentsRouter.delete("/:attachmentId", async (req, res) => {
  const params = req.params as unknown as { id: string; attachmentId: string };
  await deleteAttachmentAsMaster(req.currentUser!, params.id, params.attachmentId);
  res.status(204).send();
});
