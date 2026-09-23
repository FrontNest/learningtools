import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../errors/AppError";
import {
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from "../validators/ticketValidators";
import { updateAssignmentSchema } from "../validators/assignmentValidators";
import { createTicket, deleteTicketAsMaster, getTicketById, listTickets, updateTicketAsAdmin } from "../services/ticketService";
import { updateTicketAssignment } from "../services/assignmentService";
import { claimTeamTicket, updateTeamRequesterTicket } from "../services/requesterTeamService";
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

ticketsRouter.delete("/:id", async (req, res) => {
  await deleteTicketAsMaster(req.currentUser!, req.params.id);
  res.status(204).send();
});

ticketsRouter.patch("/:id", async (req, res) => {
  const parsed = updateTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid update data");
  }

  const ticket = req.currentUser!.role === "ADMIN"
    ? await updateTicketAsAdmin(req.currentUser!, req.params.id, parsed.data)
    : parsed.data.status
      ? await updateTeamRequesterTicket(req.currentUser!, req.params.id, parsed.data.status)
      : (() => { throw AppError.forbidden("Requesters can only change ticket status"); })();
  res.json({ ticket });
});

ticketsRouter.patch("/:id/assignment", async (req, res) => {
  if (req.currentUser!.role !== "ADMIN") {
    const assignedUserId = req.body?.assignedUserId;
    if (assignedUserId !== undefined && assignedUserId !== req.currentUser!.id) {
      throw AppError.forbidden("Requesters can only assign tickets to themselves");
    }
    const ticket = await claimTeamTicket(req.currentUser!, req.params.id);
    res.json({ ticket });
    return;
  }

  const parsed = updateAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid assignment data");
  }

  const ticket = await updateTicketAssignment(req.currentUser!, req.params.id, parsed.data);
  res.json({ ticket });
});
