import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { writeAuditLog } from "./auditService";
import { assertValidAttachment } from "../domain/attachmentRules";
import { env } from "../config";
import { canRequesterAccessTicket } from "./ticketService";

async function getAuthorizedTicket(currentUser: User, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw AppError.notFound("Ticket not found");
  }
  if (!canRequesterAccessTicket(currentUser, ticket)) {
    throw AppError.forbidden();
  }
  return ticket;
}

export async function listAttachments(currentUser: User, ticketId: string) {
  await getAuthorizedTicket(currentUser, ticketId);
  return prisma.attachment.findMany({
    where: { ticketId },
    select: {
      id: true,
      ticketId: true,
      originalFileName: true,
      mimeType: true,
      fileSize: true,
      createdAt: true,
      uploadedBy: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export async function createAttachment(currentUser: User, ticketId: string, file: UploadedFile) {
  await getAuthorizedTicket(currentUser, ticketId);
  assertValidAttachment(file.originalname, file.mimetype, file.size);

  const ext = path.extname(file.originalname).toLowerCase();
  // Never use the original filename as the storage key (spec section 15/16).
  const storageKey = path.posix.join("tickets", ticketId, `${crypto.randomUUID()}${ext}`);
  const absolutePath = path.join(env.uploadDir, storageKey);

  await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.promises.writeFile(absolutePath, file.buffer);

  return prisma.$transaction(async (tx) => {
    const attachment = await tx.attachment.create({
      data: {
        ticketId,
        uploadedById: currentUser.id,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey,
      },
      select: {
        id: true,
        ticketId: true,
        originalFileName: true,
        mimeType: true,
        fileSize: true,
        createdAt: true,
        uploadedBy: { select: { id: true, displayName: true } },
      },
    });

    await writeAuditLog(tx, {
      ticketId,
      actorId: currentUser.id,
      action: "ATTACHMENT_UPLOADED",
      newValue: file.originalname,
    });

    return attachment;
  });
}

export async function getAttachmentForDownload(currentUser: User, ticketId: string, attachmentId: string) {
  await getAuthorizedTicket(currentUser, ticketId);

  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment || attachment.ticketId !== ticketId) {
    throw AppError.notFound("Attachment not found");
  }

  const absolutePath = path.join(env.uploadDir, attachment.storageKey);
  if (!absolutePath.startsWith(path.resolve(env.uploadDir))) {
    // Defense in depth against path traversal via a corrupted storageKey.
    throw AppError.badRequest("Invalid attachment reference");
  }
  if (!fs.existsSync(absolutePath)) {
    throw AppError.notFound("Attachment file is missing");
  }

  return { absolutePath, originalFileName: attachment.originalFileName, mimeType: attachment.mimeType };
}
