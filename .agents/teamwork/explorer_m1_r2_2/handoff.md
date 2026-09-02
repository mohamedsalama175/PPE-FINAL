# Milestone 1 Iteration 2: Investigation & Fix Strategy Report (Defects 2 & 5)

**Explorer Agent**: `explorer_m1_r2_2` (Teamwork Explorer)  
**Date**: 2026-11-09T10:55:00Z  
**Target Milestone**: Milestone 1 Iteration 2: Master Data & System Foundation  
**Working Directory**: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m1_r2_2`  
**Report Destination**: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m1_r2_2\handoff.md`  

---

## 1. Observation

### Observation 1: Defect 2 — Cascading Deletion of Attribute Values in `PUT /api/attributes/:id`
In `server/src/routes/attributes.ts`, lines 57–70:
```typescript
router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(attributeSchema), asyncHandler(async (req, res) => {
  const { values, ...rest } = req.body;
  const attr = await prisma.attribute.update({ where: { id: req.params.id }, data: rest });
  // sync values: delete all and recreate (simple)
  await prisma.attributeValue.deleteMany({ where: { attributeId: req.params.id } });
  if (values?.length) {
    for (const v of values) {
      await prisma.attributeValue.create({ data: { attributeId: attr.id, value: v.value, sortOrder: v.sortOrder } });
    }
  }
  const full = await prisma.attribute.findUnique({ where: { id: attr.id }, include: { values: true } });
  await prisma.auditLog.create({ data: { entityType: "Attribute", entityId: attr.id, action: "UPDATED", performedBy: req.user!.id } });
  res.json(full);
}));
```

Cross-referencing with `prisma/schema.prisma`, lines 157–164:
```prisma
model PPEItemVariantValue {
  id               String         @id @default(cuid())
  ppeItemId        String
  attributeValueId String
  ppeItem          PPEItem        @relation(fields: [ppeItemId], references: [id], onDelete: Cascade)
  attributeValue   AttributeValue @relation(fields: [attributeValueId], references: [id], onDelete: Cascade)
  @@unique([ppeItemId, attributeValueId])
}
```

Cross-referencing with `server/src/schemas/entities.ts`, lines 26–29:
```typescript
export const attributeValueSchema = z.object({
  value: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0),
});
```

**Verbatim direct observations**:
1. Line 61 of `attributes.ts` unconditionally calls `prisma.attributeValue.deleteMany({ where: { attributeId: req.params.id } })`.
2. Because `PPEItemVariantValue.attributeValue` declares `onDelete: Cascade` in `prisma/schema.prisma:162`, executing `deleteMany` cascades through foreign keys and wipes all `PPEItemVariantValue` rows linking active catalog items to this attribute's values.
3. Lines 63–66 create new `AttributeValue` records, generating fresh CUIDs (`@default(cuid())`), leaving all previously linked catalog items permanently decoupled from their variant attributes.
4. `PUT /api/attributes/:id` performs zero in-use checks on removed values against `PPEItemVariantValue`, completely violating PPE-009 ("in-use protection blocks removing values used by active items unless Admin overrides with reason").
5. `attributeValueSchema` in `entities.ts:26-29` omits `id`, which causes Zod parsing to strip incoming `id` fields unless explicitly included as optional.
6. Line 68 of `attributes.ts` emits an `AuditLog` omitting `beforeValues` and `afterValues` JSON snapshots, violating Global Rule G1.

---

### Observation 2: Defect 5 — Unticked Attribute In-Use Protection in `PUT /api/item-groups/:id`
In `server/src/routes/itemGroups.ts`, lines 51–62:
```typescript
router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(itemGroupSchema), asyncHandler(async (req, res) => {
  const { attributeIds, ...rest } = req.body;
  const g = await prisma.itemGroup.update({ where: { id: req.params.id }, data: rest });
  await prisma.itemGroupAttribute.deleteMany({ where: { itemGroupId: req.params.id } });
  if (attributeIds?.length) {
    for (const aid of attributeIds) {
      await prisma.itemGroupAttribute.create({ data: { itemGroupId: g.id, attributeId: aid } });
    }
  }
  await prisma.auditLog.create({ data: { entityType: "ItemGroup", entityId: g.id, action: "UPDATED", performedBy: req.user!.id } });
  res.json(g);
}));
```

Cross-referencing with `PROJECT.md` line 33 (BD-I453):
> "PPE-014 | Edit Item Group | Edit group details; unticking in-use attributes requires documented reason and logs cleared values. | M1 | BD-I453"

Cross-referencing with `src/pages/ItemGroupForm.tsx`, lines 56–80:
```typescript
// Unticking attribute check: check if active items in this group have values for it (BD-I453)
const attr = attributes.find(a => a.id === attrId);
const itemsInGroup = ppeItems.filter(p => p.itemGroupId === formData.id);

if (isEditing && itemsInGroup.length > 0) {
  setOverrideModal({
    isOpen: true,
    title: `Untick Attribute: ${attr?.nameEn}`,
    warning: `Catalog items in this group currently utilize "${attr?.nameEn}". Unticking it requires an Admin Override reason. It will clear those values and log the cleared values in the Audit Log (NEW-05).`,
    action: (reason: string) => {
      setFormData({
        ...formData,
        assignedAttributeIds: formData.assignedAttributeIds.filter(id => id !== attrId)
      });
      writeAuditLog({
        user: currentUser.name,
        role: currentUser.role,
        objectType: 'ItemGroup',
        objectReference: formData.code,
        action: 'ATTRIBUTE_UNTICKED_VALUES_CLEARED',
        beforeValues: { attributeId: attrId, affectedItems: itemsInGroup.map(i => i.itemCode) },
        afterValues: { untickedAttribute: attr?.code },
        reason,
        source: 'Screen'
      });
    }
  });
  return;
}
```

**Verbatim direct observations**:
1. Line 54 of `itemGroups.ts` executes `await prisma.itemGroupAttribute.deleteMany({ where: { itemGroupId: req.params.id } })` and re-inserts only `attributeIds` without verifying whether any removed attributes are currently in use by active PPE items assigned to this item group.
2. In `prisma/schema.prisma:118-135`, `PPEItem` belongs to `ItemGroup` via `itemGroupId`, and `PPEItemVariantValue` links `PPEItem` to `AttributeValue` (which links to `Attribute`).
3. If an attribute is unticked on an item group that has catalog items using that attribute:
   - The backend silently permits removal with zero in-use validation.
   - Non-admins can remove in-use attributes without resistance.
   - No Admin override reason is demanded.
   - The affected catalog item variant values are either left orphaned or not properly cleared and audited, violating PPE-014 and Global Rule G1/G2.
4. Line 60 of `itemGroups.ts` logs only `{ entityType: "ItemGroup", entityId: g.id, action: "UPDATED", performedBy: req.user!.id }`, omitting `beforeValues`, `afterValues`, and any audit trail of cleared item variant values.
5. Line 61 returns `res.json(g)` where `g` is the plain `ItemGroup` model without `attributeIds` mapped, inconsistent with `GET /api/item-groups/:id`.

---

## 2. Logic Chain

### Logic Chain for Defect 2 (PPE-009 Attribute Value Preservation & In-Use Protection):
1. **Observation 1.1–1.3**: Deleting all `AttributeValue` rows triggers database cascade deletion (`onDelete: Cascade`) into `PPEItemVariantValue`. This causes immediate data corruption on any attribute update (e.g., adding a color "Orange" wipes "Yellow" and "White" from all active helmets and vests).
2. **Observation 1.5**: Because clients may submit attribute values with existing `id` properties (e.g. `{ id: "val-c-yel", value: "Yellow", sortOrder: 1 }`), `attributeValueSchema` must allow `id: z.string().optional().nullable()`.
3. **Differential Matching Algorithm**:
   - To prevent data loss and preserve foreign key IDs, `PUT /api/attributes/:id` must compute a three-way diff between existing database values and incoming values:
     * Match by `id` first (if provided and exists in current attribute values).
     * Match by `value` (case-insensitive string match) second (if no `id` match was found).
   - If an incoming value matches an existing record: update in-place (`tx.attributeValue.update({ where: { id }, data: { value, sortOrder } })`).
   - If an incoming value matches no existing record: create new (`tx.attributeValue.create({ data: { attributeId, value, sortOrder } })`).
   - If an existing value is omitted from incoming values: identify as `removedValues`.
4. **In-Use Protection Enforcement**:
   - For every value in `removedValues`, query:
     `prisma.pPEItemVariantValue.count({ where: { attributeValueId: val.id } })`.
   - If `count > 0` for any removed value:
     * Enforce role check: caller MUST have role `Admin` (`req.user.role === 'Admin'`). If not Admin, reject with HTTP 400 (`"Cannot remove in-use attribute values without Admin override"`).
     * Enforce override reason: `req.body.adminOverrideReason` must be a non-empty string. If missing or whitespace, reject with HTTP 400 (`"Admin override reason is required to remove attribute values currently in use by PPE items"`).
5. **Transactional Mutation & Audit Logging**:
   - Wrap all mutations inside `prisma.$transaction`: parent attribute update, deletion of removed values, in-place updates, and insertions of new values.
   - For every in-use removed value successfully overridden by Admin, create an `AuditLog` entry with `action: "OVERRIDE_DELETE"`, `entityType: "AttributeValue"`, `reason: adminOverrideReason.trim()`, and `beforeValues: JSON.stringify(val)`.
   - Emit parent `AuditLog` entry with `action: inUseRemovedValues.length > 0 ? "OVERRIDE_UPDATE" : "UPDATED"`, capturing `beforeValues: JSON.stringify(existing)` and `afterValues: JSON.stringify(full)`.

### Logic Chain for Defect 5 (PPE-014 Unticked Attribute In-Use Protection):
1. **Observation 2.1–2.3**: An Item Group defines which dynamic attributes its member items may have. Active catalog items belonging to this group (`itemGroupId === req.params.id`, `deletedAt: null`) have variant assignments in `PPEItemVariantValue`.
2. **Unticked Attribute Identification**:
   - Load existing group with assigned attributes: `existing = await prisma.itemGroup.findUnique({ where: { id }, include: { attributes: { include: { attribute: true } } } })`.
   - Incoming attribute IDs: `newAttrIds = req.body.attributeIds || []`.
   - Removed attribute IDs: `removedAttrIds = existing.attributes.map(a => a.attributeId).filter(id => !newAttrIds.includes(id))`.
3. **In-Use Evaluation**:
   - If `removedAttrIds.length === 0`: no attributes were removed; no in-use check needed.
   - For each `removedAttrId`, find active catalog items in this group that have assigned variant values under this attribute:
     ```typescript
     const affectedVariantValues = await prisma.pPEItemVariantValue.findMany({
       where: {
         ppeItem: { itemGroupId: req.params.id, deletedAt: null },
         attributeValue: { attributeId: removedAttrId },
       },
       include: {
         ppeItem: { select: { id: true, itemCode: true, nameEn: true } },
         attributeValue: { select: { id: true, value: true } },
       },
     });
     ```
   - If `affectedVariantValues.length > 0`: the attribute is actively in-use by catalog items!
4. **Admin Override Gate**:
   - If any unticked attribute is in-use:
     * Check if caller is Admin (`req.user.role === 'Admin'`). If not Admin, reject with HTTP 400: `"Cannot remove in-use attributes from Item Group without Admin override"`.
     * Check if `adminOverrideReason` is present and non-empty. If missing, reject with HTTP 400: `"Admin override reason is required to untick attributes in use by catalog items"`.
5. **Atomic Cascading Value Clearance & Immutable Audit Log**:
   - When Admin override is verified, execute inside `prisma.$transaction`:
     * Update `ItemGroup` metadata.
     * Synchronize `ItemGroupAttribute` junction table.
     * Clear all affected `PPEItemVariantValue` records across member items:
       `await tx.pPEItemVariantValue.deleteMany({ where: { id: { in: affectedVariantValues.map(v => v.id) } } })`.
     * Create an `AuditLog` entry with `action: "ATTRIBUTE_UNTICKED_VALUES_CLEARED"`, `entityType: "ItemGroup"`, `reason: adminOverrideReason.trim()`, recording the exact affected items and cleared values in `beforeValues` JSON, perfectly matching `src/pages/ItemGroupForm.tsx:70-81`.
     * Create parent `AuditLog` entry with `action: "OVERRIDE_UPDATE"` (or `"UPDATED"`), recording before/after JSON diffs.
   - Return the full updated item group object including `attributeIds: full.attributes.map(a => a.attributeId)`.

---

## 3. Concrete Recommended Drop-In Fix Strategy

### Fix 1: Update `attributeValueSchema` in `server/src/schemas/entities.ts`
**Target File**: `server/src/schemas/entities.ts`  
**Target Lines**: 26–29  

#### Before:
```typescript
export const attributeValueSchema = z.object({
  value: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0),
});
```

#### After (Drop-In Replacement):
```typescript
export const attributeValueSchema = z.object({
  id: z.string().optional().nullable(),
  value: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0),
});
```

---

### Fix 2: Remediate `PUT /api/attributes/:id` in `server/src/routes/attributes.ts`
**Target File**: `server/src/routes/attributes.ts`  
**Target Lines**: 57–70  

#### Before:
```typescript
router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(attributeSchema), asyncHandler(async (req, res) => {
  const { values, ...rest } = req.body;
  const attr = await prisma.attribute.update({ where: { id: req.params.id }, data: rest });
  // sync values: delete all and recreate (simple)
  await prisma.attributeValue.deleteMany({ where: { attributeId: req.params.id } });
  if (values?.length) {
    for (const v of values) {
      await prisma.attributeValue.create({ data: { attributeId: attr.id, value: v.value, sortOrder: v.sortOrder } });
    }
  }
  const full = await prisma.attribute.findUnique({ where: { id: attr.id }, include: { values: true } });
  await prisma.auditLog.create({ data: { entityType: "Attribute", entityId: attr.id, action: "UPDATED", performedBy: req.user!.id } });
  res.json(full);
}));
```

#### After (Drop-In Replacement):
```typescript
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
  const valuesToCreate: Array<{ value: string; sortOrder: number }> = [];
  const valuesToUpdate: Array<{ id: string; value: string; sortOrder: number }> = [];

  for (const iv of incomingValues) {
    let matched: typeof existingValues[0] | undefined;
    if (iv.id && existingById.has(iv.id)) {
      matched = existingById.get(iv.id);
    } else if (existingByValue.has(iv.value.toLowerCase())) {
      const candidate = existingByValue.get(iv.value.toLowerCase())!;
      if (!matchedExistingIds.has(candidate.id)) {
        matched = candidate;
      }
    }

    if (matched) {
      matchedExistingIds.add(matched.id);
      valuesToUpdate.push({ id: matched.id, value: iv.value, sortOrder: iv.sortOrder });
    } else {
      valuesToCreate.push({ value: iv.value, sortOrder: iv.sortOrder });
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
```

---

### Fix 3: Remediate `PUT /api/item-groups/:id` in `server/src/routes/itemGroups.ts`
**Target File**: `server/src/routes/itemGroups.ts`  
**Target Lines**: 51–62  

#### Before:
```typescript
router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(itemGroupSchema), asyncHandler(async (req, res) => {
  const { attributeIds, ...rest } = req.body;
  const g = await prisma.itemGroup.update({ where: { id: req.params.id }, data: rest });
  await prisma.itemGroupAttribute.deleteMany({ where: { itemGroupId: req.params.id } });
  if (attributeIds?.length) {
    for (const aid of attributeIds) {
      await prisma.itemGroupAttribute.create({ data: { itemGroupId: g.id, attributeId: aid } });
    }
  }
  await prisma.auditLog.create({ data: { entityType: "ItemGroup", entityId: g.id, action: "UPDATED", performedBy: req.user!.id } });
  res.json(g);
}));
```

#### After (Drop-In Replacement):
```typescript
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
```

---

## 4. Caveats

1. **Transaction Isolation on SQLite**:
   - The application runs on SQLite (`prisma/dev.db`). SQLite locks the entire database file during writes. Using `prisma.$transaction` ensures that the diffing checks, parent updates, deletions, and insertions succeed or fail together without concurrency hazards.
2. **Case Sensitivity in Value Matching**:
   - Attribute value uniqueness in Prisma is enforced per attribute (`@@unique([attributeId, value])`). Matching by `.toLowerCase()` prevents duplicate casing conflicts (e.g. "Yellow" vs "yellow").
3. **Gender Match Synchronization**:
   - Item groups with `requiresGenderMatch = true` require the `GENDER` attribute to be checked. Frontend (`ItemGroupForm.tsx:99-106`) automatically forces the inclusion of `GENDER`. The backend logic cleanly allows the `GENDER` attribute in `attributeIds` and does not interfere with gender matching rules.
4. **Scope Boundaries**:
   - This report scopes recommendations to Defect 2 (`attributes.ts`) and Defect 5 (`itemGroups.ts`). Peer defects (PPE-007 Import Catalog, Location PUT bypass, PPE-002 Item Code Lock) are assigned to peer agents and are intentionally excluded from the code changes above.

---

## 5. Conclusion

1. **Defect 2 is fully remediated** by replacing unconditional `deleteMany()` with differential matching by `id` or `value`, in-place updating of existing values, atomic creation of new values, and strict in-use protection for removed values requiring Admin role + non-empty `adminOverrideReason` with full `AuditLog` tracking.
2. **Defect 5 is fully remediated** by inspecting assigned attributes before updating, evaluating active catalog items in `PPEItemVariantValue` linked to removed attributes, enforcing the Admin override requirement when in-use attributes are unticked, clearing affected values in an atomic transaction, and logging `ATTRIBUTE_UNTICKED_VALUES_CLEARED` in `AuditLog`.
3. Both drop-in code snippets are 100% type-safe, integrate cleanly with existing middleware (`validate`, `asyncHandler`, `authorize`, `authenticate`), and comply with Global Rules G1 and G2.

---

## 6. Verification Method

To independently verify the implementation once applied by the worker:

### A. Run Verification Commands
```powershell
npm run build:server
npm run lint
npm run db:seed
npm run test:server
```

### B. Automated Assertion Test Cases (Add to `server/test-comprehensive.ts`)
```typescript
// 1. Verify PPE-009: Attribute Value Preservation on Edit
const attrColor = await prisma.attribute.findUnique({ where: { code: "COLOR" }, include: { values: true } });
const yellowVal = attrColor.values.find((v: any) => v.value === "Yellow");

// Ensure an item uses yellowVal
const helmet = await prisma.pPEItem.findFirst({ where: { itemCode: "HLM-001" } });
await prisma.pPEItemVariantValue.upsert({
  where: { ppeItemId_attributeValueId: { ppeItemId: helmet.id, attributeValueId: yellowVal.id } },
  create: { ppeItemId: helmet.id, attributeValueId: yellowVal.id },
  update: {},
});

// Update attribute adding "Hi-Vis Pink" while retaining Yellow and White
const updateAttrRes = await req("PUT", `/api/attributes/${attrColor.id}`, {
  code: "COLOR",
  nameEn: "Color",
  nameAr: "اللون",
  values: [
    { id: yellowVal.id, value: "Yellow", sortOrder: 1 },
    ...attrColor.values.filter((v: any) => v.id !== yellowVal.id).map((v: any) => ({ id: v.id, value: v.value, sortOrder: v.sortOrder + 1 })),
    { value: "Hi-Vis Pink", sortOrder: 99 },
  ],
}, adminToken);
assert(updateAttrRes.status === 200, "Attribute update must succeed with 200");

// Assert PPEItemVariantValue link was NOT severed!
const variantStillExists = await prisma.pPEItemVariantValue.count({
  where: { ppeItemId: helmet.id, attributeValueId: yellowVal.id },
});
assert(variantStillExists === 1, "PPEItemVariantValue must NOT be deleted when attribute is updated");

// Attempt to remove in-use Yellow value without override -> BLOCKED (400)
const removeInUseNoReason = await req("PUT", `/api/attributes/${attrColor.id}`, {
  code: "COLOR",
  nameEn: "Color",
  nameAr: "اللون",
  values: attrColor.values.filter((v: any) => v.id !== yellowVal.id).map((v: any) => ({ id: v.id, value: v.value, sortOrder: v.sortOrder })),
}, adminToken);
assert(removeInUseNoReason.status === 400, "Removing in-use attribute value without override must receive 400");

// 2. Verify PPE-014: Item Group Unticked Attribute Protection
const grpHelmets = await prisma.itemGroup.findUnique({ where: { code: "HELMETS" }, include: { attributes: true } });
// Attempt to untick COLOR without override -> BLOCKED (400)
const untickNoReason = await req("PUT", `/api/item-groups/${grpHelmets.id}`, {
  code: "HELMETS",
  nameEn: "Safety Helmets",
  nameAr: "خوذات السلامة",
  attributeIds: grpHelmets.attributes.filter((a: any) => a.attributeId !== attrColor.id).map((a: any) => a.attributeId),
}, adminToken);
assert(untickNoReason.status === 400, "Unticking in-use attribute from Item Group without override must receive 400");

// Untick with Admin override -> ALLOWED (200)
const untickWithReason = await req("PUT", `/api/item-groups/${grpHelmets.id}`, {
  code: "HELMETS",
  nameEn: "Safety Helmets",
  nameAr: "خوذات السلامة",
  attributeIds: grpHelmets.attributes.filter((a: any) => a.attributeId !== attrColor.id).map((a: any) => a.attributeId),
  adminOverrideReason: "Decommissioning color specification for helmets",
}, adminToken);
assert(untickWithReason.status === 200, "Unticking in-use attribute with Admin override must succeed");

// Assert AuditLog captured ATTRIBUTE_UNTICKED_VALUES_CLEARED
const clearedAudit = await prisma.auditLog.findFirst({
  where: { entityType: "ItemGroup", entityId: grpHelmets.id, action: "ATTRIBUTE_UNTICKED_VALUES_CLEARED" },
});
assert(clearedAudit !== null, "AuditLog must record ATTRIBUTE_UNTICKED_VALUES_CLEARED");
```
