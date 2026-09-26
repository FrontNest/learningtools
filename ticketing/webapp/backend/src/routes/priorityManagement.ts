import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { AppError } from "../errors/AppError";
import { createPrioritySchema, updatePrioritySchema } from "../validators/priorityAdminValidators";
import { createPriority, deletePriority, listAllPriorities, updatePriority } from "../services/priorityAdminService";

export const priorityManagementRouter = Router();

priorityManagementRouter.use(requireAuth, requireRole("ADMIN"));

priorityManagementRouter.get("/", async (_req, res) => {
  res.json({ priorities: await listAllPriorities() });
});

priorityManagementRouter.post("/", async (req, res) => {
  const parsed = createPrioritySchema.safeParse(req.body);
  if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid priority data");
  res.status(201).json({ priority: await createPriority(req.currentUser!, parsed.data) });
});

priorityManagementRouter.patch("/:id", async (req, res) => {
  const parsed = updatePrioritySchema.safeParse(req.body);
  if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid priority data");
  res.json({ priority: await updatePriority(req.currentUser!, req.params.id, parsed.data) });
});

priorityManagementRouter.delete("/:id", async (req, res) => {
  await deletePriority(req.currentUser!, req.params.id);
  res.status(204).send();
});
