import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { kitSchema } from "../schemas/entities.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleGuard.js";
import { parsePagination, paginateMeta } from "../utils/pagination.js";
const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const search = req.query.search?.toLowerCase();
    const includeDeleted = req.query.includeDeleted === "true";
    const jobPositionId = req.query.jobPositionId;
    const where = {};
    if (!includeDeleted)
        where.deletedAt = null;
    if (jobPositionId)
        where.jobPositionId = jobPositionId;
    if (search)
        where.OR = [{ nameEn: { contains: search } }, { nameAr: { contains: search } }];
    const total = await prisma.kit.count({ where });
    const data = await prisma.kit.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { items: { include: { ppeItem: true } }, jobPosition: true },
    });
    res.json({ data, meta: paginateMeta(total, page, limit) });
}));
router.get("/:id", asyncHandler(async (req, res) => {
    const k = await prisma.kit.findUnique({ where: { id: req.params.id }, include: { items: true, jobPosition: true } });
    if (!k)
        throw new ApiError(404, "Kit not found");
    res.json(k);
}));
router.post("/", authorize("Admin", "HSE Supervisor"), validate(kitSchema), asyncHandler(async (req, res) => {
    const { items, ...rest } = req.body;
    const kit = await prisma.kit.create({ data: rest });
    for (const it of items) {
        await prisma.kitItem.create({ data: { kitId: kit.id, ppeItemId: it.ppeItemId, qty: it.qty, variantKey: it.variantKey || null } });
    }
    const full = await prisma.kit.findUnique({ where: { id: kit.id }, include: { items: true } });
    await prisma.auditLog.create({
        data: {
            entityType: "Kit",
            entityId: kit.id,
            action: "CREATED",
            performedBy: req.user.id,
            afterValues: JSON.stringify(full),
        },
    });
    res.status(201).json(full);
}));
router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(kitSchema), asyncHandler(async (req, res) => {
    const existing = await prisma.kit.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!existing)
        throw new ApiError(404, "Kit not found");
    const { items, ...rest } = req.body;
    const kit = await prisma.kit.update({ where: { id: req.params.id }, data: rest });
    await prisma.kitItem.deleteMany({ where: { kitId: req.params.id } });
    for (const it of items) {
        await prisma.kitItem.create({ data: { kitId: kit.id, ppeItemId: it.ppeItemId, qty: it.qty, variantKey: it.variantKey || null } });
    }
    const full = await prisma.kit.findUnique({ where: { id: kit.id }, include: { items: true } });
    await prisma.auditLog.create({
        data: {
            entityType: "Kit",
            entityId: kit.id,
            action: "UPDATED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(existing),
            afterValues: JSON.stringify(full),
        },
    });
    res.json(full);
}));
async function checkKitInUse(kitId) {
    const activeIssuances = await prisma.issuance.count({
        where: { kitId, status: { in: ["issued", "Active"] } },
    });
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentIssuances = await prisma.issuance.count({
        where: { kitId, createdAt: { gte: ninetyDaysAgo } },
    });
    return { inUse: activeIssuances > 0 || recentIssuances > 0, activeIssuances, recentIssuances };
}
router.get("/:id/in-use", asyncHandler(async (req, res) => {
    const check = await checkKitInUse(req.params.id);
    res.json({
        inUse: check.inUse,
        activeIssuanceCount: check.activeIssuances,
        recentIssuanceCount: check.recentIssuances,
    });
}));
router.patch("/:id/active", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
    const { active, adminOverrideReason } = req.body;
    if (typeof active !== "boolean")
        throw new ApiError(400, "active boolean required");
    if (!active) {
        const inUseCheck = await checkKitInUse(req.params.id);
        if (inUseCheck.inUse) {
            const isAdmin = req.user.role === "Admin" || req.user.role.replace(/_/g, " ") === "Admin";
            if (!isAdmin) {
                throw new ApiError(400, "Cannot deactivate in-use Kit without Admin override");
            }
            if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
                throw new ApiError(400, "Admin override reason is required to deactivate in-use Kit");
            }
            const existing = await prisma.kit.findUnique({ where: { id: req.params.id } });
            const kit = await prisma.kit.update({ where: { id: req.params.id }, data: { active } });
            await prisma.auditLog.create({
                data: {
                    entityType: "Kit",
                    entityId: kit.id,
                    action: "OVERRIDE_DEACTIVATE",
                    performedBy: req.user.id,
                    reason: adminOverrideReason.trim(),
                    beforeValues: JSON.stringify(existing),
                    afterValues: JSON.stringify(kit),
                },
            });
            return res.json(kit);
        }
    }
    const existing = await prisma.kit.findUnique({ where: { id: req.params.id } });
    const kit = await prisma.kit.update({ where: { id: req.params.id }, data: { active } });
    await prisma.auditLog.create({
        data: {
            entityType: "Kit",
            entityId: kit.id,
            action: active ? "ACTIVATED" : "DEACTIVATED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(existing),
            afterValues: JSON.stringify(kit),
        },
    });
    res.json(kit);
}));
router.delete("/:id", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
    const kit = await prisma.kit.findUnique({ where: { id: req.params.id } });
    if (!kit)
        throw new ApiError(404, "Kit not found");
    const { adminOverrideReason } = req.body || {};
    const inUseCheck = await checkKitInUse(req.params.id);
    if (inUseCheck.inUse) {
        const isAdmin = req.user.role === "Admin" || req.user.role.replace(/_/g, " ") === "Admin";
        if (!isAdmin) {
            throw new ApiError(400, "Cannot delete in-use Kit without Admin override");
        }
        if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
            throw new ApiError(400, "Admin override reason is required to delete in-use Kit");
        }
        await prisma.kit.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
        await prisma.auditLog.create({
            data: {
                entityType: "Kit",
                entityId: req.params.id,
                action: "OVERRIDE_DELETE",
                performedBy: req.user.id,
                reason: adminOverrideReason.trim(),
                beforeValues: JSON.stringify(kit),
            },
        });
        return res.json({ message: "Soft deleted with Admin override" });
    }
    await prisma.kit.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
    await prisma.auditLog.create({
        data: {
            entityType: "Kit",
            entityId: req.params.id,
            action: "SOFT_DELETED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(kit),
        },
    });
    res.json({ message: "Soft deleted" });
}));
router.post("/:id/restore", authorize("Admin"), asyncHandler(async (req, res) => {
    const existing = await prisma.kit.findUnique({ where: { id: req.params.id }, include: { items: true } });
    const k = await prisma.kit.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null }, include: { items: true } });
    await prisma.auditLog.create({
        data: {
            entityType: "Kit",
            entityId: k.id,
            action: "RESTORED",
            performedBy: req.user.id,
            beforeValues: existing ? JSON.stringify(existing) : undefined,
            afterValues: JSON.stringify(k),
        },
    });
    res.json(k);
}));
export default router;
