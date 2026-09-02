import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";
import { ZodError } from "zod";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  // Prisma unique constraint
  if (err.code === "P2002") {
    return res.status(409).json({
      error: "Unique constraint violation",
      details: err.meta,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    error: err.message || "Internal server error",
  });
}
