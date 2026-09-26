import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { writeAuditLog } from "./auditService";
import { encryptSecret } from "../lib/secretCrypto";

export interface EmailSettingsPublic {
  enabled: boolean;
  tenantId: string | null;
  clientId: string | null;
  senderMailbox: string | null;
  hasClientSecret: boolean;
  updatedByEmail: string | null;
  updatedAt: string | null;
}

async function getOrCreateSettings() {
  return prisma.emailSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

function toPublic(settings: Awaited<ReturnType<typeof getOrCreateSettings>>): EmailSettingsPublic {
  return {
    enabled: settings.enabled,
    tenantId: settings.tenantId,
    clientId: settings.clientId,
    senderMailbox: settings.senderMailbox,
    hasClientSecret: Boolean(settings.clientSecretEnc),
    updatedByEmail: settings.updatedByEmail,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function getEmailSettings(): Promise<EmailSettingsPublic> {
  return toPublic(await getOrCreateSettings());
}

interface UpdateEmailSettingsInput {
  enabled: boolean;
  confirm: boolean;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  senderMailbox?: string;
}

// Only the master may configure/enable outbound email — a regular Admin must
// never be able to point ticket notifications at an arbitrary mailbox.
export async function updateEmailSettings(
  actingMaster: User,
  input: UpdateEmailSettingsInput
): Promise<EmailSettingsPublic> {
  if (!actingMaster.isMaster) {
    throw AppError.forbidden("Only the master administrator can configure email delivery");
  }
  if (!input.confirm) {
    throw AppError.badRequest("Confirmation is required to change the email delivery setting");
  }

  const current = await getOrCreateSettings();
  const nextTenantId = input.tenantId?.trim() || current.tenantId;
  const nextClientId = input.clientId?.trim() || current.clientId;
  const nextSenderMailbox = input.senderMailbox?.trim() || current.senderMailbox;
  const nextHasSecret = Boolean(input.clientSecret?.trim()) || Boolean(current.clientSecretEnc);

  if (input.enabled && (!nextTenantId || !nextClientId || !nextSenderMailbox || !nextHasSecret)) {
    throw AppError.badRequest(
      "Tenant ID, Client ID, Client secret and sender mailbox are all required to enable email delivery"
    );
  }

  const updated = await prisma.emailSettings.update({
    where: { id: "singleton" },
    data: {
      enabled: input.enabled,
      tenantId: nextTenantId,
      clientId: nextClientId,
      senderMailbox: nextSenderMailbox,
      clientSecretEnc: input.clientSecret?.trim() ? encryptSecret(input.clientSecret.trim()) : undefined,
      updatedByEmail: actingMaster.email,
    },
  });

  await writeAuditLog(prisma, {
    actorId: actingMaster.id,
    action: input.enabled ? "EMAIL_DELIVERY_ENABLED" : "EMAIL_DELIVERY_DISABLED",
    details: `sender=${updated.senderMailbox ?? "n/a"}`,
  });

  return toPublic(updated);
}
