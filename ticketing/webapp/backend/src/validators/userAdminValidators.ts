import { z } from "zod";
import { ROLES } from "../domain/enums";

export const createUserSchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().min(1).max(200),
  department: z.string().trim().max(200).optional(),
  jobTitle: z.string().trim().max(200).optional(),
  role: z.enum(ROLES),
  teamId: z.string().uuid().nullable().optional(),
});

export const updateUserSchema = z
  .object({
    email: z.string().trim().email().optional(),
    role: z.enum(ROLES).optional(),
    teamId: z.string().uuid().nullable().optional(),
    active: z.boolean().optional(),
    displayName: z.string().trim().min(1).max(200).optional(),
    department: z.string().trim().max(200).nullable().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "No updatable fields provided",
  });
