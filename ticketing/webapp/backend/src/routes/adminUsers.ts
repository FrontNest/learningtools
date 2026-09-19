import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { AppError } from "../errors/AppError";

export const adminUsersRouter = Router();

const listAdminsQuerySchema = z.object({
  teamId: z.string().uuid().optional(),
});

// Active Admins only, optionally filtered by team — used to populate assignment pickers.
adminUsersRouter.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const parsed = listAdminsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw AppError.badRequest("Invalid filter parameters");
  }

  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      active: true,
      ...(parsed.data.teamId ? { teamId: parsed.data.teamId } : {}),
    },
    select: { id: true, displayName: true, email: true, teamId: true },
    orderBy: { displayName: "asc" },
  });

  res.json({ users: admins });
});
