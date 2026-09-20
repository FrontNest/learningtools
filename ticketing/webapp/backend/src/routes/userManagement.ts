import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../middleware/auth";
import { AppError } from "../errors/AppError";
import { createUserSchema, updateUserSchema } from "../validators/userAdminValidators";
import { createUser, deleteUser, listAllUsers, resetUserPassword, updateUser } from "../services/userAdminService";
import { importUsersFromCsv } from "../services/userImportService";

export const userManagementRouter = Router();

userManagementRouter.use(requireAuth, requireRole("ADMIN"));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

userManagementRouter.get("/", async (_req, res) => {
  const users = await listAllUsers();
  res.json({ users });
});

userManagementRouter.post("/", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid user data");
  }
  const result = await createUser(parsed.data);
  res.status(201).json(result);
});

userManagementRouter.patch("/:id", async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid update data");
  }
  const user = await updateUser(req.currentUser!, req.params.id, parsed.data);
  res.json({ user });
});

userManagementRouter.post("/:id/reset-password", async (req, res) => {
  const result = await resetUserPassword(req.params.id);
  res.json(result);
});

userManagementRouter.delete("/:id", async (req, res) => {
  const deleteHistory = req.query.deleteHistory === "true";
  const result = await deleteUser(req.currentUser!, req.params.id, deleteHistory);
  res.status(200).json(result);
});

userManagementRouter.post("/import", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    throw AppError.badRequest("No file uploaded");
  }
  const result = await importUsersFromCsv(req.file.buffer.toString("utf-8"));
  res.json(result);
});
