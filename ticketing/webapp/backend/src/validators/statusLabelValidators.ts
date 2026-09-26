import { z } from "zod";

export const updateStatusLabelSchema = z.object({
  label: z.string().trim().min(1).max(60),
});
