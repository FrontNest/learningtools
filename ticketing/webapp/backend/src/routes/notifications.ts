import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../errors/AppError";
import { listNotificationsForUser, markNotificationRead, setAllNotificationsReadState } from "../services/notificationService";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  const notifications = await listNotificationsForUser(req.currentUser!);
  res.json({ notifications });
});

notificationsRouter.patch("/read-state", async (req, res) => {
  if (typeof req.body?.read !== "boolean") {
    throw AppError.badRequest("The read state must be a boolean");
  }
  const result = await setAllNotificationsReadState(req.currentUser!, req.body.read);
  res.json(result);
});

notificationsRouter.patch("/:id/read", async (req, res) => {
  const notification = await markNotificationRead(req.currentUser!, req.params.id);
  res.json({ notification });
});
