import { z } from "zod";

export const createCategorySchema = z.object({
  code: z.string().trim().min(1).max(100).regex(/^[A-Z0-9_.-]+$/, "Code must use uppercase letters, numbers, dots, hyphens or underscores"),
  name: z.string().trim().min(1).max(200),
  parentId: z.string().uuid().nullable().optional(),
});

export const updateCategorySchema = z
  .object({
    code: z.string().trim().min(1).max(100).regex(/^[A-Z0-9_.-]+$/).optional(),
    name: z.string().trim().min(1).max(200).optional(),
    parentId: z.string().uuid().nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "No updatable fields provided",
  });
