import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { AppError } from "../errors/AppError";
import { updateEmailSettingsSchema } from "../validators/emailSettingsValidators";
import { getEmailSettings, updateEmailSettings } from "../services/emailSettingsService";

export const adminEmailSettingsRouter = Router();

adminEmailSettingsRouter.use(requireAuth, requireRole("ADMIN"));

function assertMaster(currentUser: { isMaster: boolean }) {
  if (!currentUser.isMaster) {
    throw AppError.forbidden("Only the master administrator can manage email delivery settings");
  }
}

adminEmailSettingsRouter.get("/", async (req, res) => {
  assertMaster(req.currentUser!);
  res.json(await getEmailSettings());
});

adminEmailSettingsRouter.put("/", async (req, res) => {
  assertMaster(req.currentUser!);
  const parsed = updateEmailSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid email settings data");
  }
  res.json(await updateEmailSettings(req.currentUser!, parsed.data));
});
