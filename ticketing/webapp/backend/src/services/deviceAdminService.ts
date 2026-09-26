import fs from "fs";
import path from "path";
import type { User } from "@prisma/client";
import { env } from "../config";
import { getDeviceProvider } from "./deviceProviders";
import { writeAuditLog } from "./auditService";
import { prisma } from "../lib/prisma";

// Writes a freshly uploaded CSV export over the configured inventory path and
// re-runs the sync — this is the browser-upload counterpart to manually
// dropping a file at env.deviceInventoryCsvPath on the server's filesystem.
export async function importDeviceInventoryCsv(actingAdmin: User, csvContent: Buffer): Promise<{ imported: number }> {
  await fs.promises.mkdir(path.dirname(env.deviceInventoryCsvPath), { recursive: true });
  await fs.promises.writeFile(env.deviceInventoryCsvPath, csvContent);

  const result = await getDeviceProvider().sync();

  await writeAuditLog(prisma, {
    actorId: actingAdmin.id,
    action: "DEVICE_INVENTORY_IMPORTED",
    newValue: `${result.imported} device(s)`,
  });

  return result;
}
