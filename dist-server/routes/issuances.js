import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { issuanceSchema, issuanceReturnSchema } from "../schemas/entities.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleGuard.js";
import { parsePagination, paginateMeta } from "../utils/pagination.js";
import { addDays, addMonths, addYears } from "../utils/helpers.js";
const router = Router();
router.use(authenticate);
function computeReplacementDate(issueDate, lifespanType, lifespanValue) {
    if (lifespanType === "Days")
        return addDays(issueDate, lifespanValue);
    if (lifespanType === "Months")
        return addMonths(issueDate, lifespanValue);
    if (lifespanType === "Years")
        return addYears(issueDate, lifespanValue);
    return addDays(issueDate, lifespanValue);
}
router.get("/", asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const search = req.query.search;
    const status = req.query.status;
    const openLoansOnly = req.query.openLoansOnly === "true";
    const employeeId = req.query.employeeId;
    const where = {};
    if (status && status !== "all")
        where.status = status;
    if (employeeId)
        where.employeeId = employeeId;
    if (openLoansOnly) {
        where.expectedReturnDate = { not: null };
        where.status = "issued";
    }
    // store keeper scoping: limit to assigned locations
    const user = await prisma.employee.findUnique({ where: { id: req.user.id }, select: { role: true } });
    const isStoreKeeper = user?.role === "Store_Keeper";
    if (isStoreKeeper) {
        const links = await prisma.locationStoreKeeper.findMany({ where: { employeeId: req.user.id } });
        const ids = links.map(l => l.locationId);
        if (ids.length === 0)
            return res.json({ data: [], meta: paginateMeta(0, page, limit) });
        where.locationId = { in: ids };
    }
    let data = await prisma.issuance.findMany({
        where,
        include: { ppeItem: true, kit: { include: { items: true } }, location: true, employee: true, issuer: true },
        orderBy: { issueDate: "desc" },
    });
    if (search) {
        const s = search.toLowerCase();
        data = data.filter(i => {
            const empName = i.employee?.name?.toLowerCase() || "";
            const holder = i.holderName?.toLowerCase() || "";
            return empName.includes(s) || holder.includes(s) || i.ppeItem?.nameEn.toLowerCase().includes(s) || i.kit?.nameEn.toLowerCase().includes(s);
        });
    }
    const total = data.length;
    const effectiveLimit = req.query.limit ? limit : (employeeId ? 200 : limit);
    const paged = data.slice((page - 1) * effectiveLimit, page * effectiveLimit);
    res.json({ data: paged, meta: paginateMeta(total, page, effectiveLimit) });
}));
router.get("/my", asyncHandler(async (req, res) => {
    const data = await prisma.issuance.findMany({
        where: { employeeId: req.user.id, status: "issued" },
        include: { ppeItem: true, kit: true, location: true },
        orderBy: { issueDate: "desc" },
    });
    res.json(data);
}));
router.get("/:id", asyncHandler(async (req, res) => {
    const iss = await prisma.issuance.findUnique({ where: { id: req.params.id }, include: { ppeItem: true, kit: true, location: true, employee: true, returns: true } });
    if (!iss)
        throw new ApiError(404, "Issuance not found");
    res.json(iss);
}));
router.post("/", authorize("Admin", "HSE Supervisor", "Direct Supervisor", "Store Keeper"), validate(issuanceSchema), asyncHandler(async (req, res) => {
    const data = req.body;
    // Determine polymorphic: at least ppeItemId or kitId required
    if (!data.ppeItemId && !data.kitId)
        throw new ApiError(400, "Either ppeItemId or kitId required");
    if (data.ppeItemId && data.kitId)
        throw new ApiError(400, "Cannot provide both ppeItemId and kitId");
    if (!data.employeeId && !data.holderName)
        throw new ApiError(400, "Either employeeId or holderName required for loan");
    // signatures required
    if (!data.storeKeeperSignature || !data.receiverSignature)
        throw new ApiError(400, "Both signatures required");
    // Validate location allowed for item
    if (data.ppeItemId) {
        const ppe = await prisma.pPEItem.findUnique({ where: { id: data.ppeItemId }, include: { locations: true } });
        if (!ppe)
            throw new ApiError(404, "PPE Item not found");
        const allowed = ppe.locations.map(l => l.locationId);
        if (!allowed.includes(data.locationId))
            throw new ApiError(400, "Item not allowed at this location");
        // stock check
        const bal = await prisma.stockBalance.findFirst({ where: { ppeItemId: data.ppeItemId, locationId: data.locationId } });
        if (!bal || bal.quantityOnHand < data.quantity)
            throw new ApiError(400, "Insufficient stock");
        // batch check if provided
        if (data.batchNumber) {
            const batch = await prisma.batch.findFirst({ where: { batchNumber: data.batchNumber, ppeItemId: data.ppeItemId, locationId: data.locationId, status: "Active" } });
            if (!batch || batch.availableQty < data.quantity)
                throw new ApiError(400, "Insufficient batch quantity");
        }
        // compute replacement date if not provided
        if (!data.expectedReplacementDate) {
            data.expectedReplacementDate = computeReplacementDate(data.issueDate ? new Date(data.issueDate) : new Date(), ppe.lifespanType, ppe.lifespanValue);
        }
    }
    if (data.kitId) {
        const kit = await prisma.kit.findUnique({ where: { id: data.kitId }, include: { items: true } });
        if (!kit)
            throw new ApiError(404, "Kit not found");
        // check stock for each kit item
        for (const ki of kit.items) {
            const bal = await prisma.stockBalance.findFirst({ where: { ppeItemId: ki.ppeItemId, locationId: data.locationId } });
            if (!bal || bal.quantityOnHand < ki.qty * data.quantity)
                throw new ApiError(400, `Insufficient stock for kit item ${ki.ppeItemId}`);
        }
    }
    const issuance = await prisma.$transaction(async (tx) => {
        const iss = await tx.issuance.create({
            data: {
                employeeId: data.employeeId || null,
                holderName: data.holderName || null,
                holderType: data.holderType || null,
                ppeItemId: data.ppeItemId || null,
                kitId: data.kitId || null,
                locationId: data.locationId,
                quantity: data.quantity,
                batchNumber: data.batchNumber || null,
                variantKey: data.variantKey || null,
                issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
                expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
                expectedReplacementDate: data.expectedReplacementDate ? new Date(data.expectedReplacementDate) : null,
                storeKeeperSignature: data.storeKeeperSignature,
                receiverSignature: data.receiverSignature,
                status: "issued",
                issuedBy: req.user.id,
            },
        });
        // Deduct stock
        if (data.ppeItemId) {
            const bal = await tx.stockBalance.findFirst({ where: { ppeItemId: data.ppeItemId, locationId: data.locationId } });
            if (bal)
                await tx.stockBalance.update({ where: { id: bal.id }, data: { quantityOnHand: Math.max(0, bal.quantityOnHand - data.quantity) } });
            // deduct batch if provided
            if (data.batchNumber) {
                const batch = await tx.batch.findFirst({ where: { batchNumber: data.batchNumber, ppeItemId: data.ppeItemId, locationId: data.locationId } });
                if (batch)
                    await tx.batch.update({ where: { id: batch.id }, data: { availableQty: Math.max(0, batch.availableQty - data.quantity), quantity: Math.max(0, batch.quantity - data.quantity), status: batch.availableQty - data.quantity <= 0 ? "Depleted" : "Active" } });
            }
        }
        else if (data.kitId) {
            const kit = await tx.kit.findUnique({ where: { id: data.kitId }, include: { items: true } });
            if (kit) {
                for (const ki of kit.items) {
                    const bal = await tx.stockBalance.findFirst({ where: { ppeItemId: ki.ppeItemId, locationId: data.locationId } });
                    if (bal)
                        await tx.stockBalance.update({ where: { id: bal.id }, data: { quantityOnHand: Math.max(0, bal.quantityOnHand - ki.qty * data.quantity) } });
                }
            }
        }
        await tx.auditLog.create({ data: { entityType: "Issuance", entityId: iss.id, action: "ISSUED", details: `Issued ${data.quantity} of ${data.ppeItemId || data.kitId} at ${data.locationId}`, performedBy: req.user.id } });
        return iss;
    });
    res.status(201).json(issuance);
}));
router.post("/:id/return", authorize("Admin", "HSE Supervisor", "Direct Supervisor", "Store Keeper"), validate(issuanceReturnSchema), asyncHandler(async (req, res) => {
    const issuance = await prisma.issuance.findUnique({ where: { id: req.params.id }, include: { ppeItem: true } });
    if (!issuance)
        throw new ApiError(404, "Issuance not found");
    if (issuance.status !== "issued")
        throw new ApiError(400, "Only issued can be returned");
    const { condition, physicalReceiptConfirmed } = req.body;
    const isDamagedOrWornOut = condition === "damaged" || condition === "worn_out";
    const autoScrapped = isDamagedOrWornOut && physicalReceiptConfirmed;
    await prisma.$transaction(async (tx) => {
        await tx.issuance.update({ where: { id: issuance.id }, data: { status: "returned" } });
        await tx.issuanceReturn.create({
            data: {
                issuanceId: issuance.id,
                condition: condition,
                physicalReceiptConfirmed: !!physicalReceiptConfirmed,
                autoScrapped,
                returnedBy: req.user.id,
            },
        });
        if (condition === "good" && issuance.ppeItemId) {
            // restock to Used location if exists else original
            const usedLoc = await tx.location.findFirst({ where: { locationType: "Used" } });
            const targetId = usedLoc ? usedLoc.id : issuance.locationId;
            const bal = await tx.stockBalance.findFirst({ where: { ppeItemId: issuance.ppeItemId, locationId: targetId } });
            if (bal)
                await tx.stockBalance.update({ where: { id: bal.id }, data: { quantityOnHand: bal.quantityOnHand + issuance.quantity } });
            else
                await tx.stockBalance.create({ data: { ppeItemId: issuance.ppeItemId, locationId: targetId, quantityOnHand: issuance.quantity } });
        }
        else if (autoScrapped && issuance.ppeItemId) {
            const scrapLoc = await tx.location.findFirst({ where: { locationType: "Scrap" } });
            const locId = scrapLoc ? scrapLoc.id : issuance.locationId;
            const scrap = await tx.scrapEntry.create({
                data: {
                    ppeItemId: issuance.ppeItemId,
                    locationId: locId,
                    batchNumber: issuance.batchNumber,
                    quantity: issuance.quantity,
                    reason: `Returned condition: ${condition}`,
                    relatedReferenceId: issuance.id,
                    scrappedBy: req.user.id,
                },
            });
            await tx.auditLog.create({ data: { entityType: "Scrap", entityId: scrap.id, action: "AUTO_SCRAPPED", details: `Condition: ${condition}`, performedBy: req.user.id } });
        }
        await tx.auditLog.create({ data: { entityType: "Issuance", entityId: issuance.id, action: "RETURNED", details: `Condition: ${condition}`, performedBy: req.user.id } });
    });
    const updated = await prisma.issuance.findUnique({ where: { id: req.params.id } });
    res.json(updated);
}));
export default router;
