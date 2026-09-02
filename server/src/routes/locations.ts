import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { locationSchema } from "../schemas/entities.js";
import { authenticate } from "../middleware/auth.js";
import { authorize, getScopedLocationIds } from "../middleware/roleGuard.js";
import { parsePagination, paginateMeta } from "../utils/pagination.js";
import { normalizeLocationType, denormalizeLocationType } from "../utils/helpers.js";

const router = Router();
router.use(authenticate);

async function checkLocationHardBlock(locationId: string): Promise<{ blocked: boolean; reason?: string }> {
  const loc = await prisma.location.findUnique({ where: { id: locationId } });
  if (!loc) return { blocked: false };

  // 1. Holding stock > 0 (Scrap locations exempt)
  const totalStock = await prisma.stockBalance.aggregate({
    where: { locationId, quantityOnHand: { gt: 0 } },
    _sum: { quantityOnHand: true },
  });
  if ((totalStock._sum.quantityOnHand || 0) > 0 && loc.stockCondition !== "Scrap") {
    return {
      blocked: true,
      reason: `Cannot deactivate or delete location holding stock (${totalStock._sum.quantityOnHand} units on hand). Scrap locations are exempt; transfer or zero out stock first.`,
    };
  }

  // 2. Sole location of active catalog item
  const itemLinks = await prisma.pPEItemLocation.findMany({
    where: { locationId },
    include: { ppeItem: true },
  });
  for (const link of itemLinks) {
    if (link.ppeItem.active && !link.ppeItem.deletedAt) {
      const otherActiveLocations = await prisma.pPEItemLocation.count({
        where: {
          ppeItemId: link.ppeItemId,
          locationId: { not: locationId },
          location: { active: true, deletedAt: null },
        },
      });
      if (otherActiveLocations === 0) {
        return {
          blocked: true,
          reason: `Cannot deactivate or delete location: it is the sole active location assigned to active PPE item ${link.ppeItem.itemCode}.`,
        };
      }
    }
  }

  // 3. Open loans
  const openLoans = await prisma.issuance.count({
    where: {
      locationId,
      holderType: { in: ["Visitor", "Contractor"] },
      status: { in: ["issued", "Active", "Open"] },
    },
  });
  if (openLoans > 0) {
    return {
      blocked: true,
      reason: `Cannot deactivate or delete location: ${openLoans} active open loan(s) are assigned to this location.`,
    };
  }

  return { blocked: false };
}

router.get("/", asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const search = (req.query.search as string)?.toLowerCase();
  const siteFilter = req.query.site as string;
  const typeFilter = req.query.locationType as string;
  const conditionFilter = req.query.stockCondition as string;
  const activeFilter = req.query.active as string;
  const includeDeleted = req.query.includeDeleted === "true";
  const where: any = {};
  if (!includeDeleted) where.deletedAt = null;
  if (activeFilter === "true") where.active = true;
  if (activeFilter === "false") where.active = false;
  if (siteFilter) where.site = siteFilter;
  if (typeFilter) where.locationType = normalizeLocationType(typeFilter) as any;
  if (conditionFilter) where.stockCondition = conditionFilter;
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { nameEn: { contains: search } },
      { nameAr: { contains: search } },
    ];
  }

  // Scoping for Store Keeper: assigned locations only
  const scopedLocationIds = await getScopedLocationIds(req.user!.id, prisma);
  if (scopedLocationIds !== null) {
    where.id = { in: scopedLocationIds };
  }

  const total = await prisma.location.count({ where });
  const data = await prisma.location.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { assignedStoreKeepers: { include: { employee: true } } },
  });
  const mapped = data.map(l => ({
    ...l,
    locationType: denormalizeLocationType(l.locationType as string),
    assignedStoreKeeperIds: l.assignedStoreKeepers.map(a => a.employeeId),
  }));
  res.json({ data: mapped, meta: paginateMeta(total, page, limit) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  // Scoping for Store Keeper: assigned locations only
  const scopedLocationIds = await getScopedLocationIds(req.user!.id, prisma);
  if (scopedLocationIds !== null && !scopedLocationIds.includes(req.params.id)) {
    throw new ApiError(403, "Forbidden: Store Keeper not assigned to this location");
  }

  const loc = await prisma.location.findUnique({
    where: { id: req.params.id },
    include: { assignedStoreKeepers: true },
  });
  if (!loc) throw new ApiError(404, "Location not found");
  res.json({
    ...loc,
    locationType: denormalizeLocationType(loc.locationType as string),
    assignedStoreKeeperIds: loc.assignedStoreKeepers.map(a => a.employeeId),
  });
}));

router.get("/:id/in-use", asyncHandler(async (req, res) => {
  const check = await checkLocationHardBlock(req.params.id);
  const totalStock = await prisma.stockBalance.aggregate({
    where: { locationId: req.params.id, quantityOnHand: { gt: 0 } },
    _sum: { quantityOnHand: true },
  });
  const loc = await prisma.location.findUnique({ where: { id: req.params.id } });
  res.json({
    inUse: check.blocked,
    reason: check.reason || null,
    stockCondition: loc?.stockCondition || "New",
    quantityOnHand: totalStock._sum.quantityOnHand || 0,
  });
}));

router.post("/", authorize("Admin", "HSE Supervisor"), validate(locationSchema), asyncHandler(async (req, res) => {
  const { assignedStoreKeeperIds, locationType, adminOverrideReason, ...rest } = req.body;
  const normalized = normalizeLocationType(locationType);
  const loc = await prisma.location.create({
    data: { ...rest, locationType: normalized as any },
  });
  if (assignedStoreKeeperIds?.length) {
    for (const empId of assignedStoreKeeperIds) {
      await prisma.locationStoreKeeper.create({ data: { locationId: loc.id, employeeId: empId } });
    }
  }
  await prisma.auditLog.create({
    data: {
      entityType: "Location",
      entityId: loc.id,
      action: "CREATED",
      performedBy: req.user!.id,
      afterValues: JSON.stringify(loc),
    },
  });
  res.status(201).json(loc);
}));

router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(locationSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.location.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Location not found");

  const { assignedStoreKeeperIds, locationType, adminOverrideReason, ...rest } = req.body;
  const normalized = normalizeLocationType(locationType);

  // Rule G2: Location deactivation hard block check
  if (rest.active === false && existing.active === true) {
    const hardBlock = await checkLocationHardBlock(req.params.id);
    if (hardBlock.blocked) {
      throw new ApiError(400, hardBlock.reason!);
    }
  }

  // Rule G6: Lock Code and Stock Condition once stock exists
  const hasStockBalances = await prisma.stockBalance.count({
    where: { locationId: req.params.id, quantityOnHand: { gt: 0 } },
  });
  const hasBatches = await prisma.batch.count({ where: { locationId: req.params.id } });
  const stockExists = hasStockBalances > 0 || hasBatches > 0;

  if (stockExists) {
    if (rest.code && rest.code !== existing.code) {
      throw new ApiError(400, "Location code is locked and cannot be changed once stock exists");
    }
    if (rest.stockCondition && rest.stockCondition !== existing.stockCondition) {
      throw new ApiError(400, "Stock condition is locked and cannot be changed once stock exists");
    }
  }

  const loc = await prisma.location.update({
    where: { id: req.params.id },
    data: { ...rest, locationType: normalized as any },
  });

  // sync keepers
  await prisma.locationStoreKeeper.deleteMany({ where: { locationId: req.params.id } });
  if (assignedStoreKeeperIds?.length) {
    for (const empId of assignedStoreKeeperIds) {
      await prisma.locationStoreKeeper.create({ data: { locationId: loc.id, employeeId: empId } });
    }
  }

  await prisma.auditLog.create({
    data: {
      entityType: "Location",
      entityId: loc.id,
      action: "UPDATED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(existing),
      afterValues: JSON.stringify(loc),
    },
  });
  res.json(loc);
}));

router.patch("/:id/active", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
  const { active } = req.body;
  if (typeof active !== "boolean") throw new ApiError(400, "active required");

  if (!active) {
    const hardBlock = await checkLocationHardBlock(req.params.id);
    if (hardBlock.blocked) {
      throw new ApiError(400, hardBlock.reason!);
    }
  }

  const existing = await prisma.location.findUnique({ where: { id: req.params.id } });
  const loc = await prisma.location.update({ where: { id: req.params.id }, data: { active } });
  await prisma.auditLog.create({
    data: {
      entityType: "Location",
      entityId: loc.id,
      action: active ? "ACTIVATED" : "DEACTIVATED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(existing),
      afterValues: JSON.stringify(loc),
    },
  });
  res.json({ ...loc, locationType: denormalizeLocationType(loc.locationType as string) });
}));

router.delete("/:id", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
  const hardBlock = await checkLocationHardBlock(req.params.id);
  if (hardBlock.blocked) {
    throw new ApiError(400, hardBlock.reason!);
  }

  const existing = await prisma.location.findUnique({ where: { id: req.params.id } });
  await prisma.location.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
  await prisma.auditLog.create({
    data: {
      entityType: "Location",
      entityId: req.params.id,
      action: "SOFT_DELETED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(existing),
    },
  });
  res.json({ message: "Soft deleted" });
}));

router.post("/:id/restore", authorize("Admin"), asyncHandler(async (req, res) => {
  const existing = await prisma.location.findUnique({ where: { id: req.params.id } });
  const loc = await prisma.location.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null } });
  await prisma.auditLog.create({
    data: {
      entityType: "Location",
      entityId: loc.id,
      action: "RESTORED",
      performedBy: req.user!.id,
      beforeValues: existing ? JSON.stringify(existing) : undefined,
      afterValues: JSON.stringify(loc),
    },
  });
  res.json(loc);
}));

export default router;
