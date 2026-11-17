import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { scrapReverseSchema } from "../schemas/entities.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleGuard.js";
import { parsePagination, paginateMeta } from "../utils/pagination.js";
const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const where = {};
    if (req.query.reversed === "true")
        where.reversed = true;
    if (req.query.reversed === "false")
        where.reversed = false;
    const total = await prisma.scrapEntry.count({ where });
    const data = await prisma.scrapEntry.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { ppeItem: true, location: true, scrapper: true } });
    res.json({ data, meta: paginateMeta(total, page, limit) });
}));
router.post("/:id/reverse", authorize("Admin", "HSE Supervisor"), validate(scrapReverseSchema), asyncHandler(async (req, res) => {
    const scrap = await prisma.scrapEntry.findUnique({ where: { id: req.params.id } });
    if (!scrap)
        throw new ApiError(404, "Scrap not found");
    if (scrap.reversed)
        throw new ApiError(400, "Already reversed");
    // 7 day window
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - new Date(scrap.createdAt).getTime() > sevenDays)
        throw new ApiError(400, "Reversal window (7 days) expired");
    const { reason } = req.body;
    await prisma.$transaction(async (tx) => {
        await tx.scrapEntry.update({ where: { id: scrap.id }, data: { reversed: true, reversedBy: req.user.id, reversedAt: new Date(), reversalReason: reason } });
        // restock to Used or original issuance location
        let targetLocationId;
        const usedLoc = await tx.location.findFirst({ where: { locationType: "Used" } });
        if (scrap.relatedReferenceId) {
            const issuance = await tx.issuance.findUnique({ where: { id: scrap.relatedReferenceId } });
            targetLocationId = usedLoc ? usedLoc.id : (issuance?.locationId || (await tx.location.findFirst()).id);
        }
        else {
            targetLocationId = usedLoc ? usedLoc.id : (await tx.location.findFirst()).id;
        }
        const bal = await tx.stockBalance.findFirst({ where: { ppeItemId: scrap.ppeItemId, locationId: targetLocationId } });
        if (bal)
            await tx.stockBalance.update({ where: { id: bal.id }, data: { quantityOnHand: bal.quantityOnHand + scrap.quantity } });
        else
            await tx.stockBalance.create({ data: { ppeItemId: scrap.ppeItemId, locationId: targetLocationId, quantityOnHand: scrap.quantity } });
        await tx.auditLog.create({ data: { entityType: "Scrap", entityId: scrap.id, action: "REVERSED", details: reason, performedBy: req.user.id } });
    });
    const updated = await prisma.scrapEntry.findUnique({ where: { id: req.params.id } });
    res.json(updated);
}));
router.post("/", authorize("Admin", "HSE Supervisor", "Store Keeper"), asyncHandler(async (req, res) => {
    const { ppeItemId, locationId, batchNumber, quantity, reason, relatedReferenceId } = req.body;
    if (!ppeItemId || !locationId || !quantity || !reason)
        throw new ApiError(400, "Missing fields");
    // deduct stock
    const bal = await prisma.stockBalance.findFirst({ where: { ppeItemId, locationId } });
    if (!bal || bal.quantityOnHand < quantity)
        throw new ApiError(400, "Insufficient stock to scrap");
    await prisma.$transaction(async (tx) => {
        await tx.stockBalance.update({ where: { id: bal.id }, data: { quantityOnHand: bal.quantityOnHand - quantity } });
        if (batchNumber) {
            const batch = await tx.batch.findFirst({ where: { batchNumber, ppeItemId, locationId } });
            if (batch)
                await tx.batch.update({ where: { id: batch.id }, data: { availableQty: Math.max(0, batch.availableQty - quantity), status: batch.availableQty - quantity <= 0 ? "Depleted" : "Active" } });
        }
        const scrap = await tx.scrapEntry.create({ data: { ppeItemId, locationId, batchNumber: batchNumber || null, quantity, reason, relatedReferenceId: relatedReferenceId || null, scrappedBy: req.user.id } });
        await tx.auditLog.create({ data: { entityType: "Scrap", entityId: scrap.id, action: "SCRAPPED", details: reason, performedBy: req.user.id } });
        res.status(201).json(scrap);
    });
}));
export default router;
