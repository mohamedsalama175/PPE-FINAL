import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { itemGroupSchema } from "../schemas/entities.js";
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
  if (search) where.OR = [{ code: { contains: search } }, { nameEn: { contains: search } }, { nameAr: { contains: search } }];
  const total = await prisma.itemGroup.count({ where });
  const data = await prisma.itemGroup.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { attributes: { include: { attribute: true } } },
  });
  const mapped = data.map(g => ({ ...g, attributeIds: g.attributes.map(a => a.attributeId) }));
  res.json({ data: mapped, meta: paginateMeta(total, page, limit) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const g = await prisma.itemGroup.findUnique({ where: { id: req.params.id }, include: { attributes: true } });
  if (!g) throw new ApiError(404, "Not found");
  res.json({ ...g, attributeIds: g.attributes.map(a => a.attributeId) });
}));

router.post("/", authorize("Admin", "HSE Supervisor"), validate(itemGroupSchema), asyncHandler(async (req, res) => {
  const { attributeIds, ...rest } = req.body;
  const g = await prisma.itemGroup.create({ data: rest });
  if (attributeIds?.length) {
    for (const aid of attributeIds) {
      await prisma.itemGroupAttribute.create({ data: { itemGroupId: g.id, attributeId: aid } });
    }
  }
  const full = await prisma.itemGroup.findUnique({
    where: { id: g.id },
    include: { attributes: { include: { attribute: true } } },
  });
  await prisma.auditLog.create({
    data: {
      entityType: "ItemGroup",
      entityId: g.id,
      action: "CREATED",
      performedBy: req.user!.id,
      afterValues: JSON.stringify(full || g),
    },
  });
  res.status(201).json(full ? { ...full, attributeIds: full.attributes.map(a => a.attributeId) } : g);
}));

router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(itemGroupSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.itemGroup.findUnique({
    where: { id: req.params.id },
    include: {
      attributes: { include: { attribute: true } },
    },
  });
  if (!existing) throw new ApiError(404, "Item Group not found");

  const { attributeIds, adminOverrideReason, ...rest } = req.body;
  const newAttrIds: string[] = attributeIds || [];
  const currentAttrIds = existing.attributes.map(a => a.attributeId);
  const removedAttrIds = currentAttrIds.filter(id => !newAttrIds.includes(id));

  // PPE-014: Check if any unticked attribute has saved item values in this group
  type AffectedItemValue = {
    id: string;
    ppeItemId: string;
    itemCode: string;
    attributeId: string;
    attributeCode: string;
    attributeValueId: string;
    value: string;
  };

  const inUseRemovedAttrs: Array<{
    attributeId: string;
    attributeCode: string;
    attributeNameEn: string;
    affectedValues: AffectedItemValue[];
  }> = [];

  for (const removedId of removedAttrIds) {
    const affected = await prisma.pPEItemVariantValue.findMany({
      where: {
        ppeItem: {
          itemGroupId: req.params.id,
          deletedAt: null,
        },
        attributeValue: {
          attributeId: removedId,
        },
      },
      include: {
        ppeItem: { select: { id: true, itemCode: true } },
        attributeValue: { select: { id: true, value: true, attribute: { select: { id: true, code: true, nameEn: true } } } },
      },
    });

    if (affected.length > 0) {
      const firstAttr = affected[0].attributeValue.attribute;
      inUseRemovedAttrs.push({
        attributeId: removedId,
        attributeCode: firstAttr.code,
        attributeNameEn: firstAttr.nameEn,
        affectedValues: affected.map(a => ({
          id: a.id,
          ppeItemId: a.ppeItemId,
          itemCode: a.ppeItem.itemCode,
          attributeId: removedId,
          attributeCode: firstAttr.code,
          attributeValueId: a.attributeValueId,
          value: a.attributeValue.value,
        })),
      });
    }
  }

  // If in-use attributes are being unticked, enforce Admin override gate
  if (inUseRemovedAttrs.length > 0) {
    const isAdmin = req.user!.role === "Admin" || req.user!.role.replace(/_/g, " ") === "Admin";
    if (!isAdmin) {
      throw new ApiError(400, "Cannot remove in-use attributes from Item Group without Admin override");
    }
    if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
      throw new ApiError(400, "Admin override reason is required to untick attributes in use by catalog items");
    }
  }

  // Atomic database mutations
  const allAffectedVariantIds = inUseRemovedAttrs.flatMap(r => r.affectedValues.map(v => v.id));

  await prisma.$transaction(async (tx) => {
    // 1. Update item group details
    await tx.itemGroup.update({
      where: { id: req.params.id },
      data: rest,
    });

    // 2. Synchronize item group attributes
    await tx.itemGroupAttribute.deleteMany({ where: { itemGroupId: req.params.id } });
    for (const aid of newAttrIds) {
      await tx.itemGroupAttribute.create({
        data: { itemGroupId: req.params.id, attributeId: aid },
      });
    }

    // 3. Clear variant values for unticked attributes
    if (allAffectedVariantIds.length > 0) {
      await tx.pPEItemVariantValue.deleteMany({
        where: { id: { in: allAffectedVariantIds } },
      });
    }
  });

  // Log cleared values in AuditLog for each unticked in-use attribute (PPE-014, NEW-05)
  for (const item of inUseRemovedAttrs) {
    const affectedItemCodes = Array.from(new Set(item.affectedValues.map(v => v.itemCode)));
    await prisma.auditLog.create({
      data: {
        entityType: "ItemGroup",
        entityId: req.params.id,
        action: "ATTRIBUTE_UNTICKED_VALUES_CLEARED",
        performedBy: req.user!.id,
        reason: adminOverrideReason!.trim(),
        details: `Unticked in-use attribute '${item.attributeNameEn}' (${item.attributeCode}). Cleared ${item.affectedValues.length} saved variant values across catalog items: ${affectedItemCodes.join(", ")}`,
        beforeValues: JSON.stringify({
          untickedAttributeId: item.attributeId,
          untickedAttributeCode: item.attributeCode,
          clearedCount: item.affectedValues.length,
          clearedValues: item.affectedValues,
        }),
        afterValues: JSON.stringify({
          remainingAttributeIds: newAttrIds,
        }),
      },
    });
  }

  const full = await prisma.itemGroup.findUnique({
    where: { id: req.params.id },
    include: { attributes: { include: { attribute: true } } },
  });

  // Global Rule G1: Record beforeValues and afterValues JSON snapshots
  await prisma.auditLog.create({
    data: {
      entityType: "ItemGroup",
      entityId: full!.id,
      action: inUseRemovedAttrs.length > 0 ? "OVERRIDE_UPDATE" : "UPDATED",
      performedBy: req.user!.id,
      reason: adminOverrideReason ? adminOverrideReason.trim() : undefined,
      beforeValues: JSON.stringify(existing),
      afterValues: JSON.stringify(full),
    },
  });

  res.json({ ...full, attributeIds: full!.attributes.map(a => a.attributeId) });
}));

async function checkItemGroupInUse(id: string) {
  const activeItems = await prisma.pPEItem.count({
    where: { itemGroupId: id, deletedAt: null, active: true },
  });
  return { inUse: activeItems > 0, activeItems };
}

router.get("/:id/in-use", asyncHandler(async (req, res) => {
  const check = await checkItemGroupInUse(req.params.id);
  res.json({
    inUse: check.inUse,
    activeItemCount: check.activeItems,
  });
}));

router.patch("/:id/active", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
  const { active, adminOverrideReason } = req.body;
  if (typeof active !== "boolean") throw new ApiError(400, "active boolean required");
  if (!active) {
    const inUseCheck = await checkItemGroupInUse(req.params.id);
    if (inUseCheck.inUse) {
      const isAdmin = req.user!.role === "Admin" || req.user!.role.replace(/_/g, " ") === "Admin";
      if (!isAdmin) {
        throw new ApiError(400, "Cannot deactivate in-use Item Group without Admin override");
      }
      if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
        throw new ApiError(400, "Admin override reason is required to deactivate in-use Item Group");
      }
      const existing = await prisma.itemGroup.findUnique({ where: { id: req.params.id } });
      const g = await prisma.itemGroup.update({ where: { id: req.params.id }, data: { active } });
      await prisma.auditLog.create({
        data: {
          entityType: "ItemGroup",
          entityId: g.id,
          action: "OVERRIDE_DEACTIVATE",
          performedBy: req.user!.id,
          reason: adminOverrideReason.trim(),
          beforeValues: JSON.stringify(existing),
          afterValues: JSON.stringify(g),
        },
      });
      return res.json(g);
    }
  }
  const existing = await prisma.itemGroup.findUnique({ where: { id: req.params.id } });
  const g = await prisma.itemGroup.update({ where: { id: req.params.id }, data: { active } });
  await prisma.auditLog.create({
    data: {
      entityType: "ItemGroup",
      entityId: g.id,
      action: active ? "ACTIVATED" : "DEACTIVATED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(existing),
      afterValues: JSON.stringify(g),
    },
  });
  res.json(g);
}));

router.delete("/:id", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
  const g = await prisma.itemGroup.findUnique({ where: { id: req.params.id } });
  if (!g) throw new ApiError(404, "Not found");

  const { adminOverrideReason } = req.body || {};
  const inUseCheck = await checkItemGroupInUse(req.params.id);
  if (inUseCheck.inUse) {
    const isAdmin = req.user!.role === "Admin" || req.user!.role.replace(/_/g, " ") === "Admin";
    if (!isAdmin) {
      throw new ApiError(400, "Cannot delete in-use Item Group without Admin override");
    }
    if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
      throw new ApiError(400, "Admin override reason is required to delete in-use Item Group");
    }
    await prisma.itemGroup.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
    await prisma.auditLog.create({
      data: {
        entityType: "ItemGroup",
        entityId: req.params.id,
        action: "OVERRIDE_DELETE",
        performedBy: req.user!.id,
        reason: adminOverrideReason.trim(),
        beforeValues: JSON.stringify(g),
      },
    });
    return res.json({ message: "Soft deleted with Admin override" });
  }

  await prisma.itemGroup.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
  await prisma.auditLog.create({
    data: {
      entityType: "ItemGroup",
      entityId: req.params.id,
      action: "SOFT_DELETED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(g),
    },
  });
  res.json({ message: "Soft deleted" });
}));

router.post("/:id/restore", authorize("Admin"), asyncHandler(async (req, res) => {
  const existing = await prisma.itemGroup.findUnique({ where: { id: req.params.id } });
  const g = await prisma.itemGroup.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null } });
  await prisma.auditLog.create({
    data: {
      entityType: "ItemGroup",
      entityId: g.id,
      action: "RESTORED",
      performedBy: req.user!.id,
      beforeValues: existing ? JSON.stringify(existing) : undefined,
      afterValues: JSON.stringify(g),
    },
  });
  res.json(g);
}));

export default router;
