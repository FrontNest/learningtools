import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { AppError } from "../errors/AppError";
import { updateStatusLabelSchema } from "../validators/statusLabelValidators";
import { listStatusLabels, updateStatusLabel } from "../services/statusLabelService";

export const statusManagementRouter = Router();

statusManagementRouter.use(requireAuth, requireRole("ADMIN"));

statusManagementRouter.get("/", async (_req, res) => {
  res.json({ statuses: await listStatusLabels() });
});

statusManagementRouter.patch("/:key", async (req, res) => {
  const parsed = updateStatusLabelSchema.safeParse(req.body);
  if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid status label data");
  res.json({ status: await updateStatusLabel(req.currentUser!, req.params.key, parsed.data) });
});
