import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listNotificationsForUser, markNotificationRead } from "../services/notificationService";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  const notifications = await listNotificationsForUser(req.currentUser!);
  res.json({ notifications });
});

notificationsRouter.patch("/:id/read", async (req, res) => {
  const notification = await markNotificationRead(req.currentUser!, req.params.id);
  res.json({ notification });
});
