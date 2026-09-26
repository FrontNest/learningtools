import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { writeAuditLog } from "./auditService";
import { assertFileContentMatchesSignature, assertValidAttachment } from "../domain/attachmentRules";
import { env } from "../config";
import { canRequesterAccessTicket } from "./ticketService";
import { getTicketNotificationRecipients, notify } from "./notificationService";

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
  const ticket = await getAuthorizedTicket(currentUser, ticketId);
  assertValidAttachment(file.originalname, file.mimetype, file.size);
  assertFileContentMatchesSignature(file.buffer, file.originalname);

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

    // Requester uploads notify the assigned Admin/team; an Admin/team upload
    // notifies the requester (spec-parallel to comments/worklogs).
    if (currentUser.role === "REQUESTER") {
      const recipients = await getTicketNotificationRecipients(tx, ticket);
      await notify(tx, {
        ticketId,
        recipients,
        type: "ATTACHMENT_ADDED",
        message: `${currentUser.displayName} attached a file to ${ticket.ticketNumber}`,
      });
    } else {
      const requester = await tx.user.findUnique({ where: { id: ticket.requesterId } });
      if (requester && requester.active && requester.id !== currentUser.id) {
        await notify(tx, {
          ticketId,
          recipients: [requester],
          type: "ATTACHMENT_ADDED",
          message: `${currentUser.displayName} attached a file to ${ticket.ticketNumber}`,
        });
      }
    }

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

// Master-only: remove a single attachment without touching the rest of the
// ticket (comments/worklogs/status/etc. are untouched).
export async function deleteAttachmentAsMaster(master: User, ticketId: string, attachmentId: string) {
  if (!master.isMaster) {
    throw AppError.forbidden("Only the master administrator can delete attachments");
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw AppError.notFound("Ticket not found");
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { uploadedBy: true },
  });
  if (!attachment || attachment.ticketId !== ticketId) {
    throw AppError.notFound("Attachment not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.attachment.delete({ where: { id: attachmentId } });

    await writeAuditLog(tx, {
      ticketId,
      actorId: master.id,
      action: "ATTACHMENT_DELETED",
      oldValue: attachment.originalFileName,
    });

    const recipients: User[] = [];
    const addRecipient = (user: User | null | undefined) => {
      if (user && user.active && user.id !== master.id && !recipients.some((existing) => existing.id === user.id)) {
        recipients.push(user);
      }
    };

    addRecipient(attachment.uploadedBy);
    const requester = await tx.user.findUnique({ where: { id: ticket.requesterId } });
    addRecipient(requester);
    const assignedRecipients = await getTicketNotificationRecipients(tx, ticket);
    assignedRecipients.forEach(addRecipient);

    await notify(tx, {
      ticketId,
      recipients,
      type: "ATTACHMENT_DELETED",
      message: `${master.displayName} removed the attachment "${attachment.originalFileName}" from ${ticket.ticketNumber}`,
    });
  });

  const absolutePath = path.join(env.uploadDir, attachment.storageKey);
  const relativePath = path.relative(path.resolve(env.uploadDir), absolutePath);
  if (relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
    await fs.promises.unlink(absolutePath).catch(() => undefined);
  }
}
