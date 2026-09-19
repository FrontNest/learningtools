import { Router } from "express";
import bcrypt from "bcryptjs";
import { authenticate, hashPassword } from "../services/authService";
import { loginSchema, changePasswordSchema } from "../validators/authValidators";
import { loginRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/auth";
import { toPublicUser } from "../lib/serializers";
import { AppError } from "../errors/AppError";
import { prisma } from "../lib/prisma";

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest("Invalid email or password format");
  }

  const user = await authenticate(parsed.data.email, parsed.data.password, req.ip);

  // Regenerate session on privilege change (login) to prevent session fixation.
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.userId = user.id;
    res.json({ user: toPublicUser(user) });
  });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(204).send();
  });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: toPublicUser(req.currentUser!) });
});

authRouter.post("/change-password", requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const user = req.currentUser!;
  const currentValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!currentValid) {
    throw AppError.forbidden("Current password is incorrect");
  }

  const isSameAsCurrent = await bcrypt.compare(parsed.data.newPassword, user.passwordHash);
  if (isSameAsCurrent) {
    throw AppError.badRequest("New password must be different from the current password");
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  res.status(204).send();
});
