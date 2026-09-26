import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listStatusLabels } from "../services/statusLabelService";

export const statusesRouter = Router();

statusesRouter.get("/", requireAuth, async (_req, res) => {
  const statuses = await listStatusLabels();
  res.json({ statuses });
});
