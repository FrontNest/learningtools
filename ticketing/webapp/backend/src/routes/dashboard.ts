import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { getDashboardSummary } from "../services/dashboardService";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const summary = await getDashboardSummary(req.currentUser!);
  res.json(summary);
});
