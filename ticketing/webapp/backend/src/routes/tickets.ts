import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { AppError } from "../errors/AppError";
import {
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from "../validators/ticketValidators";
import { updateAssignmentSchema } from "../validators/assignmentValidators";
import { createTicket, getTicketById, listTickets, updateTicketAsAdmin } from "../services/ticketService";
import { updateTicketAssignment } from "../services/assignmentService";
import { commentsRouter } from "./comments";
import { worklogsRouter } from "./worklogs";
import { attachmentsRouter } from "./attachments";
import { auditRouter } from "./audit";

export const ticketsRouter = Router();

ticketsRouter.use(requireAuth);
ticketsRouter.use("/:id/comments", commentsRouter);
ticketsRouter.use("/:id/worklogs", worklogsRouter);
ticketsRouter.use("/:id/attachments", attachmentsRouter);
ticketsRouter.use("/:id/audit", auditRouter);

ticketsRouter.post("/", async (req, res) => {
  const parsed = createTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid ticket data");
  }

  const ticket = await createTicket(req.currentUser!, parsed.data);
  res.status(201).json({ ticket });
});

ticketsRouter.get("/", async (req, res) => {
  const parsed = listTicketsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw AppError.badRequest("Invalid filter parameters");
  }

  const tickets = await listTickets(req.currentUser!, parsed.data);
  res.json({ tickets });
});

ticketsRouter.get("/:id", async (req, res) => {
  const ticket = await getTicketById(req.currentUser!, req.params.id);
  res.json({ ticket });
});

ticketsRouter.patch("/:id", requireRole("ADMIN"), async (req, res) => {
  const parsed = updateTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid update data");
  }

  const ticket = await updateTicketAsAdmin(req.currentUser!, req.params.id, parsed.data);
  res.json({ ticket });
});

ticketsRouter.patch("/:id/assignment", requireRole("ADMIN"), async (req, res) => {
  const parsed = updateAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid assignment data");
  }

  const ticket = await updateTicketAssignment(req.currentUser!, req.params.id, parsed.data);
  res.json({ ticket });
});
