import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { AppError } from "../errors/AppError";
import { createCategorySchema, updateCategorySchema } from "../validators/categoryAdminValidators";
import { createCategory, listAllCategories, updateCategory } from "../services/categoryAdminService";

export const categoryManagementRouter = Router();

categoryManagementRouter.use(requireAuth, requireRole("ADMIN"));

categoryManagementRouter.get("/", async (_req, res) => {
  res.json({ categories: await listAllCategories() });
});

categoryManagementRouter.post("/", async (req, res) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid category data");
  res.status(201).json({ category: await createCategory(parsed.data) });
});

categoryManagementRouter.patch("/:id", async (req, res) => {
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid category data");
  res.json({ category: await updateCategory(req.params.id, parsed.data) });
});
