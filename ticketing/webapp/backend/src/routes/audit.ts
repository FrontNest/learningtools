import { Router } from "express";
import { requireRole } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { listAuditLogsForTicket } from "../services/auditService";

export const auditRouter = Router({ mergeParams: true });

// Audit log is Admin-only (spec section 20/24).
auditRouter.use(requireRole("ADMIN"));

auditRouter.get("/", async (req, res) => {
  const ticketId = (req.params as { id: string }).id;
  const auditLogs = await listAuditLogsForTicket(prisma, ticketId);
  res.json({ auditLogs });
});
