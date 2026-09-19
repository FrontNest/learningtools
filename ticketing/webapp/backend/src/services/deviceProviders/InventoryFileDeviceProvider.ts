import fs from "fs";
import { parse } from "csv-parse/sync";
import { prisma } from "../../lib/prisma";
import { env } from "../../config";
import type { DeviceProvider } from "./DeviceProvider";

// Maps the (trimmed, lowercased) CSV header names to Device model fields.
// Source columns (semicolon-delimited), as provided by the existing
// company-maintained device inventory export:
// inventory name; Entra device ID; Intune managed device ID; Model;
// Operating system; OS version; Compliance state; Primary user;
// serial number; manufacturer; Last check-in / last sync
const HEADER_MAP: Record<string, string> = {
  "inventory name": "deviceName",
  "entra device id": "entraDeviceId",
  "intune managed device id": "intuneDeviceId",
  model: "model",
  "operating system": "operatingSystem",
  "os version": "osVersion",
  "compliance state": "complianceState",
  "primary user": "primaryUserEmail",
  "serial number": "serialNumber",
  manufacturer: "manufacturer",
  "last check-in / last sync": "lastCheckIn",
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

// Reads the company's existing (currently Excel-exported-to-CSV) device
// inventory and upserts it into the local Device table. This is a stand-in
// for direct Microsoft Graph / Intune access, which isn't available in the
// standalone deployment — swap in a GraphIntuneDeviceProvider later without
// changing the Device model or ticket creation flow.
export class InventoryFileDeviceProvider implements DeviceProvider {
  async sync(): Promise<{ imported: number }> {
    if (!fs.existsSync(env.deviceInventoryCsvPath)) {
      return { imported: 0 };
    }

    const content = fs.readFileSync(env.deviceInventoryCsvPath, "utf-8");
    const records: Record<string, string>[] = parse(content, {
      columns: (header: string[]) => header.map(normalizeHeader),
      delimiter: ";",
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    let imported = 0;
    for (const row of records) {
      const data: Record<string, string | null> = {};
      for (const [csvHeader, field] of Object.entries(HEADER_MAP)) {
        const value = row[csvHeader]?.trim();
        data[field] = value ? value : null;
      }
      // Normalize for case-insensitive matching against User.email (SQLite has no
      // case-insensitive query mode, so we store/query it consistently lowercased).
      if (data.primaryUserEmail) {
        data.primaryUserEmail = data.primaryUserEmail.toLowerCase();
      }

      if (!data.deviceName) continue;

      const lastCheckIn = data.lastCheckIn ? new Date(data.lastCheckIn) : null;

      const matchClauses: { serialNumber?: string; entraDeviceId?: string; deviceName?: string }[] = [];
      if (data.serialNumber) matchClauses.push({ serialNumber: data.serialNumber });
      if (data.entraDeviceId) matchClauses.push({ entraDeviceId: data.entraDeviceId });
      if (matchClauses.length === 0) matchClauses.push({ deviceName: data.deviceName });

      const existing = await prisma.device.findFirst({
        where: { source: "INVENTORY", OR: matchClauses },
      });

      const payload = {
        source: "INVENTORY",
        deviceName: data.deviceName,
        primaryUserEmail: data.primaryUserEmail,
        entraDeviceId: data.entraDeviceId,
        intuneDeviceId: data.intuneDeviceId,
        serialNumber: data.serialNumber,
        manufacturer: data.manufacturer,
        model: data.model,
        operatingSystem: data.operatingSystem,
        osVersion: data.osVersion,
        complianceState: data.complianceState,
        lastCheckIn: lastCheckIn && !isNaN(lastCheckIn.getTime()) ? lastCheckIn : null,
      };

      if (existing) {
        await prisma.device.update({ where: { id: existing.id }, data: payload });
      } else {
        await prisma.device.create({ data: payload });
      }
      imported += 1;
    }

    return { imported };
  }
}
