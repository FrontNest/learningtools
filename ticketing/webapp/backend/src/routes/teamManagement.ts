import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { AppError } from "../errors/AppError";
import { createTeamSchema, updateTeamSchema } from "../validators/teamAdminValidators";
import { createTeam, listAllTeams, updateTeam } from "../services/teamAdminService";

export const teamManagementRouter = Router();

teamManagementRouter.use(requireAuth, requireRole("ADMIN"));

teamManagementRouter.get("/", async (_req, res) => {
  res.json({ teams: await listAllTeams() });
});

teamManagementRouter.post("/", async (req, res) => {
  const parsed = createTeamSchema.safeParse(req.body);
  if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid team data");
  res.status(201).json({ team: await createTeam(req.currentUser!, parsed.data) });
});

teamManagementRouter.patch("/:id", async (req, res) => {
  const parsed = updateTeamSchema.safeParse(req.body);
  if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid team data");
  res.json({ team: await updateTeam(req.currentUser!, req.params.id, parsed.data) });
});
