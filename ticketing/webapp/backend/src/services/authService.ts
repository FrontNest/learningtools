import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { logger } from "../lib/logger";

const MAX_FAILED_ATTEMPTS_WINDOW_MIN = 15;
const MAX_FAILED_ATTEMPTS = 5;

export async function authenticate(email: string, password: string, ipAddress?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  const recentFailures = await prisma.loginAttempt.count({
    where: {
      email: normalizedEmail,
      success: false,
      createdAt: { gte: new Date(Date.now() - MAX_FAILED_ATTEMPTS_WINDOW_MIN * 60 * 1000) },
    },
  });

  if (recentFailures >= MAX_FAILED_ATTEMPTS) {
    throw AppError.forbidden("Account temporarily locked due to repeated failed login attempts. Try again later.");
  }

  const passwordValid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  await prisma.loginAttempt.create({
    data: {
      email: normalizedEmail,
      userId: user?.id,
      success: passwordValid,
      ipAddress,
    },
  });

  if (!user || !user.active || !passwordValid) {
    logger.warn("Failed login attempt", { email: normalizedEmail });
    throw AppError.unauthorized("Invalid email or password");
  }

  return user;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
