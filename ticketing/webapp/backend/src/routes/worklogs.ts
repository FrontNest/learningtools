import { Router } from "express";
import { requireRole } from "../middleware/auth";
import { AppError } from "../errors/AppError";
import { createWorklogSchema } from "../validators/worklogValidators";
import { createWorklog, listWorklogs } from "../services/worklogService";

export const worklogsRouter = Router({ mergeParams: true });

worklogsRouter.use(requireRole("ADMIN"));

worklogsRouter.get("/", async (req, res) => {
  const ticketId = (req.params as { id: string }).id;
  const worklogs = await listWorklogs(ticketId);
  res.json({ worklogs });
});

worklogsRouter.post("/", async (req, res) => {
  const parsed = createWorklogSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid worklog data");
  }

  const ticketId = (req.params as { id: string }).id;
  const worklog = await createWorklog(req.currentUser!, ticketId, parsed.data);
  res.status(201).json({ worklog });
});
