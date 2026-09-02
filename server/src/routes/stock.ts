import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { stockAdjustmentSchema, stockAdjustmentReviewSchema, transferSchema } from "../schemas/entities.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleGuard.js";
import { parsePagination, paginateMeta } from "../utils/pagination.js";
import { generateReference } from "../utils/helpers.js";

const router = Router();
router.use(authenticate);

// Stock Balances
router.get("/balances", asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const ppeItemId = req.query.ppeItemId as string;
  const locationId = req.query.locationId as string;
  const search = req.query.search as string;
  const status = req.query.status as string; // all | low_stock | out_of_stock | in_stock

  // StoreKeeper scoping: limit to assigned locations
  let allowedLocationIds: string[] | null = null;
  const user = await prisma.employee.findUnique({ where: { id: req.user!.id }, select: { role: true } });
  const isStoreKeeper = (user?.role as string) === "Store_Keeper" || (user?.role as string) === "Store Keeper";
  if (isStoreKeeper) {
    const links = await prisma.locationStoreKeeper.findMany({ where: { employeeId: req.user!.id } });
    allowedLocationIds = links.map(l => l.locationId);
    // if no assigned locations, return empty
    if (allowedLocationIds.length === 0) return res.json({ data: [], meta: paginateMeta(0, page, limit) });
  }

  const where: any = {};
  if (ppeItemId) where.ppeItemId = ppeItemId;
  if (locationId) where.locationId = locationId;
  if (allowedLocationIds && !locationId) where.locationId = { in: allowedLocationIds };
  if (allowedLocationIds && locationId && !allowedLocationIds.includes(locationId)) {
    return res.json({ data: [], meta: paginateMeta(0, page, limit) });
  }

  // fetch all matching then filter by search/status which need PPE info
  let balances = await prisma.stockBalance.findMany({
    where,
    include: { ppeItem: true, location: true },
    orderBy: { updatedAt: "desc" },
  });

  if (search) {
    const s = search.toLowerCase();
    balances = balances.filter(b => b.ppeItem.itemCode.toLowerCase().includes(s) || b.ppeItem.nameEn.toLowerCase().includes(s) || b.ppeItem.nameAr.includes(s));
  }

  if (status && status !== "all") {
    balances = balances.filter(b => {
      const reorder = b.ppeItem.reorderLevel;
      if (status === "out_of_stock") return b.quantityOnHand === 0;
      if (status === "low_stock") return b.quantityOnHand > 0 && b.quantityOnHand <= reorder;
      if (status === "in_stock") return b.quantityOnHand > reorder;
      return true;
    });
  }

  const total = balances.length;
  const paged = balances.slice((page - 1) * limit, page * limit);
  res.json({ data: paged, meta: paginateMeta(total, page, limit) });
}));

// Batches
router.get("/batches", asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const ppeItemId = req.query.ppeItemId as string;
  const locationId = req.query.locationId as string;
  const status = req.query.status as string;
  const batchNumber = req.query.batchNumber as string;
  const where: any = {};
  if (ppeItemId) where.ppeItemId = ppeItemId;
  if (locationId) where.locationId = locationId;
  if (status) where.status = status as any;
  if (batchNumber) where.batchNumber = { contains: batchNumber };
  const total = await prisma.batch.count({ where });
  const data = await prisma.batch.findMany({
    where,
    include: { ppeItem: true, location: true },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "asc" }, // FIFO oldest first
  });
  res.json({ data, meta: paginateMeta(total, page, limit) });
}));

// Stock Movements (transfers etc)
router.get("/movements", asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const type = req.query.type as string;
  const where: any = {};
  if (type) where.type = type as any;
  const total = await prisma.stockMovement.count({ where });
  const data = await prisma.stockMovement.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { ppeItem: true, location: true, toLocation: true, creator: true },
  });
  res.json({ data, meta: paginateMeta(total, page, limit) });
}));

// Stock Adjustments
router.get("/adjustments", asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const status = req.query.status as string;
  const locationId = req.query.locationId as string;
  const where: any = {};
  if (status && status !== "all") where.status = status as any;
  if (locationId) where.locationId = locationId;

  // store keeper scoping
  let allowedLocationIds: string[] | null = null;
  const user = await prisma.employee.findUnique({ where: { id: req.user!.id }, select: { role: true } });
  const isStoreKeeper = (user?.role as string) === "Store_Keeper";
  if (isStoreKeeper) {
    const links = await prisma.locationStoreKeeper.findMany({ where: { employeeId: req.user!.id } });
    allowedLocationIds = links.map(l => l.locationId);
    if (allowedLocationIds.length === 0) return res.json({ data: [], meta: paginateMeta(0, page, limit) });
    if (!locationId) where.locationId = { in: allowedLocationIds };
    else if (!allowedLocationIds.includes(locationId)) return res.json({ data: [], meta: paginateMeta(0, page, limit) });
  }

  const total = await prisma.stockAdjustment.count({ where });
  const data = await prisma.stockAdjustment.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { ppeItem: true, location: true, submitter: true, reviewer: true },
  });
  res.json({ data, meta: paginateMeta(total, page, limit) });
}));

router.post("/adjustments", authorize("Admin", "HSE Supervisor", "Store Keeper"), validate(stockAdjustmentSchema), asyncHandler(async (req, res) => {
  const { ppeItemId, locationId, batchNumber, quantityDelta, type, reasonCategory, reason } = req.body;

  if (!quantityDelta || quantityDelta === 0) {
    throw new ApiError(400, "Quantity delta cannot be zero");
  }
  if (type === "IN" && quantityDelta <= 0) {
    throw new ApiError(400, "Stock IN quantity delta must be positive");
  }

  // store keeper scoping: verify assignment to location
  const user = await prisma.employee.findUnique({ where: { id: req.user!.id }, select: { role: true } });
  const isStoreKeeper = (user?.role as string) === "Store_Keeper" || (user?.role as string) === "Store Keeper";
  if (isStoreKeeper) {
    const link = await prisma.locationStoreKeeper.findFirst({ where: { employeeId: req.user!.id, locationId } });
    if (!link) {
      throw new ApiError(403, "Store Keeper not assigned to this location");
    }
  }

  // Validate quantities for OUT
  const delta = type === "OUT" ? -Math.abs(quantityDelta) : Math.abs(quantityDelta);
  let reference = generateReference(`ADJ-${type}-PPE`);
  // ensure unique
  let exists = await prisma.stockAdjustment.findUnique({ where: { reference } });
  let attempts = 0;
  while (exists && attempts < 5) {
    reference = generateReference(`ADJ-${type}-PPE`);
    exists = await prisma.stockAdjustment.findUnique({ where: { reference } });
    attempts++;
  }

  const ppeItem = await prisma.pPEItem.findUnique({ where: { id: ppeItemId } });
  if (!ppeItem) throw new ApiError(404, "PPE Item not found");

  // Rule G14: Only Risk Category III adjustments (or Manual Corrections) need HSE Supervisor approval
  const isCategoryIII = ppeItem.riskCategory === "III";
  const isManualCorrection = reasonCategory === "Manual Correction";
  const status = (isManualCorrection || isCategoryIII) ? "pending" : "applied";

  const adjustment = await prisma.stockAdjustment.create({
    data: {
      reference,
      type: type as any,
      ppeItemId,
      locationId,
      batchNumber,
      quantityDelta: delta,
      reasonCategory,
      reason,
      status: status as any,
      submittedBy: req.user!.id,
    },
  });

  if (status === "applied") {
    // apply immediately transaction similar to useStore adjustStock applied
    await prisma.$transaction(async (tx) => {
      // update stock balance
      const bal = await tx.stockBalance.findFirst({ where: { ppeItemId, locationId } });
      if (bal) {
        await tx.stockBalance.update({ where: { id: bal.id }, data: { quantityOnHand: Math.max(0, bal.quantityOnHand + delta) } });
      } else if (delta > 0) {
        await tx.stockBalance.create({ data: { ppeItemId, locationId, quantityOnHand: delta } });
      }
      // batch handling
      const batch = await tx.batch.findFirst({ where: { batchNumber, ppeItemId, locationId } });
      if (batch) {
        const newAvailable = Math.max(0, batch.availableQty + delta);
        const newQty = batch.quantity + (delta > 0 ? delta : 0);
        await tx.batch.update({ where: { id: batch.id }, data: { availableQty: newAvailable, quantity: newQty, status: newAvailable <= 0 ? "Depleted" : "Active" } });
      } else if (delta > 0) {
        await tx.batch.create({
          data: {
            batchNumber,
            ppeItemId,
            locationId,
            quantity: delta,
            availableQty: delta,
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
            status: "Active",
          },
        });
      }
      await tx.auditLog.create({
        data: { entityType: "StockAdjustment", entityId: adjustment.id, action: "APPLIED", details: `Quantity delta: ${delta}`, performedBy: req.user!.id },
      });
      await tx.stockMovement.create({
        data: {
          type: "adjustment",
          ppeItemId,
          locationId,
          quantity: Math.abs(delta),
          reason: `${reasonCategory}: ${reason}`,
          reference,
          createdBy: req.user!.id,
        },
      });
    });
  }

  const full = await prisma.stockAdjustment.findUnique({ where: { id: adjustment.id }, include: { ppeItem: true, location: true } });
  res.status(201).json(full);
}));

router.patch("/adjustments/:id/review", authorize("Admin", "HSE Supervisor"), validate(stockAdjustmentReviewSchema), asyncHandler(async (req, res) => {
  const { status } = req.body; // approved or rejected
  const adj = await prisma.stockAdjustment.findUnique({ where: { id: req.params.id } });
  if (!adj) throw new ApiError(404, "Adjustment not found");
  if (adj.status !== "pending") throw new ApiError(400, "Only pending can be reviewed");

  const newStatus = status === "approved" ? "approved" : "rejected";
  await prisma.stockAdjustment.update({ where: { id: req.params.id }, data: { status: newStatus as any, reviewedBy: req.user!.id } });

  if (status === "approved") {
    await prisma.$transaction(async (tx) => {
      const delta = adj.quantityDelta;
      const bal = await tx.stockBalance.findFirst({ where: { ppeItemId: adj.ppeItemId, locationId: adj.locationId } });
      if (bal) {
        await tx.stockBalance.update({ where: { id: bal.id }, data: { quantityOnHand: Math.max(0, bal.quantityOnHand + delta) } });
      } else if (delta > 0) {
        await tx.stockBalance.create({ data: { ppeItemId: adj.ppeItemId, locationId: adj.locationId, quantityOnHand: delta } });
      }
      const batch = await tx.batch.findFirst({ where: { batchNumber: adj.batchNumber, ppeItemId: adj.ppeItemId, locationId: adj.locationId } });
      if (batch) {
        const newAvail = Math.max(0, batch.availableQty + delta);
        await tx.batch.update({ where: { id: batch.id }, data: { availableQty: newAvail, quantity: batch.quantity + (delta > 0 ? delta : 0), status: newAvail <= 0 ? "Depleted" : "Active" } });
      } else if (delta > 0) {
        await tx.batch.create({
          data: {
            batchNumber: adj.batchNumber || `B-${Date.now()}`,
            ppeItemId: adj.ppeItemId,
            locationId: adj.locationId,
            quantity: delta,
            availableQty: delta,
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
            status: "Active",
          },
        });
      }
      await tx.auditLog.create({ data: { entityType: "StockAdjustment", entityId: adj.id, action: status.toUpperCase(), performedBy: req.user!.id } });
    });
  } else {
    await prisma.auditLog.create({ data: { entityType: "StockAdjustment", entityId: adj.id, action: "REJECTED", performedBy: req.user!.id } });
  }

  const updated = await prisma.stockAdjustment.findUnique({ where: { id: req.params.id }, include: { ppeItem: true, location: true } });
  res.json(updated);
}));

// Transfers
router.post("/transfers", authorize("Admin", "HSE Supervisor", "Store Keeper"), validate(transferSchema), asyncHandler(async (req, res) => {
  const { ppeItemId, fromLocationId, toLocationId, batchNumber, quantity } = req.body;
  if (fromLocationId === toLocationId) throw new ApiError(400, "From and To locations must differ");

  // guard: Rule G6 transfer rules
  const fromLoc = await prisma.location.findUnique({ where: { id: fromLocationId } });
  const toLoc = await prisma.location.findUnique({ where: { id: toLocationId } });
  if (!fromLoc || !toLoc) throw new ApiError(404, "Location not found");

  // Rule G6: Used to New transfers are blocked
  if (fromLoc.stockCondition === "Used" && toLoc.stockCondition === "New") {
    throw new ApiError(400, "Used to New transfers are blocked");
  }
  // Rule G6: Nothing leaves a Scrap location
  if (fromLoc.stockCondition === "Scrap" || fromLoc.locationType === "Scrap") {
    throw new ApiError(400, "Nothing leaves a Scrap location");
  }
  // Rule G6: Cannot transfer into Scrap
  if (toLoc.stockCondition === "Scrap" || toLoc.locationType === "Scrap") {
    throw new ApiError(400, "Cannot transfer directly into Scrap location; items enter Scrap only via return or write-off");
  }

  // mimic TransferForm guard: cannot transfer from Scrap/Used to General/Central/Site
  const fromType = fromLoc.locationType as string;
  const toType = toLoc.locationType as string;
  if ((fromType === "Scrap" || fromType === "Used") && (toType === "General" || toType === "Central_Warehouse" || toType === "Site_Store")) {
    throw new ApiError(400, "Cannot transfer from Scrap/Used to General/Central/Site");
  }

  const result = await prisma.$transaction(async (tx) => {
    const fromBal = await tx.stockBalance.findFirst({ where: { ppeItemId, locationId: fromLocationId } });
    if (!fromBal || fromBal.quantityOnHand < quantity) throw new ApiError(400, "Insufficient stock at source");

    await tx.stockBalance.update({ where: { id: fromBal.id }, data: { quantityOnHand: fromBal.quantityOnHand - quantity } });

    const toBal = await tx.stockBalance.findFirst({ where: { ppeItemId, locationId: toLocationId } });
    if (toBal) {
      await tx.stockBalance.update({ where: { id: toBal.id }, data: { quantityOnHand: toBal.quantityOnHand + quantity } });
    } else {
      await tx.stockBalance.create({ data: { ppeItemId, locationId: toLocationId, quantityOnHand: quantity } });
    }

    const sourceBatch = await tx.batch.findFirst({ where: { batchNumber, ppeItemId, locationId: fromLocationId } });
    if (!sourceBatch || sourceBatch.availableQty < quantity) throw new ApiError(400, "Insufficient batch quantity");
    await tx.batch.update({
      where: { id: sourceBatch.id },
      data: {
        availableQty: sourceBatch.availableQty - quantity,
        quantity: sourceBatch.quantity - quantity,
        status: sourceBatch.availableQty - quantity <= 0 ? "Depleted" : "Active",
      },
    });

    const targetBatch = await tx.batch.findFirst({ where: { batchNumber, ppeItemId, locationId: toLocationId } });
    if (targetBatch) {
      await tx.batch.update({
        where: { id: targetBatch.id },
        data: { availableQty: targetBatch.availableQty + quantity, quantity: targetBatch.quantity + quantity, status: "Active" },
      });
    } else {
      await tx.batch.create({
        data: {
          batchNumber,
          ppeItemId,
          locationId: toLocationId,
          quantity,
          availableQty: quantity,
          expiryDate: sourceBatch.expiryDate,
          costPerUnit: sourceBatch.costPerUnit,
          status: "Active",
        },
      });
    }

    const reference = generateReference("TRF");
    const movement = await tx.stockMovement.create({
      data: {
        type: "transfer",
        ppeItemId,
        locationId: fromLocationId,
        toLocationId,
        quantity,
        reason: "Location Transfer",
        reference,
        createdBy: req.user!.id,
      },
    });
    await tx.auditLog.create({
      data: { entityType: "Transfer", entityId: reference, action: "TRANSFERRED", details: `Transferred ${quantity} of ${ppeItemId} from ${fromLocationId} to ${toLocationId}`, performedBy: req.user!.id },
    });
    return movement;
  });

  res.status(201).json(result);
}));

export default router;
