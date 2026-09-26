import { z } from "zod";

// Both values are inserted directly into Microsoft login/Graph URL paths, so
// only characters that are safe there are allowed — this blocks path
// traversal / URL-breaking input even though only the master can set it.
const tenantIdPattern = /^[a-zA-Z0-9.-]+$/;
const clientIdPattern = /^[a-zA-Z0-9-]+$/;

export const updateEmailSettingsSchema = z.object({
  enabled: z.boolean(),
  confirm: z.boolean(),
  tenantId: z.string().trim().min(1).max(200).regex(tenantIdPattern, "Tenant ID contains invalid characters").optional(),
  clientId: z.string().trim().min(1).max(200).regex(clientIdPattern, "Client ID contains invalid characters").optional(),
  clientSecret: z.string().trim().max(500).optional(),
  senderMailbox: z.string().trim().email().max(320).optional(),
});
