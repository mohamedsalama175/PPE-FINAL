import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { employeeUpdateSchema } from "../schemas/entities.js";
import { authenticate } from "../middleware/auth.js";
import { authorize, getScopedSubordinateIds } from "../middleware/roleGuard.js";
import { parsePagination, paginateMeta } from "../utils/pagination.js";
import bcrypt from "bcryptjs";
import { normalizeRole, denormalizeRole } from "../utils/helpers.js";
const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const search = req.query.search?.toLowerCase();
    const roleFilter = req.query.role;
    const activeFilter = req.query.active;
    const includeDeleted = req.query.includeDeleted === "true";
    const where = {};
    if (!includeDeleted)
        where.deletedAt = null;
    if (activeFilter === "true")
        where.active = true;
    if (activeFilter === "false")
        where.active = false;
    if (roleFilter)
        where.role = normalizeRole(roleFilter);
    if (search)
        where.OR = [{ name: { contains: search } }, { employeeCode: { contains: search } }];
    // Scoping for Direct Supervisor: own team only
    const scopedIds = await getScopedSubordinateIds(req.user.id, prisma);
    if (scopedIds !== null) {
        where.id = { in: scopedIds };
    }
    const total = await prisma.employee.count({ where });
    const data = await prisma.employee.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { jobPosition: true, supervisor: true } });
    const mapped = data.map(e => ({ ...e, role: denormalizeRole(e.role), passwordHash: undefined }));
    res.json({ data: mapped, meta: paginateMeta(total, page, limit) });
}));
router.get("/:id", asyncHandler(async (req, res) => {
    // Scoping for Direct Supervisor: own team only
    const scopedIds = await getScopedSubordinateIds(req.user.id, prisma);
    if (scopedIds !== null && !scopedIds.includes(req.params.id) && req.params.id !== req.user.id) {
        throw new ApiError(403, "Forbidden: Direct Supervisors can only view their own team members");
    }
    const e = await prisma.employee.findUnique({ where: { id: req.params.id }, include: { jobPosition: true, supervisor: true, subordinates: true } });
    if (!e)
        throw new ApiError(404, "Employee not found");
    res.json({ ...e, role: denormalizeRole(e.role), passwordHash: undefined });
}));
router.get("/:id/timeline", asyncHandler(async (req, res) => {
    const employeeId = req.params.id;
    // Scoping for Direct Supervisor: own team only
    const scopedIds = await getScopedSubordinateIds(req.user.id, prisma);
    if (scopedIds !== null && !scopedIds.includes(employeeId) && employeeId !== req.user.id) {
        throw new ApiError(403, "Forbidden: Direct Supervisors can only view their own team members");
    }
    const issuances = await prisma.issuance.findMany({
        where: { employeeId },
        orderBy: { issueDate: "desc" },
        include: {
            ppeItem: true,
            kit: { include: { items: { include: { ppeItem: true } } } },
            issuer: { select: { id: true, name: true, employeeCode: true } },
            returns: { include: { returner: { select: { id: true, name: true } } } }
        }
    });
    res.json({ data: issuances });
}));
router.put("/:id", authorize("Admin"), validate(employeeUpdateSchema), asyncHandler(async (req, res) => {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw new ApiError(404, "Employee not found");
    const data = {};
    if (req.body.name)
        data.name = req.body.name;
    if (req.body.jobPositionId)
        data.jobPositionId = req.body.jobPositionId;
    if (req.body.role)
        data.role = normalizeRole(req.body.role);
    if (req.body.gender)
        data.gender = req.body.gender;
    if (req.body.employmentStatus)
        data.employmentStatus = req.body.employmentStatus;
    if (req.body.supervisorId !== undefined)
        data.supervisorId = req.body.supervisorId;
    if (req.body.department !== undefined)
        data.department = req.body.department;
    if (req.body.site !== undefined)
        data.site = req.body.site;
    if (typeof req.body.active === "boolean")
        data.active = req.body.active;
    if (req.body.password)
        data.passwordHash = await bcrypt.hash(req.body.password, 10);
    const e = await prisma.employee.update({ where: { id: req.params.id }, data });
    // Sanitize passwordHash before recording audit trail (Rule G1 & Security)
    const { passwordHash: _prevHash, ...beforeClean } = existing;
    const { passwordHash: _nextHash, ...afterClean } = e;
    await prisma.auditLog.create({
        data: {
            entityType: "Employee",
            entityId: e.id,
            action: "UPDATED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(beforeClean),
            afterValues: JSON.stringify(afterClean),
        },
    });
    res.json({ ...e, role: denormalizeRole(e.role), passwordHash: undefined });
}));
router.delete("/:id", authorize("Admin"), asyncHandler(async (req, res) => {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw new ApiError(404, "Employee not found");
    await prisma.employee.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
    const { passwordHash: _prevHash, ...beforeClean } = existing;
    await prisma.auditLog.create({
        data: {
            entityType: "Employee",
            entityId: req.params.id,
            action: "SOFT_DELETED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(beforeClean),
        },
    });
    res.json({ message: "Soft deleted" });
}));
router.post("/:id/restore", authorize("Admin"), asyncHandler(async (req, res) => {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw new ApiError(404, "Employee not found");
    const e = await prisma.employee.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null } });
    const { passwordHash: _prevHash, ...beforeClean } = existing;
    const { passwordHash: _nextHash, ...afterClean } = e;
    await prisma.auditLog.create({
        data: {
            entityType: "Employee",
            entityId: req.params.id,
            action: "RESTORED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(beforeClean),
            afterValues: JSON.stringify(afterClean),
        },
    });
    res.json({ ...e, role: denormalizeRole(e.role), passwordHash: undefined });
}));
export default router;
