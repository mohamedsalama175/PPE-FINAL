import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { openingBalanceSchema } from "../schemas/entities.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleGuard.js";
import { parsePagination, paginateMeta } from "../utils/pagination.js";
const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const status = req.query.status;
    const locationId = req.query.locationId;
    const where = {};
    if (status)
        where.status = status.replace(" ", "_");
    if (locationId)
        where.locationId = locationId;
    const total = await prisma.openingBalance.count({ where });
    const data = await prisma.openingBalance.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" },
        include: { lines: { include: { ppeItem: true } }, location: true, preparer: true, approver: true }
    });
    res.json({ data, meta: paginateMeta(total, page, limit) });
}));
router.get("/:id", asyncHandler(async (req, res) => {
    const ob = await prisma.openingBalance.findUnique({ where: { id: req.params.id }, include: { lines: { include: { ppeItem: true } }, location: true, preparer: true, approver: true, batches: true } });
    if (!ob)
        throw new ApiError(404, "OpeningBalance not found");
    res.json(ob);
}));
router.post("/", authorize("Admin", "Store Keeper", "HSE Supervisor"), validate(openingBalanceSchema), asyncHandler(async (req, res) => {
    const { locationId, referenceDate, notes, lines, status } = req.body;
    // validations: referenceDate <= today
    if (new Date(referenceDate) > new Date())
        throw new ApiError(400, "referenceDate cannot be in future");
    for (const line of lines) {
        if (new Date(line.expiryDate) <= new Date(referenceDate))
            throw new ApiError(400, `expiryDate must be after referenceDate for ${line.batchNumber}`);
    }
    // unique batch per doc check already via DB unique but validate duplicate in payload
    const combos = new Set();
    for (const l of lines) {
        const key = `${l.ppeItemId}|${l.batchNumber}`;
        if (combos.has(key))
            throw new ApiError(400, `Duplicate ppeItemId+batchNumber ${key}`);
        combos.add(key);
    }
    // single approved per location check if creating approved
    if (status === "Approved") {
        const existingApproved = await prisma.openingBalance.findFirst({ where: { locationId, status: "Approved" } });
        if (existingApproved)
            throw new ApiError(400, "An Approved opening balance already exists for this location");
    }
    const ob = await prisma.openingBalance.create({
        data: {
            locationId,
            referenceDate: new Date(referenceDate),
            notes: notes || null,
            status: status?.replace(" ", "_") || "Draft",
            preparedBy: req.user.id,
            lines: {
                create: lines.map((l) => ({
                    ppeItemId: l.ppeItemId,
                    batchNumber: l.batchNumber,
                    expiryDate: new Date(l.expiryDate),
                    quantity: l.quantity,
                    costPerUnit: l.costPerUnit ?? null,
                }))
            }
        },
        include: { lines: true }
    });
    await prisma.auditLog.create({ data: { entityType: "OpeningBalance", entityId: ob.id, action: "CREATED", performedBy: req.user.id } });
    res.status(201).json(ob);
}));
router.put("/:id", authorize("Admin", "Store Keeper", "HSE Supervisor"), validate(openingBalanceSchema), asyncHandler(async (req, res) => {
    const existing = await prisma.openingBalance.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw new ApiError(404, "Not found");
    if (existing.status === "Approved")
        throw new ApiError(400, "Cannot edit approved balance");
    const { locationId, referenceDate, notes, lines, status } = req.body;
    if (new Date(referenceDate) > new Date())
        throw new ApiError(400, "referenceDate cannot be future");
    for (const line of lines) {
        if (new Date(line.expiryDate) <= new Date(referenceDate))
            throw new ApiError(400, `expiryDate must be after referenceDate for ${line.batchNumber}`);
    }
    await prisma.openingBalanceLine.deleteMany({ where: { openingBalanceId: req.params.id } });
    const ob = await prisma.openingBalance.update({
        where: { id: req.params.id },
        data: {
            locationId,
            referenceDate: new Date(referenceDate),
            notes: notes || null,
            status: status?.replace(" ", "_") || existing.status,
            lines: {
                create: lines.map((l) => ({
                    ppeItemId: l.ppeItemId,
                    batchNumber: l.batchNumber,
                    expiryDate: new Date(l.expiryDate),
                    quantity: l.quantity,
                    costPerUnit: l.costPerUnit ?? null,
                }))
            }
        },
        include: { lines: true }
    });
    await prisma.auditLog.create({ data: { entityType: "OpeningBalance", entityId: ob.id, action: "UPDATED", performedBy: req.user.id } });
    res.json(ob);
}));
router.patch("/:id/submit", authorize("Admin", "Store Keeper", "HSE Supervisor"), asyncHandler(async (req, res) => {
    const ob = await prisma.openingBalance.findUnique({ where: { id: req.params.id } });
    if (!ob)
        throw new ApiError(404, "Not found");
    if (ob.status !== "Draft")
        throw new ApiError(400, "Only Draft can be submitted");
    const updated = await prisma.openingBalance.update({ where: { id: req.params.id }, data: { status: "Pending_Approval", submittedAt: new Date() } });
    await prisma.auditLog.create({ data: { entityType: "OpeningBalance", entityId: ob.id, action: "SUBMITTED", performedBy: req.user.id } });
    res.json(updated);
}));
router.patch("/:id/approve", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
    const ob = await prisma.openingBalance.findUnique({ where: { id: req.params.id }, include: { lines: true } });
    if (!ob)
        throw new ApiError(404, "Not found");
    if (ob.status !== "Pending_Approval")
        throw new ApiError(400, "Only Pending Approval can be approved");
    const existingApproved = await prisma.openingBalance.findFirst({ where: { locationId: ob.locationId, status: "Approved" } });
    if (existingApproved)
        throw new ApiError(400, "An Approved opening balance already exists for this location");
    await prisma.$transaction(async (tx) => {
        await tx.openingBalance.update({ where: { id: ob.id }, data: { status: "Approved", approvedBy: req.user.id, approvedAt: new Date() } });
        // create batches + update stock balances
        for (const line of ob.lines) {
            await tx.batch.create({
                data: {
                    batchNumber: line.batchNumber,
                    ppeItemId: line.ppeItemId,
                    locationId: ob.locationId,
                    quantity: line.quantity,
                    availableQty: line.quantity,
                    expiryDate: line.expiryDate,
                    costPerUnit: line.costPerUnit ?? null,
                    status: "Active",
                    openingBalanceId: ob.id,
                }
            });
            const bal = await tx.stockBalance.findFirst({ where: { ppeItemId: line.ppeItemId, locationId: ob.locationId } });
            if (bal) {
                await tx.stockBalance.update({ where: { id: bal.id }, data: { quantityOnHand: bal.quantityOnHand + line.quantity } });
            }
            else {
                await tx.stockBalance.create({ data: { ppeItemId: line.ppeItemId, locationId: ob.locationId, quantityOnHand: line.quantity } });
            }
        }
        await tx.auditLog.create({ data: { entityType: "OpeningBalance", entityId: ob.id, action: "APPROVED", performedBy: req.user.id } });
        await tx.stockMovement.create({
            data: {
                type: "opening",
                ppeItemId: ob.lines[0]?.ppeItemId || "unknown",
                locationId: ob.locationId,
                quantity: ob.lines.reduce((s, l) => s + l.quantity, 0),
                reason: "Opening Balance Approved",
                reference: `OB-${ob.id.slice(-6)}`,
                createdBy: req.user.id,
            }
        });
    });
    const updated = await prisma.openingBalance.findUnique({ where: { id: req.params.id }, include: { lines: true } });
    res.json(updated);
}));
router.patch("/:id/reject", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
    const { reason } = req.body;
    if (!reason || reason.length < 20)
        throw new ApiError(400, "Rejection reason must be >=20 chars");
    const ob = await prisma.openingBalance.findUnique({ where: { id: req.params.id } });
    if (!ob)
        throw new ApiError(404, "Not found");
    if (ob.status !== "Pending_Approval")
        throw new ApiError(400, "Only Pending Approval can be rejected");
    const updated = await prisma.openingBalance.update({ where: { id: req.params.id }, data: { status: "Rejected", rejectionReason: reason } });
    await prisma.auditLog.create({ data: { entityType: "OpeningBalance", entityId: ob.id, action: "REJECTED", details: reason, performedBy: req.user.id } });
    res.json(updated);
}));
router.delete("/:id", authorize("Admin"), asyncHandler(async (req, res) => {
    const ob = await prisma.openingBalance.findUnique({ where: { id: req.params.id } });
    if (!ob)
        throw new ApiError(404, "Not found");
    if (ob.status === "Approved")
        throw new ApiError(400, "Cannot delete approved");
    await prisma.openingBalance.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
}));
export default router;
