import { z } from "zod";

export const createPrioritySchema = z.object({
  label: z.string().trim().min(1).max(50),
});

export const updatePrioritySchema = z
  .object({
    label: z.string().trim().min(1).max(50).optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((data) => data.label !== undefined || data.active !== undefined || data.sortOrder !== undefined, {
    message: "No updatable fields provided",
  });
