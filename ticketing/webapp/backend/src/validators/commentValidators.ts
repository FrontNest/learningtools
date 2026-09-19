import { z } from "zod";
import { COMMENT_TYPES } from "../domain/enums";

export const createCommentSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  type: z.enum(COMMENT_TYPES).default("PUBLIC"),
});
