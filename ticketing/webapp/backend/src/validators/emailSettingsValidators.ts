import { z } from "zod";

export const updateEmailSettingsSchema = z.object({
  enabled: z.boolean(),
  confirm: z.boolean(),
  tenantId: z.string().trim().max(200).optional(),
  clientId: z.string().trim().max(200).optional(),
  clientSecret: z.string().trim().max(500).optional(),
  senderMailbox: z.string().trim().email().max(320).optional(),
});
