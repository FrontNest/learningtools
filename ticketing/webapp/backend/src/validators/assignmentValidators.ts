import { z } from "zod";

// assignedTeamId/assignedUserId: undefined = "leave unchanged", null = "clear".
export const updateAssignmentSchema = z
  .object({
    assignedTeamId: z.string().uuid().nullable().optional(),
    assignedUserId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => data.assignedTeamId !== undefined || data.assignedUserId !== undefined, {
    message: "No assignment fields provided",
  });
