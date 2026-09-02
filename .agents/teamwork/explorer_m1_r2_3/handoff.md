# Investigation & Concrete Fix Strategy Report: Milestone 1 Iteration 2 (Defects 3, 4, 6, 7)

**Investigator**: teamwork_explorer (`explorer_m1_r2_3`)  
**Target Milestone**: Milestone 1: Master Data & System Foundation (Iteration 2)  
**Assigned Scope**: Defects 3, 4, 6, and 7  
**Working Directory**: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m1_r2_3`  
**Date**: 2026-11-09T10:50:00Z  

---

## 1. Observation

Direct code inspections, line citations, and verbatim findings across the codebase:

### A. Defect 3: Rule G2 Location Deactivation Bypass in `server/src/routes/locations.ts`
- **Location**: `server/src/routes/locations.ts:174-200`
- **Verbatim Code**:
  ```typescript
  router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(locationSchema), asyncHandler(async (req, res) => {
    const existing = await prisma.location.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, "Location not found");

    const { assignedStoreKeeperIds, locationType, adminOverrideReason, ...rest } = req.body;
    const normalized = normalizeLocationType(locationType);

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
  ```
- **Observed Behavior**:
  `locationSchema` (`server/src/schemas/entities.ts:21`) defines `active: z.boolean().optional()`.
  While `PATCH /api/locations/:id/active` (lines 227–232) and `DELETE /api/locations/:id` (lines 250–253) call `checkLocationHardBlock(req.params.id)`, `PUT /api/locations/:id` executes an update directly.
  Any authorized user can submit `PUT /api/locations/:id` with `{ active: false }` on a location holding stock (e.g. `loc-cai-new` with 305 units) and successfully deactivate it, completely bypassing Rule G2.

### B. Defect 4: PPE-002 Item Code Locked After Transactions in `server/src/routes/ppeItems.ts`
- **Location**: `server/src/routes/ppeItems.ts:102-115`
- **Verbatim Code**:
  ```typescript
  router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(ppeItemSchema), asyncHandler(async (req, res) => {
    const { locationIds, variantAttributeValueIds, ...rest } = req.body;
    const item = await prisma.pPEItem.update({ where: { id: req.params.id }, data: rest });
    await prisma.pPEItemLocation.deleteMany({ where: { ppeItemId: req.params.id } });
    for (const locId of locationIds) {
      await prisma.pPEItemLocation.create({ data: { ppeItemId: item.id, locationId: locId } });
    }
    await prisma.pPEItemVariantValue.deleteMany({ where: { ppeItemId: req.params.id } });
    for (const valId of variantAttributeValueIds || []) {
      await prisma.pPEItemVariantValue.create({ data: { ppeItemId: item.id, attributeValueId: valId } });
    }
    await prisma.auditLog.create({ data: { entityType: "PPEItem", entityId: item.id, action: "UPDATED", performedBy: req.user!.id } });
    res.json(item);
  }));
  ```
- **Observed Behavior**:
  1. `existing` is not queried before updating.
  2. `rest.itemCode` is applied directly to `prisma.pPEItem.update`.
  3. No transaction verification occurs: the endpoint does not check if `stockBalance` (`quantityOnHand > 0`), `batch`, `issuance`, `stockAdjustment`, or `stockMovement` exist.
  4. This violates PPE-002 and `PROJECT.md` ("Code locked after transactions").

### C. Defect 6: Rule G1 Audit Trail JSON Diffs & Employee Mutations
- **Location 1**: `server/src/routes/employees.ts:74-98`
  - `PUT /:id` (line 74), `DELETE /:id` (line 90), and `POST /:id/restore` (line 95) execute Prisma updates with **zero** `prisma.auditLog.create` calls.
- **Location 2**: Master data routes omit `beforeValues` and `afterValues`:
  - `server/src/routes/ppeItems.ts:98` (CREATE: missing `afterValues`), `line 113` (UPDATE: missing both), `line 227` (RESTORE: missing both).
  - `server/src/routes/jobPositions.ts:50` (CREATE: missing `afterValues`), `line 56` (UPDATE: missing both), `line 166` (RESTORE: missing both).
  - `server/src/routes/itemGroups.ts:47` (CREATE: missing `afterValues`), `line 60` (UPDATE: missing both), `line 166` (RESTORE: missing both).
  - `server/src/routes/attributes.ts:53` (CREATE: missing `afterValues`), `line 68` (UPDATE: missing both), `line 178` (RESTORE: missing both).
  - `server/src/routes/kits.ts:44` (CREATE: missing `afterValues`), `line 56` (UPDATE: missing both), `line 168` (RESTORE: missing both).
  - `server/src/routes/locations.ts:271` (RESTORE: missing `beforeValues`).

### D. Defect 7: Direct Supervisor Team Scoping Self-Exclusion in `server/src/middleware/roleGuard.ts`
- **Location**: `server/src/middleware/roleGuard.ts:40-47`
- **Verbatim Code**:
  ```typescript
  export async function getScopedSubordinateIds(userId: string, prisma: any): Promise<string[] | null> {
    const employee = await prisma.employee.findUnique({ where: { id: userId }, select: { role: true } });
    const norm = (employee?.role || "").replace(/_/g, " ");
    if (norm !== "Direct Supervisor" && employee?.role !== "Direct_Supervisor") return null;
    const subs = await prisma.employee.findMany({ where: { supervisorId: userId }, select: { id: true } });
    return subs.map((s: any) => s.id);
  }
  ```
- **Observed Behavior**:
  Line 46 returns only `subs.map((s: any) => s.id)` (subordinates whose `supervisorId === userId`).
  In `server/src/routes/employees.ts:30-33`, `GET /api/employees` executes `where.id = { in: scopedIds }`.
  Because `scopedIds` does not contain `userId`, Direct Supervisors are completely excluded from their own team view.

---

## 2. Logic Chain

1. **Defect 3 (Location Hard Block Bypass)**:
   - Rule G2 mandates that locations holding stock cannot be deactivated or deleted under any circumstance (scrap locations exempt).
   - `checkLocationHardBlock(locationId)` encapsulates the exact validation: checking on-hand stock > 0, sole active location assignment, and open loans.
   - When a client sends a `PUT` request with `{ active: false }`, `existing.active` is `true`. Because the deactivation path is accessed via `PUT` rather than `PATCH`, omitting `checkLocationHardBlock` allows an illegal state transition to bypass the business rule.
   - Enforcing `checkLocationHardBlock(req.params.id)` when `rest.active === false && existing.active === true` closes the bypass and ensures uniform enforcement across `PUT`, `PATCH`, and `DELETE`.

2. **Defect 4 (PPE Item Code Immutability)**:
   - PPE-002 and `PROJECT.md` specify: "Code locked after transactions."
   - When an item has recorded transactions (`stockBalance` with `quantityOnHand > 0`, `batch`, `issuance`, `stockAdjustment`, `stockMovement`), its `itemCode` is an immutable accounting and audit anchor.
   - By querying `existing = await prisma.pPEItem.findUnique` first, the system can determine if `rest.itemCode && rest.itemCode !== existing.itemCode`.
   - If changed, running a fast parallel check across the transaction models and rejecting with HTTP 400 (`"Item code is locked and cannot be changed once transactions exist"`) enforces the immutability lock.

3. **Defect 6 (Rule G1 Audit Trail JSON Diffs & Employee Mutations)**:
   - Global Rule G1 states: "Every create, update, delete, deactivate, override, and restore action across the application MUST generate an immutable audit log entry capturing actor, action, object, before/after diffs, reason, and source."
   - In `employees.ts`, `PUT`, `DELETE`, and `POST /restore` modify employee states, roles, and status without logging, violating G1. Adding audit log creation on these endpoints closes this compliance gap.
   - Critical Security Constraint: Employee records contain sensitive password hashes (`passwordHash`). Serializing `passwordHash` into `AuditLog.beforeValues` or `afterValues` would create a plaintext hash leak. Therefore, `passwordHash` must be explicitly destructured out prior to `JSON.stringify`.
   - On master data create/update/restore endpoints, capturing `beforeValues: JSON.stringify(existing)` and `afterValues: JSON.stringify(updated)` satisfies G1 compliance.

4. **Defect 7 (Direct Supervisor Self-Inclusion)**:
   - Role Scoping (R3, PPE-042) requires Direct Supervisors to view their own team. A team consists of the supervisor and all their direct subordinates.
   - Returning `[userId, ...subs.map((s: any) => s.id)]` from `getScopedSubordinateIds` ensures that both the supervisor and their direct reports are present in `where.id = { in: scopedIds }`.
   - In `server/test-comprehensive.ts:244`, the assertion explicitly anticipates this: `e.supervisor?.id === "emp-3" || e.id === "emp-3"`. Including `userId` aligns the backend implementation with this test contract.

---

## 3. Caveats

- **No Schema Changes Needed**: All four defects can be remediated within application route and middleware logic without altering `prisma/schema.prisma` or running database migrations.
- **Password Hash Redaction**: Redacting `passwordHash` from `AuditLog` is mandatory for security, but ensure all other fields (`name`, `role`, `department`, `site`, `active`, `jobPositionId`, `employmentStatus`, `supervisorId`) remain intact in the serialized JSON.
- **Admin Override Exemption**: Remind the implementer that Rule G2's hard block on locations holding stock is absolute (no Admin override allowed). Admin overrides only apply to entity deactivations where stock is zero or for other entity types (Job Positions, PPE items).

---

## 4. Conclusion & Recommended Concrete Fix Strategy

The following drop-in fixes are recommended for implementation. All code snippets have been verified against existing imports, middleware, and schema types.

### Fix 1: Defect 3 — Location Deactivation Bypass in `server/src/routes/locations.ts`

**Target File**: `server/src/routes/locations.ts`  
**Target Lines**: 174–201  

**Concrete Drop-in Replacement**:
```typescript
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
```

---

### Fix 2: Defect 4 — PPE-002 Item Code Locked After Transactions in `server/src/routes/ppeItems.ts`

**Target File**: `server/src/routes/ppeItems.ts`  
**Target Lines**: 102–115  

**Concrete Drop-in Replacement**:
```typescript
router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(ppeItemSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.pPEItem.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "PPE item not found");

  const { locationIds, variantAttributeValueIds, ...rest } = req.body;

  // PPE-002: Item Code locked after transactions exist
  if (rest.itemCode && rest.itemCode !== existing.itemCode) {
    const [hasStock, hasBatches, hasIssuances, hasAdjustments, hasMovements] = await Promise.all([
      prisma.stockBalance.count({ where: { ppeItemId: req.params.id, quantityOnHand: { gt: 0 } } }),
      prisma.batch.count({ where: { ppeItemId: req.params.id } }),
      prisma.issuance.count({ where: { ppeItemId: req.params.id } }),
      prisma.stockAdjustment.count({ where: { ppeItemId: req.params.id } }),
      prisma.stockMovement.count({ where: { ppeItemId: req.params.id } }),
    ]);
    const hasTransactions = hasStock > 0 || hasBatches > 0 || hasIssuances > 0 || hasAdjustments > 0 || hasMovements > 0;
    if (hasTransactions) {
      throw new ApiError(400, "Item code is locked and cannot be changed once transactions exist");
    }
  }

  const item = await prisma.pPEItem.update({ where: { id: req.params.id }, data: rest });
  if (locationIds) {
    await prisma.pPEItemLocation.deleteMany({ where: { ppeItemId: req.params.id } });
    for (const locId of locationIds) {
      await prisma.pPEItemLocation.create({ data: { ppeItemId: item.id, locationId: locId } });
    }
  }
  if (variantAttributeValueIds) {
    await prisma.pPEItemVariantValue.deleteMany({ where: { ppeItemId: req.params.id } });
    for (const valId of variantAttributeValueIds || []) {
      await prisma.pPEItemVariantValue.create({ data: { ppeItemId: item.id, attributeValueId: valId } });
    }
  }
  await prisma.auditLog.create({
    data: {
      entityType: "PPEItem",
      entityId: item.id,
      action: "UPDATED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(existing),
      afterValues: JSON.stringify(item),
    },
  });
  res.json(item);
}));
```

---

### Fix 3: Defect 6 — Rule G1 Audit Trail JSON Diffs & Employee Audit Logging

#### Part A: Add Audit Logging to `server/src/routes/employees.ts`
**Target File**: `server/src/routes/employees.ts`  
**Target Lines**: 74–98  

**Concrete Drop-in Replacement**:
```typescript
router.put("/:id", authorize("Admin"), validate(employeeUpdateSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Employee not found");

  const data: any = {};
  if (req.body.name) data.name = req.body.name;
  if (req.body.jobPositionId) data.jobPositionId = req.body.jobPositionId;
  if (req.body.role) data.role = normalizeRole(req.body.role) as any;
  if (req.body.gender) data.gender = req.body.gender;
  if (req.body.employmentStatus) data.employmentStatus = req.body.employmentStatus;
  if (req.body.supervisorId !== undefined) data.supervisorId = req.body.supervisorId;
  if (req.body.department !== undefined) data.department = req.body.department;
  if (req.body.site !== undefined) data.site = req.body.site;
  if (typeof req.body.active === "boolean") data.active = req.body.active;
  if (req.body.password) data.passwordHash = await bcrypt.hash(req.body.password, 10);
  
  const e = await prisma.employee.update({ where: { id: req.params.id }, data });

  // Sanitize passwordHash before recording audit trail (Rule G1 & Security)
  const { passwordHash: _prevHash, ...beforeClean } = existing;
  const { passwordHash: _nextHash, ...afterClean } = e;

  await prisma.auditLog.create({
    data: {
      entityType: "Employee",
      entityId: e.id,
      action: "UPDATED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(beforeClean),
      afterValues: JSON.stringify(afterClean),
    },
  });

  res.json({ ...e, role: denormalizeRole(e.role as string), passwordHash: undefined });
}));

router.delete("/:id", authorize("Admin"), asyncHandler(async (req, res) => {
  const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Employee not found");

  await prisma.employee.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });

  const { passwordHash: _prevHash, ...beforeClean } = existing;
  await prisma.auditLog.create({
    data: {
      entityType: "Employee",
      entityId: req.params.id,
      action: "SOFT_DELETED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(beforeClean),
    },
  });

  res.json({ message: "Soft deleted" });
}));

router.post("/:id/restore", authorize("Admin"), asyncHandler(async (req, res) => {
  const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Employee not found");

  const e = await prisma.employee.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null } });

  const { passwordHash: _prevHash, ...beforeClean } = existing;
  const { passwordHash: _nextHash, ...afterClean } = e;

  await prisma.auditLog.create({
    data: {
      entityType: "Employee",
      entityId: req.params.id,
      action: "RESTORED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(beforeClean),
      afterValues: JSON.stringify(afterClean),
    },
  });

  res.json({ ...e, role: denormalizeRole(e.role as string), passwordHash: undefined });
}));
```

#### Part B: Standardize Master Data `beforeValues` and `afterValues` Diffs

1. **`server/src/routes/ppeItems.ts`**:
   - In `POST /` (line 98):
     ```typescript
     await prisma.auditLog.create({
       data: {
         entityType: "PPEItem",
         entityId: item.id,
         action: "CREATED",
         performedBy: req.user!.id,
         afterValues: JSON.stringify(item),
       },
     });
     ```
   - In `POST /:id/restore` (lines 225–229):
     ```typescript
     router.post("/:id/restore", authorize("Admin"), asyncHandler(async (req, res) => {
       const existing = await prisma.pPEItem.findUnique({ where: { id: req.params.id } });
       const item = await prisma.pPEItem.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null } });
       await prisma.auditLog.create({
         data: {
           entityType: "PPEItem",
           entityId: item.id,
           action: "RESTORED",
           performedBy: req.user!.id,
           beforeValues: existing ? JSON.stringify(existing) : undefined,
           afterValues: JSON.stringify(item),
         },
       });
       res.json(item);
     }));
     ```

2. **`server/src/routes/jobPositions.ts`**:
   - In `POST /` (line 50):
     ```typescript
     const jp = await prisma.jobPosition.create({ data: req.body });
     await prisma.auditLog.create({
       data: {
         entityType: "JobPosition",
         entityId: jp.id,
         action: "CREATED",
         performedBy: req.user!.id,
         afterValues: JSON.stringify(jp),
       },
     });
     ```
   - In `PUT /:id` (lines 54–58):
     ```typescript
     const existing = await prisma.jobPosition.findUnique({ where: { id: req.params.id } });
     if (!existing) throw new ApiError(404, "JobPosition not found");
     const jp = await prisma.jobPosition.update({ where: { id: req.params.id }, data: req.body });
     await prisma.auditLog.create({
       data: {
         entityType: "JobPosition",
         entityId: jp.id,
         action: "UPDATED",
         performedBy: req.user!.id,
         beforeValues: JSON.stringify(existing),
         afterValues: JSON.stringify(jp),
       },
     });
     ```
   - In `POST /:id/restore` (lines 164–170):
     ```typescript
     router.post("/:id/restore", authorize("Admin"), asyncHandler(async (req, res) => {
       const existing = await prisma.jobPosition.findUnique({ where: { id: req.params.id } });
       const jp = await prisma.jobPosition.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null } });
       await prisma.auditLog.create({
         data: {
           entityType: "JobPosition",
           entityId: jp.id,
           action: "RESTORED",
           performedBy: req.user!.id,
           beforeValues: existing ? JSON.stringify(existing) : undefined,
           afterValues: JSON.stringify(jp),
         },
       });
       res.json(jp);
     }));
     ```

3. **`server/src/routes/itemGroups.ts`**:
   - In `POST /` (lines 47–48):
     ```typescript
     await prisma.auditLog.create({
       data: {
         entityType: "ItemGroup",
         entityId: g.id,
         action: "CREATED",
         performedBy: req.user!.id,
         afterValues: JSON.stringify(g),
       },
     });
     ```
   - In `PUT /:id` (lines 51–62):
     ```typescript
     const existing = await prisma.itemGroup.findUnique({ where: { id: req.params.id } });
     if (!existing) throw new ApiError(404, "Item group not found");
     const g = await prisma.itemGroup.update({ where: { id: req.params.id }, data: rest });
     ...
     await prisma.auditLog.create({
       data: {
         entityType: "ItemGroup",
         entityId: g.id,
         action: "UPDATED",
         performedBy: req.user!.id,
         beforeValues: JSON.stringify(existing),
         afterValues: JSON.stringify(g),
       },
     });
     ```
   - In `POST /:id/restore` (lines 164–170):
     ```typescript
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
     ```

4. **`server/src/routes/attributes.ts`**:
   - In `POST /` (line 53):
     ```typescript
     await prisma.auditLog.create({
       data: {
         entityType: "Attribute",
         entityId: attr.id,
         action: "CREATED",
         performedBy: req.user!.id,
         afterValues: JSON.stringify(full),
       },
     });
     ```
   - In `PUT /:id` (lines 58–69):
     ```typescript
     const existing = await prisma.attribute.findUnique({ where: { id: req.params.id }, include: { values: true } });
     ...
     await prisma.auditLog.create({
       data: {
         entityType: "Attribute",
         entityId: attr.id,
         action: "UPDATED",
         performedBy: req.user!.id,
         beforeValues: JSON.stringify(existing),
         afterValues: JSON.stringify(full),
       },
     });
     ```
   - In `POST /:id/restore` (lines 176–180):
     ```typescript
     const existing = await prisma.attribute.findUnique({ where: { id: req.params.id } });
     const attr = await prisma.attribute.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null } });
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
     ```

5. **`server/src/routes/kits.ts`**:
   - In `POST /` (line 44):
     ```typescript
     await prisma.auditLog.create({
       data: {
         entityType: "Kit",
         entityId: kit.id,
         action: "CREATED",
         performedBy: req.user!.id,
         afterValues: JSON.stringify(kit),
       },
     });
     ```
   - In `PUT /:id` (line 56):
     ```typescript
     const existing = await prisma.kit.findUnique({ where: { id: req.params.id }, include: { items: true } });
     if (!existing) throw new ApiError(404, "Kit not found");
     ...
     await prisma.auditLog.create({
       data: {
         entityType: "Kit",
         entityId: kit.id,
         action: "UPDATED",
         performedBy: req.user!.id,
         beforeValues: JSON.stringify(existing),
         afterValues: JSON.stringify(kit),
       },
     });
     ```
   - In `POST /:id/restore` (lines 166–170):
     ```typescript
     const existing = await prisma.kit.findUnique({ where: { id: req.params.id } });
     const k = await prisma.kit.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null } });
     await prisma.auditLog.create({
       data: {
         entityType: "Kit",
         entityId: k.id,
         action: "RESTORED",
         performedBy: req.user!.id,
         beforeValues: existing ? JSON.stringify(existing) : undefined,
         afterValues: JSON.stringify(k),
       },
     });
     ```

6. **`server/src/routes/locations.ts`**:
   - In `POST /:id/restore` (lines 269–281):
     ```typescript
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
     ```

---

### Fix 4: Defect 7 — Direct Supervisor Team Scoping in `server/src/middleware/roleGuard.ts`

**Target File**: `server/src/middleware/roleGuard.ts`  
**Target Lines**: 40–47  

**Concrete Drop-in Replacement**:
```typescript
// Helper to check if user is Direct Supervisor and scope subordinate employee IDs
export async function getScopedSubordinateIds(userId: string, prisma: any): Promise<string[] | null> {
  // returns null if not direct supervisor (no scoping), otherwise array of employee IDs (own team)
  const employee = await prisma.employee.findUnique({ where: { id: userId }, select: { role: true } });
  const norm = (employee?.role || "").replace(/_/g, " ");
  if (norm !== "Direct Supervisor" && employee?.role !== "Direct_Supervisor") return null;
  const subs = await prisma.employee.findMany({ where: { supervisorId: userId }, select: { id: true } });
  return [userId, ...subs.map((s: any) => s.id)];
}
```

---

## 5. Verification Method

Once the worker agent implements these drop-in fixes, the implementation can be independently verified via the following steps:

### A. Automated Suite Execution
Run the full verification battery in Powershell:
```powershell
npm run build:server
npm run lint
npm run test:server
npm run build
```

### B. Defect-Specific Automated Assertions
Add the following assertions into `server/test-comprehensive.ts`:

1. **Verify Location Hard Block on PUT (Defect 3)**:
   ```typescript
   // Attempt to deactivate location holding stock via PUT -> MUST BE BLOCKED (HTTP 400)
   const deactPutAttempt = await req("PUT", "/api/locations/loc-cai-new", {
     code: "LOC-CAI-NEW",
     nameEn: "Cairo Main Store",
     nameAr: "مستودع القاهرة الرئيسي",
     site: "Cairo Site",
     locationType: "Central Warehouse",
     stockCondition: "New",
     active: false, // Illegal deactivation attempt!
   }, adminToken);
   assert(deactPutAttempt.status === 400, "Deactivating location holding stock via PUT must be blocked with HTTP 400");
   ```

2. **Verify Item Code Immutability on Transacted PPE Items (Defect 4)**:
   ```typescript
   // Attempt to change itemCode on transacted item 'ppe-hlm-001' -> MUST BE BLOCKED (HTTP 400)
   const changeCodeAttempt = await req("PUT", "/api/ppe-items/ppe-hlm-001", {
     itemCode: "HLM-MUTATED-999",
     nameEn: "Standard Safety Helmet Mutated",
     nameAr: "خوذة سلامة قياسية",
     category: "Head Protection",
     riskCategory: "Category II",
     uom: "Pieces",
     gender: "Unisex",
     lifespanType: "Fixed",
     lifespanValue: 24,
     reorderLevel: 10,
     locationIds: ["loc-cai-new"],
   }, adminToken);
   assert(changeCodeAttempt.status === 400, "Mutating itemCode on PPE item with transactions must be blocked with HTTP 400");
   assert(
     changeCodeAttempt.json.message === "Item code is locked and cannot be changed once transactions exist",
     "Error message must specify that item code is locked once transactions exist"
   );
   ```

3. **Verify Employee Audit Logging & Hash Redaction (Defect 6)**:
   ```typescript
   // Update employee emp-4
   const updateEmp = await req("PUT", "/api/employees/emp-4", { department: "Civil Engineering" }, adminToken);
   assert(updateEmp.status === 200, "Updating employee must succeed");
   
   // Query audit log for Employee
   const empAudit = await prisma.auditLog.findFirst({
     where: { entityType: "Employee", entityId: "emp-4", action: "UPDATED" },
     orderBy: { timestamp: "desc" },
   });
   assert(empAudit !== null, "AuditLog entry for Employee UPDATED must exist");
   assert(empAudit.beforeValues !== null && empAudit.afterValues !== null, "AuditLog must include beforeValues and afterValues JSON");
   assert(!empAudit.beforeValues.includes("passwordHash"), "passwordHash must NOT be leaked into beforeValues");
   assert(!empAudit.afterValues.includes("passwordHash"), "passwordHash must NOT be leaked into afterValues");
   ```

4. **Verify Direct Supervisor Team Self-Inclusion (Defect 7)**:
   ```typescript
   // Direct supervisor Sarah (emp-3) queries /api/employees
   const team = await req("GET", "/api/employees", undefined, supervisorToken);
   assert(team.status === 200, "Direct supervisor query must succeed");
   assert(
     team.json.data.some((e: any) => e.id === "emp-3"),
     "Direct supervisor must be included in their own team list"
   );
   ```

### C. Invalidation Conditions
The fix strategy will be invalidated if:
1. `PUT /api/locations/:id` accepts `{ active: false }` without checking `checkLocationHardBlock`.
2. `PUT /api/ppe-items/:id` permits updating `itemCode` when on-hand stock or historical issuances exist.
3. Employee mutations (`PUT`, `DELETE`, `POST /restore`) do not write to `AuditLog`, or `passwordHash` is exposed in audit JSON diffs.
4. `getScopedSubordinateIds` continues to exclude `userId`, preventing supervisors from seeing their own record in `GET /api/employees`.
