import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { attributeSchema } from "../schemas/entities.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleGuard.js";
import { parsePagination, paginateMeta } from "../utils/pagination.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const search = (req.query.search as string)?.toLowerCase();
  const includeDeleted = req.query.includeDeleted === "true";
  const where: any = {};
  if (!includeDeleted) where.deletedAt = null;
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { nameEn: { contains: search } },
      { nameAr: { contains: search } },
    ];
  }
  const total = await prisma.attribute.count({ where });
  const data = await prisma.attribute.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { values: { orderBy: { sortOrder: "asc" } } },
  });
  res.json({ data, meta: paginateMeta(total, page, limit) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const attr = await prisma.attribute.findUnique({ where: { id: req.params.id }, include: { values: true } });
  if (!attr) throw new ApiError(404, "Attribute not found");
  res.json(attr);
}));

router.post("/", authorize("Admin", "HSE Supervisor"), validate(attributeSchema), asyncHandler(async (req, res) => {
  const { values, ...rest } = req.body;
  if (!values || !Array.isArray(values) || values.length === 0) {
    throw new ApiError(400, "At least one attribute value is required");
  }
  const attr = await prisma.attribute.create({ data: rest });
  if (values?.length) {
    for (const v of values) {
      await prisma.attributeValue.create({ data: { attributeId: attr.id, value: v.value, sortOrder: v.sortOrder } });
    }
  }
  const full = await prisma.attribute.findUnique({ where: { id: attr.id }, include: { values: true } });
  await prisma.auditLog.create({
    data: {
      entityType: "Attribute",
      entityId: attr.id,
      action: "CREATED",
      performedBy: req.user!.id,
      afterValues: JSON.stringify(full),
    },
  });
  res.status(201).json(full);
}));

router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(attributeSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.attribute.findUnique({
    where: { id: req.params.id },
    include: { values: true },
  });
  if (!existing) throw new ApiError(404, "Attribute not found");

  const { values, adminOverrideReason, ...rest } = req.body;
  const incomingValues: Array<{ id?: string | null; value: string; sortOrder: number }> = values || [];

  // Match existing values by ID or by value string (case-insensitive) to prevent cascading data loss
  const existingValues = existing.values;
  const existingById = new Map<string, typeof existingValues[0]>();
  const existingByValue = new Map<string, typeof existingValues[0]>();
  for (const ev of existingValues) {
    existingById.set(ev.id, ev);
    existingByValue.set(ev.value.toLowerCase(), ev);
  }

  const matchedExistingIds = new Set<string>();
  const seenValues = new Set<string>();
  const valuesToCreate: Array<{ value: string; sortOrder: number }> = [];
  const valuesToUpdate: Array<{ id: string; value: string; sortOrder: number }> = [];

  for (const iv of incomingValues) {
    const valKey = iv.value.trim().toLowerCase();
    if (seenValues.has(valKey)) continue;
    seenValues.add(valKey);

    let matched: typeof existingValues[0] | undefined;
    if (iv.id && existingById.has(iv.id)) {
      matched = existingById.get(iv.id);
    } else if (existingByValue.has(valKey)) {
      const candidate = existingByValue.get(valKey)!;
      if (!matchedExistingIds.has(candidate.id)) {
        matched = candidate;
      }
    }

    if (matched) {
      matchedExistingIds.add(matched.id);
      valuesToUpdate.push({ id: matched.id, value: iv.value.trim(), sortOrder: iv.sortOrder });
    } else {
      valuesToCreate.push({ value: iv.value.trim(), sortOrder: iv.sortOrder });
    }
  }

  const removedValues = existingValues.filter(ev => !matchedExistingIds.has(ev.id));

  // In-use protection: verify if any removed value is referenced by active PPEItemVariantValue
  const inUseRemovedValues: Array<{ val: typeof existingValues[0]; inUseCount: number }> = [];
  for (const rv of removedValues) {
    const inUseCount = await prisma.pPEItemVariantValue.count({
      where: { attributeValueId: rv.id },
    });
    if (inUseCount > 0) {
      inUseRemovedValues.push({ val: rv, inUseCount });
    }
  }

  if (inUseRemovedValues.length > 0) {
    const isAdmin = req.user!.role === "Admin" || req.user!.role.replace(/_/g, " ") === "Admin";
    if (!isAdmin) {
      throw new ApiError(400, "Cannot remove attribute values in use by active PPE items without Admin override");
    }
    if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
      throw new ApiError(400, "Admin override reason is required to remove attribute values currently in use by PPE items");
    }
  }

  // Atomic database mutations
  await prisma.$transaction(async (tx) => {
    // 1. Update parent attribute
    await tx.attribute.update({
      where: { id: req.params.id },
      data: rest,
    });

    // 2. Delete removed values
    for (const rv of removedValues) {
      await tx.attributeValue.delete({ where: { id: rv.id } });
    }

    // 3. Update existing matched values in-place (preserves IDs and foreign key relations)
    for (const uv of valuesToUpdate) {
      await tx.attributeValue.update({
        where: { id: uv.id },
        data: { value: uv.value, sortOrder: uv.sortOrder },
      });
    }

    // 4. Create new values
    for (const cv of valuesToCreate) {
      await tx.attributeValue.create({
        data: {
          attributeId: req.params.id,
          value: cv.value,
          sortOrder: cv.sortOrder,
        },
      });
    }
  });

  // Log in-use value removals with Admin override
  for (const item of inUseRemovedValues) {
    await prisma.auditLog.create({
      data: {
        entityType: "AttributeValue",
        entityId: item.val.id,
        action: "OVERRIDE_DELETE",
        performedBy: req.user!.id,
        reason: adminOverrideReason!.trim(),
        details: `Removed in-use attribute value '${item.val.value}' (${item.val.id}) from attribute '${existing.code}' with Admin override. Affected ${item.inUseCount} item variant links.`,
        beforeValues: JSON.stringify(item.val),
      },
    });
  }

  const full = await prisma.attribute.findUnique({
    where: { id: req.params.id },
    include: { values: { orderBy: { sortOrder: "asc" } } },
  });

  // Global Rule G1: Record beforeValues and afterValues JSON snapshots
  await prisma.auditLog.create({
    data: {
      entityType: "Attribute",
      entityId: full!.id,
      action: inUseRemovedValues.length > 0 ? "OVERRIDE_UPDATE" : "UPDATED",
      performedBy: req.user!.id,
      reason: adminOverrideReason ? adminOverrideReason.trim() : undefined,
      beforeValues: JSON.stringify(existing),
      afterValues: JSON.stringify(full),
    },
  });

  res.json(full);
}));

async function checkAttributeInUse(id: string) {
  const activeGroups = await prisma.itemGroupAttribute.count({
    where: { attributeId: id, itemGroup: { deletedAt: null, active: true } },
  });
  const activeItemVariants = await prisma.pPEItemVariantValue.count({
    where: { attributeValue: { attributeId: id }, ppeItem: { deletedAt: null, active: true } },
  });
  return { inUse: activeGroups > 0 || activeItemVariants > 0, activeGroups, activeItemVariants };
}

router.get("/:id/in-use", asyncHandler(async (req, res) => {
  const check = await checkAttributeInUse(req.params.id);
  res.json({
    inUse: check.inUse,
    activeGroupCount: check.activeGroups,
    activeVariantCount: check.activeItemVariants,
  });
}));

router.patch("/:id/active", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
  const { active, adminOverrideReason } = req.body;
  if (typeof active !== "boolean") throw new ApiError(400, "active boolean required");
  if (!active) {
    const inUseCheck = await checkAttributeInUse(req.params.id);
    if (inUseCheck.inUse) {
      const isAdmin = req.user!.role === "Admin" || req.user!.role.replace(/_/g, " ") === "Admin";
      if (!isAdmin) {
        throw new ApiError(400, "Cannot deactivate in-use Attribute without Admin override");
      }
      if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
        throw new ApiError(400, "Admin override reason is required to deactivate in-use Attribute");
      }
      const existing = await prisma.attribute.findUnique({ where: { id: req.params.id } });
      const attr = await prisma.attribute.update({ where: { id: req.params.id }, data: { active } });
      await prisma.auditLog.create({
        data: {
          entityType: "Attribute",
          entityId: attr.id,
          action: "OVERRIDE_DEACTIVATE",
          performedBy: req.user!.id,
          reason: adminOverrideReason.trim(),
          beforeValues: JSON.stringify(existing),
          afterValues: JSON.stringify(attr),
        },
      });
      return res.json(attr);
    }
  }
  const existing = await prisma.attribute.findUnique({ where: { id: req.params.id } });
  const attr = await prisma.attribute.update({ where: { id: req.params.id }, data: { active } });
  await prisma.auditLog.create({
    data: {
      entityType: "Attribute",
      entityId: attr.id,
      action: active ? "ACTIVATED" : "DEACTIVATED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(existing),
      afterValues: JSON.stringify(attr),
    },
  });
  res.json(attr);
}));

router.delete("/:id", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
  const attr = await prisma.attribute.findUnique({ where: { id: req.params.id } });
  if (!attr) throw new ApiError(404, "Not found");

  const { adminOverrideReason } = req.body || {};
  const inUseCheck = await checkAttributeInUse(req.params.id);
  if (inUseCheck.inUse) {
    const isAdmin = req.user!.role === "Admin" || req.user!.role.replace(/_/g, " ") === "Admin";
    if (!isAdmin) {
      throw new ApiError(400, "Cannot delete in-use Attribute without Admin override");
    }
    if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
      throw new ApiError(400, "Admin override reason is required to delete in-use Attribute");
    }
    await prisma.attribute.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
    await prisma.auditLog.create({
      data: {
        entityType: "Attribute",
        entityId: req.params.id,
        action: "OVERRIDE_DELETE",
        performedBy: req.user!.id,
        reason: adminOverrideReason.trim(),
        beforeValues: JSON.stringify(attr),
      },
    });
    return res.json({ message: "Soft deleted with Admin override" });
  }

  await prisma.attribute.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
  await prisma.auditLog.create({
    data: {
      entityType: "Attribute",
      entityId: req.params.id,
      action: "SOFT_DELETED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(attr),
    },
  });
  res.json({ message: "Soft deleted" });
}));

router.post("/:id/restore", authorize("Admin"), asyncHandler(async (req, res) => {
  const existing = await prisma.attribute.findUnique({ where: { id: req.params.id }, include: { values: true } });
  const attr = await prisma.attribute.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null }, include: { values: true } });
  await prisma.auditLog.create({
    data: {
      entityType: "Attribute",
      entityId: attr.id,
      action: "RESTORED",
      performedBy: req.user!.id,
      beforeValues: existing ? JSON.stringify(existing) : undefined,
      afterValues: JSON.stringify(attr),
    },
  });
  res.json(attr);
}));

export default router;
