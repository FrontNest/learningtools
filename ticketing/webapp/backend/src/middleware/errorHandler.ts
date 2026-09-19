import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError";
import { logger } from "../lib/logger";
import { isProduction } from "../config";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

// Central error handler: never leaks stack traces, SQL errors, or internals to the client.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { path: req.path });
    }
    res.status(err.statusCode).json({ error: err.expose ? err.message : "Internal server error" });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File exceeds the maximum allowed size" : err.message;
    res.status(400).json({ error: message });
    return;
  }

  logger.error("Unhandled error", { path: req.path, error: isProduction ? undefined : err });
  res.status(500).json({ error: "Internal server error" });
}
