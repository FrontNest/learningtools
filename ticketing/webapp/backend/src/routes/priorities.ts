import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listActivePriorities } from "../services/priorityAdminService";

export const prioritiesRouter = Router();

prioritiesRouter.get("/", requireAuth, async (_req, res) => {
  const priorities = await listActivePriorities();
  res.json({ priorities });
});
