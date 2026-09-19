import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const categoriesRouter = Router();

categoriesRouter.get("/", requireAuth, async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  res.json({ categories });
});
