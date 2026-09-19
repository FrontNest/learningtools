import { z } from "zod";
import { appConfig } from "../config";

export const createWorklogSchema = z.object({
  durationMinutes: z.number().int().min(0).max(24 * 60),
  description: z
    .string()
    .trim()
    .min(1)
    .max(appConfig.worklogMaxChars)
    .refine((text) => text.split(/\r\n|\r|\n/).length <= appConfig.worklogMaxLines, {
      message: `Description must not exceed ${appConfig.worklogMaxLines} lines`,
    }),
});
