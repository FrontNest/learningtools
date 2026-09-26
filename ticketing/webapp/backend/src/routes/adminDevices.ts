import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../middleware/auth";
import { AppError } from "../errors/AppError";
import { getDeviceProvider } from "../services/deviceProviders";
import { importDeviceInventoryCsv } from "../services/deviceAdminService";
import { prisma } from "../lib/prisma";

export const adminDevicesRouter = Router();

adminDevicesRouter.use(requireAuth, requireRole("ADMIN"));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

// Browser-based counterpart to manually replacing the CSV file on the
// server's filesystem: uploads a fresh Intune/inventory export and re-syncs.
adminDevicesRouter.post("/import", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    throw AppError.badRequest("No file uploaded");
  }
  const result = await importDeviceInventoryCsv(req.currentUser!, req.file.buffer);
  res.json(result);
});

