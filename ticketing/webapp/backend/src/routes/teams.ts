import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const teamsRouter = Router();

teamsRouter.get("/", requireAuth, async (_req, res) => {
  const teams = await prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  res.json({ teams });
});
