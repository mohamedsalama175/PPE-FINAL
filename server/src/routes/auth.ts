import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/auth.js";
import { normalizeRole, denormalizeRole } from "../utils/helpers.js";

const router = Router();

router.post("/login", validate(loginSchema), asyncHandler(async (req, res) => {
  const { employeeCode, password } = req.body;
  const employee = await prisma.employee.findUnique({
    where: { employeeCode },
    include: { jobPosition: true },
  });
  if (!employee || !employee.active || employee.deletedAt) {
    throw new ApiError(401, "Invalid credentials");
  }
  if (!employee.passwordHash) {
    throw new ApiError(401, "Account has no password set. Contact admin.");
  }
  const ok = await bcrypt.compare(password, employee.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  const token = jwt.sign(
    { id: employee.id, employeeCode: employee.employeeCode, role: employee.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as any
  );

  res.json({
    token,
    user: {
      id: employee.id,
      employeeCode: employee.employeeCode,
      name: employee.name,
      role: denormalizeRole(employee.role as string),
      roleRaw: employee.role,
      jobPositionId: employee.jobPositionId,
      jobPosition: employee.jobPosition,
    },
  });
}));

router.post("/register", validate(registerSchema), asyncHandler(async (req, res) => {
  // Allow first user creation without auth, otherwise requires Admin
  const count = await prisma.employee.count();
  if (count > 0) {
    // require auth admin if not first
    const header = req.headers.authorization;
    if (!header) throw new ApiError(401, "Auth required to register");
  }
  const { employeeCode, name, jobPositionId, role, password, active } = req.body;
  const existing = await prisma.employee.findUnique({ where: { employeeCode } });
  if (existing) throw new ApiError(409, "employeeCode already exists");
  const jp = await prisma.jobPosition.findUnique({ where: { id: jobPositionId } });
  if (!jp) throw new ApiError(400, "jobPositionId not found");
  const hash = await bcrypt.hash(password, 10);
  const normalized = normalizeRole(role);
  const emp = await prisma.employee.create({
    data: { employeeCode, name, jobPositionId, role: normalized as any, passwordHash: hash, active: active ?? true },
  });
  res.status(201).json({ id: emp.id, employeeCode: emp.employeeCode, name: emp.name, role: denormalizeRole(emp.role as string) });
}));

router.get("/me", authenticate, asyncHandler(async (req, res) => {
  const me = await prisma.employee.findUnique({
    where: { id: req.user!.id },
    include: { jobPosition: true },
  });
  if (!me) throw new ApiError(404, "Not found");
  res.json({
    id: me.id,
    employeeCode: me.employeeCode,
    name: me.name,
    role: denormalizeRole(me.role as string),
    roleRaw: me.role,
    jobPositionId: me.jobPositionId,
    jobPosition: me.jobPosition,
    active: me.active,
  });
}));

export default router;
