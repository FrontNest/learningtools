import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import type { User } from "@prisma/client";
import type { RoleValue } from "../domain/enums";

// Augment Express Request with the resolved authenticated user (server-side only,
// never trust role/team info coming from the client).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId) {
    throw AppError.unauthorized();
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) {
    req.session.destroy(() => undefined);
    throw AppError.unauthorized("Session is no longer valid");
  }

  req.currentUser = user;
  next();
}

export function requireRole(...roles: RoleValue[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      throw AppError.unauthorized();
    }
    if (!roles.includes(req.currentUser.role as RoleValue)) {
      throw AppError.forbidden();
    }
    next();
  };
}
