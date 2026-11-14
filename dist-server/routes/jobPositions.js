import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { jobPositionSchema } from "../schemas/entities.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleGuard.js";
import { parsePagination, paginateMeta } from "../utils/pagination.js";
const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const search = req.query.search?.toLowerCase();
    const includeDeleted = req.query.includeDeleted === "true";
    const activeFilter = req.query.active;
    const where = {};
    if (!includeDeleted)
        where.deletedAt = null;
    if (activeFilter === "true")
        where.active = true;
    if (activeFilter === "false")
        where.active = false;
    if (search) {
        where.OR = [
            { code: { contains: search } },
            { nameEn: { contains: search } },
            { nameAr: { contains: search } },
        ];
    }
    const total = await prisma.jobPosition.count({ where });
    const data = await prisma.jobPosition.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
    });
    res.json({ data, meta: paginateMeta(total, page, limit) });
}));
router.get("/:id", asyncHandler(async (req, res) => {
    const jp = await prisma.jobPosition.findUnique({ where: { id: req.params.id } });
    if (!jp)
        throw new ApiError(404, "JobPosition not found");
    res.json(jp);
}));
router.post("/", authorize("Admin", "HSE Supervisor"), validate(jobPositionSchema), asyncHandler(async (req, res) => {
    const jp = await prisma.jobPosition.create({ data: req.body });
    await prisma.auditLog.create({
        data: {
            entityType: "JobPosition",
            entityId: jp.id,
            action: "CREATED",
            performedBy: req.user.id,
            afterValues: JSON.stringify(jp),
        },
    });
    res.status(201).json(jp);
}));
router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(jobPositionSchema), asyncHandler(async (req, res) => {
    const existing = await prisma.jobPosition.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw new ApiError(404, "JobPosition not found");
    const jp = await prisma.jobPosition.update({ where: { id: req.params.id }, data: req.body });
    await prisma.auditLog.create({
        data: {
            entityType: "JobPosition",
            entityId: jp.id,
            action: "UPDATED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(existing),
            afterValues: JSON.stringify(jp),
        },
    });
    res.json(jp);
}));
async function checkJobPositionInUse(id) {
    const activeEmployees = await prisma.employee.count({
        where: { jobPositionId: id, deletedAt: null, active: true },
    });
    const activeKits = await prisma.kit.count({
        where: { jobPositionId: id, deletedAt: null, active: true },
    });
    return { inUse: activeEmployees > 0 || activeKits > 0, activeEmployees, activeKits };
}
router.get("/:id/in-use", asyncHandler(async (req, res) => {
    const check = await checkJobPositionInUse(req.params.id);
    res.json({
        inUse: check.inUse,
        activeEmployeeCount: check.activeEmployees,
        activeKitCount: check.activeKits,
    });
}));
router.patch("/:id/active", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
    const { active, adminOverrideReason } = req.body;
    if (typeof active !== "boolean")
        throw new ApiError(400, "active boolean required");
    if (!active) {
        const inUseCheck = await checkJobPositionInUse(req.params.id);
        if (inUseCheck.inUse) {
            const isAdmin = req.user.role === "Admin" || req.user.role.replace(/_/g, " ") === "Admin";
            if (!isAdmin) {
                throw new ApiError(400, "Cannot deactivate in-use Job Position without Admin override");
            }
            if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
                throw new ApiError(400, "Admin override reason is required to deactivate in-use Job Position");
            }
            const existing = await prisma.jobPosition.findUnique({ where: { id: req.params.id } });
            const jp = await prisma.jobPosition.update({ where: { id: req.params.id }, data: { active } });
            await prisma.auditLog.create({
                data: {
                    entityType: "JobPosition",
                    entityId: jp.id,
                    action: "OVERRIDE_DEACTIVATE",
                    performedBy: req.user.id,
                    reason: adminOverrideReason.trim(),
                    beforeValues: JSON.stringify(existing),
                    afterValues: JSON.stringify(jp),
                },
            });
            return res.json(jp);
        }
    }
    const existing = await prisma.jobPosition.findUnique({ where: { id: req.params.id } });
    const jp = await prisma.jobPosition.update({ where: { id: req.params.id }, data: { active } });
    await prisma.auditLog.create({
        data: {
            entityType: "JobPosition",
            entityId: jp.id,
            action: active ? "ACTIVATED" : "DEACTIVATED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(existing),
            afterValues: JSON.stringify(jp),
        },
    });
    res.json(jp);
}));
router.delete("/:id", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
    const jp = await prisma.jobPosition.findUnique({ where: { id: req.params.id } });
    if (!jp)
        throw new ApiError(404, "Not found");
    const { adminOverrideReason } = req.body || {};
    const inUseCheck = await checkJobPositionInUse(req.params.id);
    if (inUseCheck.inUse) {
        const isAdmin = req.user.role === "Admin" || req.user.role.replace(/_/g, " ") === "Admin";
        if (!isAdmin) {
            throw new ApiError(400, "Cannot delete in-use Job Position without Admin override");
        }
        if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
            throw new ApiError(400, "Admin override reason is required to delete in-use Job Position");
        }
        await prisma.jobPosition.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
        await prisma.auditLog.create({
            data: {
                entityType: "JobPosition",
                entityId: req.params.id,
                action: "OVERRIDE_DELETE",
                performedBy: req.user.id,
                reason: adminOverrideReason.trim(),
                beforeValues: JSON.stringify(jp),
            },
        });
        return res.json({ message: "Soft deleted with Admin override" });
    }
    await prisma.jobPosition.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
    await prisma.auditLog.create({
        data: {
            entityType: "JobPosition",
            entityId: req.params.id,
            action: "SOFT_DELETED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(jp),
        },
    });
    res.json({ message: "Soft deleted" });
}));
router.post("/:id/restore", authorize("Admin"), asyncHandler(async (req, res) => {
    const existing = await prisma.jobPosition.findUnique({ where: { id: req.params.id } });
    const jp = await prisma.jobPosition.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null } });
    await prisma.auditLog.create({
        data: {
            entityType: "JobPosition",
            entityId: jp.id,
            action: "RESTORED",
            performedBy: req.user.id,
            beforeValues: existing ? JSON.stringify(existing) : undefined,
            afterValues: JSON.stringify(jp),
        },
    });
    res.json(jp);
}));
export default router;
