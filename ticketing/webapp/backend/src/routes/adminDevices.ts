import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { getDeviceProvider } from "../services/deviceProviders";
import { prisma } from "../lib/prisma";

export const adminDevicesRouter = Router();

adminDevicesRouter.use(requireAuth, requireRole("ADMIN"));

adminDevicesRouter.get("/", async (_req, res) => {
  const devices = await prisma.device.findMany({ orderBy: { deviceName: "asc" } });
  res.json({ devices });
});

// Manually triggers a re-read of the configured device source (CSV inventory
// today, Microsoft Graph/Intune later). Failures here must never block ticket
// creation — Requesters can always fall back to "Other device".
adminDevicesRouter.post("/sync", async (_req, res) => {
  const provider = getDeviceProvider();
  const result = await provider.sync();
  res.json(result);
});
