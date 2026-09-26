import { z } from "zod";
import { TEAM_TYPES } from "../domain/enums";

export const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(TEAM_TYPES),
});

export const updateTeamSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    type: z.enum(TEAM_TYPES).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.type !== undefined || data.active !== undefined, {
    message: "No updatable fields provided",
  });
