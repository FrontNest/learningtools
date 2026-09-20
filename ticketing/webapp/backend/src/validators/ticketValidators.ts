import { z } from "zod";
import { PRIORITIES, TICKET_STATUSES } from "../domain/enums";

export const createTicketSchema = z
  .object({
    subject: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(10000),
    categoryId: z.string().uuid(),
    otherCategoryDescription: z.string().trim().min(1).max(500).optional(),
    priority: z.enum(PRIORITIES).default("NORMAL"),
    deviceId: z.string().uuid().optional(),
    otherDeviceDescription: z.string().trim().min(1).max(500).optional(),
  })
  .refine((data) => Boolean(data.deviceId) || Boolean(data.otherDeviceDescription), {
    message: "Select a device or provide an 'Other device' description",
    path: ["deviceId"],
  });

export const updateTicketSchema = z
  .object({
    priority: z.enum(PRIORITIES).optional(),
    status: z.enum(TICKET_STATUSES).optional(),
    categoryId: z.string().uuid().optional(),
    otherCategoryDescription: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .refine((data) => data.priority !== undefined || data.status !== undefined || data.categoryId !== undefined || data.otherCategoryDescription !== undefined, {
    message: "No updatable fields provided",
  });

export const listTicketsQuerySchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assignedTeamId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
  unassigned: z.coerce.boolean().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});
