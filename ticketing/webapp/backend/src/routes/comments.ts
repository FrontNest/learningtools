import { Router } from "express";
import { AppError } from "../errors/AppError";
import { createCommentSchema } from "../validators/commentValidators";
import { createComment, listComments } from "../services/commentService";

export const commentsRouter = Router({ mergeParams: true });

commentsRouter.get("/", async (req, res) => {
  const ticketId = (req.params as { id: string }).id;
  const comments = await listComments(req.currentUser!, ticketId);
  res.json({ comments });
});

commentsRouter.post("/", async (req, res) => {
  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid comment data");
  }

  const ticketId = (req.params as { id: string }).id;
  const comment = await createComment(req.currentUser!, ticketId, parsed.data);
  res.status(201).json({ comment });
});
