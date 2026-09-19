import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { runAutoCloseSweep } from "../services/autoCloseService";

export const adminAutoCloseRouter = Router();

adminAutoCloseRouter.use(requireAuth, requireRole("ADMIN"));

// Manual trigger for testing/ops — the real schedule is the node-cron job
// started in server.ts (every 15 minutes).
adminAutoCloseRouter.post("/run", async (_req, res) => {
  const result = await runAutoCloseSweep();
  res.json(result);
});
