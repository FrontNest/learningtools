import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const meDevicesRouter = Router();

// Requester's own devices, matched by email against the synced inventory
// (spec section 8.5 / 9). Falls back gracefully to an empty list — the UI
// always allows "Other device" if lookup finds nothing.
meDevicesRouter.get("/", requireAuth, async (req, res) => {
  const email = req.currentUser!.email.toLowerCase();
  const devices = await prisma.device.findMany({
    where: { primaryUserEmail: email },
    orderBy: { deviceName: "asc" },
  });
  res.json({ devices });
});
