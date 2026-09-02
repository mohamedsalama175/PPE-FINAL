# Handoff Report — explorer_m2_3 (Kits Management & Frontend Epics 5–6)

**Mission**: Kits Management (`server/src/routes/kits.ts`) & Frontend UI Integration for Epics 5 & 6 (PPE-024 through PPE-033)  
**Date**: 2026-11-09T11:55:00Z  
**Author**: `explorer_m2_3`  
**Recipient**: `0705e41a-f51e-424e-9956-6cd880334c08` (parent / orchestrator)  
**Status**: COMPLETE (Hard Handoff)

---

## 1. Observation

### Observation 1.1: Defect 6 — Kits Endpoint Ignores `jobPositionId` Query Filter
- **File**: `server/src/routes/kits.ts:14-30`
- **Impacted E2E Tests**:
  - `T2-PPE-047-01` (`tests/e2e/tier2_boundaries/epic09_boundaries.test.ts:122-131`):
    ```typescript
    const res = await ctx.asAdmin().get("/api/kits?jobPositionId=fake-job-position-9999");
    assertStatus(res, 200);
    expect(res.data.data.length).toBe(0);
    ```
  - `T1-PPE-031-03` (`tests/e2e/tier1_features/epic06_kits.test.ts:246-254`):
    ```typescript
    const res = await ctx.asAdmin().get("/api/kits?jobPositionId=jp-1");
    assertSuccess(res);
    expect(Array.isArray(res.data.data)).toBe(true);
    ```
  - `T1-PPE-031-04` (`tests/e2e/tier1_features/epic06_kits.test.ts:256-265`):
    ```typescript
    const res = await ctx.asAdmin().get("/api/kits?active=true");
    assertSuccess(res);
    expect(res.data.meta.total).toBeGreaterThan(0);
    ```
- **Verbatim Current Code (`server/src/routes/kits.ts:14-23`)**:
  ```typescript
  router.get("/", asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const search = (req.query.search as string)?.toLowerCase();
    const includeDeleted = req.query.includeDeleted === "true";
    const where: any = {};
    if (!includeDeleted) where.deletedAt = null;
    if (search) where.OR = [{ nameEn: { contains: search } }, { nameAr: { contains: search } }];
    const total = await prisma.kit.count({ where });
    const data = await prisma.kit.findMany({
      where,
  ```
- **Finding**: Neither `req.query.jobPositionId` nor `req.query.active` are evaluated or added to the Prisma `where` clause. Consequently, queries such as `GET /api/kits?jobPositionId=fake-job-position-9999` return the entire catalog of kits, directly violating feature story PPE-031 and failing test `T2-PPE-047-01`.

---

### Observation 1.2: Kit In-Use Protection & Admin Override (PPE-033, Rule G2)
- **File**: `server/src/routes/kits.ts:81-184`
- **Verbatim Current Code**:
  ```typescript
  async function checkKitInUse(kitId: string) {
    const activeIssuances = await prisma.issuance.count({
      where: { kitId, status: { in: ["issued", "Active"] } },
    });
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentIssuances = await prisma.issuance.count({
      where: { kitId, createdAt: { gte: ninetyDaysAgo } },
    });
    return { inUse: activeIssuances > 0 || recentIssuances > 0, activeIssuances, recentIssuances };
  }
  ```
- **Findings & Vulnerabilities**:
  1. **Issuance Date Discrepancy**: `recentIssuances` checks `createdAt: { gte: ninetyDaysAgo }`. However, in `schema.prisma:347`, the business date of issuance is stored in `issueDate DateTime @default(now())`. Historical records and manual issuances record their timestamp in `issueDate`. It must query both `issueDate` and `createdAt` via `OR: [{ issueDate: { gte: ninetyDaysAgo } }, { createdAt: { gte: ninetyDaysAgo } }]`.
  2. **Active Status Variance**: Issuance status values across tests and codebase include `"issued"`, `"Active"`, and `"active"`. All three must be matched.
  3. **DELETE Reason Transport**: In `router.delete("/:id")`, `const { adminOverrideReason } = req.body || {};` only checks `req.body`. HTTP DELETE requests from standard web clients or query-string callers often submit parameters via `req.query.adminOverrideReason`.
  4. **Sole Active Kit Position Reassignment (PPE-030)**: In `router.put("/:id")`, changing `jobPositionId` on a kit that is the sole active kit for its position with issuances in the last 90 days requires Admin override reason (`PROJECT.md` line 49). Currently, `PUT /:id` allows unrestricted reassignment without checking active kit counts.
  5. **Prisma Unknown Argument Risk**: In `router.put("/:id")` and `router.post("/")`, `req.body` contains `adminOverrideReason: z.string().optional()`. Because `adminOverrideReason` is not a database column on model `Kit`, passing `...rest` without stripping `adminOverrideReason` throws a Prisma validation error.

---

### Observation 1.3: Frontend UI Integration for Epics 5 & 6
- **`src/pages/Stock.tsx`**:
  - Displays batch inventory rows with On Hand (`b.quantity`), Quarantined (`b.quarantinedQty`), and Available (`b.availableQty = quantity - quarantinedQty`).
  - Highlights low stock when `availableQty < reorderLevel`.
  - Quarantined badge displays when status is `'Quarantined'` or `quarantinedQty > 0`.
  - Currently loads state exclusively from client Zustand store. Needs live backend sync capability via `api.stockBalances` / `api.batches`.
- **`src/pages/StockAdjustments.tsx`**:
  - Tab 1 (Stock IN): Renders amber alert `isInApprovalRequired` for Risk Category III non-purchase corrections (`selectedInItem?.riskCategory === 'Category III' && inReasonCategory !== 'Purchase Receipt'`). Button transforms to "Submit for HSE Approval".
  - Tab 2 (Stock OUT): Renders amber alert `isOutApprovalRequired` for Risk Category III items (`selectedOutItem?.riskCategory === 'Category III'`).
  - Tab 4 (Queue): Role-guarded approval controls for HSE Supervisor / Admin (`canApprove`).
  - Non-zero quantity checks: Enforces `inQuantity > 0` and `outQuantity > 0` before submission.
- **`src/pages/Transfers.tsx` & `src/pages/TransferForm.tsx`**:
  - Evaluates condition matrix: `fromLoc?.stockCondition === 'Used' && toLoc?.stockCondition === 'New'` is blocked with an alert.
  - Does not currently guard against `fromLoc.stockCondition === 'Scrap'` (Rule G6: Scrap outbound blocked) or `toLoc.stockCondition === 'Scrap'` (Scrap inbound via transfer blocked).
- **`src/pages/Kits.tsx` & `src/pages/KitForm.tsx`**:
  - `Kits.tsx` contains job position filter dropdown (`positionFilter`) matching backend `GET /api/kits?jobPositionId=...`.
  - `KitForm.tsx` provides repeatable composition editor (`items: [{ ppeItemId, quantity }]`) with minimum 1 item requirement and inactive/trashed item warnings.
  - `AdminOverrideModal` was discarding the user-entered reason in `onConfirm` and passing a hardcoded string.
- **`src/lib/api.ts`**:
  - Missing specialized typed endpoints for `kits`, `deleteKit` (with override reason), `toggleActive`, and `checkInUse`.
  - `api.remove` did not support passing a JSON payload for DELETE requests.

---

## 2. Logic Chain

1. **Defect 6 Root Cause & Remediation**:
   - `T2-PPE-047-01` executes `GET /api/kits?jobPositionId=fake-job-position-9999`.
   - In `server/src/routes/kits.ts:18`, the handler builds `where: any = {}` but never references `req.query.jobPositionId`.
   - Adding `if (req.query.jobPositionId) where.jobPositionId = String(req.query.jobPositionId);` guarantees that filtering by job position scopes Prisma queries accurately and returns empty arrays when non-existent positions are requested.
   - Adding `if (req.query.active !== undefined) where.active = req.query.active === "true";` resolves `T1-PPE-031-04`.

2. **In-Use Protection (PPE-033, Rule G2) Logic**:
   - A kit is defined as in-use if:
     `activeIssuances > 0` (status in `["issued", "Active", "active"]`) OR `recentIssuances > 0` (timestamp within last 90 days via `issueDate` or `createdAt`).
   - If in-use:
     - Non-Admin user attempting deletion or deactivation -> HTTP 400 Bad Request ("Cannot delete/deactivate in-use Kit without Admin override").
     - Admin user attempting without reason -> HTTP 400 Bad Request ("Admin override reason is required to delete/deactivate in-use Kit").
     - Admin user with valid reason -> Mutation proceeds, recording `OVERRIDE_DELETE` or `OVERRIDE_DEACTIVATE` in `AuditLog` with `reason`.
   - If not in-use:
     - Deletion / deactivation proceeds normally and logs `SOFT_DELETED` / `DEACTIVATED`.

3. **Sole Active Kit Protection (PPE-030) Logic**:
   - When editing a kit via `PUT /api/kits/:id`, if `req.body.jobPositionId !== existing.jobPositionId`, the server checks whether `existing` was the sole active kit for that job position.
   - If sole active AND had issuances in the last 90 days, reassigning it away leaves that position with zero active safety kits.
   - Reassignment must therefore require Admin role and a non-empty `adminOverrideReason`.

4. **Frontend Integration & Rule G6 Logic**:
   - Stock transfers must strictly enforce Rule G6:
     1. `Used -> New`: BLOCKED.
     2. `Scrap -> Any`: BLOCKED (Scrap cannot leave facility via transfer).
     3. `Any -> Scrap`: BLOCKED (Stock can only enter Scrap via return or stock out, not inter-location transfer).
   - In `TransferForm.tsx`, adding these validations before invoking `transferStock` / `api.transfer` aligns UI validation directly with backend constraints.

---

## 3. Caveats

1. **Database Dialect**: SQLite is used in this environment. Case-insensitive string search in Prisma on SQLite relies on default collation; explicit `{ mode: "insensitive" }` must NOT be used on SQLite string fields.
2. **Dual-Path Data Layer**: The frontend codebase currently operates primarily through Zustand store mock state, while API routes communicate with SQLite. All proposed frontend improvements maintain full compatibility with both Zustand store calls and direct REST API invocation via `src/lib/api.ts`.
3. **Seed Data Invalidation**: `prisma/seed.ts` imports from `mockData.ts`. Ensure `npm run db:seed` is tested if database resets are performed.

---

## 4. Conclusion & Drop-In Code Implementations

### Change 1: `server/src/routes/kits.ts` (Complete Replacement File)
Target File: `server/src/routes/kits.ts`  
Resolves: Defect 6 (`jobPositionId` and `active` query filter), PPE-033 in-use deletion/deactivation protection, PPE-030 sole-active kit position reassignment protection, and `AuditLog` recording.

```typescript
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

// PPE-031 & Defect 6: List kits with search, pagination, jobPositionId, and active filters
router.get("/", asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const search = (req.query.search as string)?.toLowerCase();
  const includeDeleted = req.query.includeDeleted === "true";
  const jobPositionId = req.query.jobPositionId as string;
  const activeParam = req.query.active as string;

  const where: any = {};
  if (!includeDeleted) where.deletedAt = null;
  if (jobPositionId) where.jobPositionId = jobPositionId;
  if (activeParam !== undefined) where.active = activeParam === "true";
  if (search) where.OR = [{ nameEn: { contains: search } }, { nameAr: { contains: search } }];

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

// PPE-032: Retrieve kit details by ID
router.get("/:id", asyncHandler(async (req, res) => {
  const k = await prisma.kit.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { ppeItem: true } }, jobPosition: true },
  });
  if (!k) throw new ApiError(404, "Kit not found");
  res.json(k);
}));

// Helper: Check Kit In-Use status (active issuances or issuances within last 90 days)
async function checkKitInUse(kitId: string) {
  const activeIssuances = await prisma.issuance.count({
    where: { kitId, status: { in: ["issued", "Active", "active"] } },
  });
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recentIssuances = await prisma.issuance.count({
    where: {
      kitId,
      OR: [
        { issueDate: { gte: ninetyDaysAgo } },
        { createdAt: { gte: ninetyDaysAgo } },
      ],
    },
  });
  return {
    inUse: activeIssuances > 0 || recentIssuances > 0,
    activeIssuanceCount: activeIssuances,
    recentIssuanceCount: recentIssuances,
  };
}

// In-use query endpoint for pre-flight frontend checks
router.get("/:id/in-use", asyncHandler(async (req, res) => {
  const check = await checkKitInUse(req.params.id);
  res.json({
    inUse: check.inUse,
    activeIssuanceCount: check.activeIssuanceCount,
    recentIssuanceCount: check.recentIssuanceCount,
  });
}));

// PPE-029: Create new kit
router.post("/", authorize("Admin", "HSE Supervisor"), validate(kitSchema), asyncHandler(async (req, res) => {
  const { items, adminOverrideReason, ...rest } = req.body;
  const kit = await prisma.kit.create({ data: rest });
  for (const it of items) {
    await prisma.kitItem.create({
      data: {
        kitId: kit.id,
        ppeItemId: it.ppeItemId,
        qty: it.qty,
        variantKey: it.variantKey || null,
      },
    });
  }
  const full = await prisma.kit.findUnique({
    where: { id: kit.id },
    include: { items: { include: { ppeItem: true } }, jobPosition: true },
  });
  await prisma.auditLog.create({
    data: {
      entityType: "Kit",
      entityId: kit.id,
      action: "CREATED",
      performedBy: req.user!.id,
      afterValues: JSON.stringify(full),
    },
  });
  res.status(201).json(full);
}));

// PPE-030: Edit kit composition and quantities, with sole-active protection
router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(kitSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.kit.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!existing) throw new ApiError(404, "Kit not found");

  const { items, adminOverrideReason, ...rest } = req.body;

  // Protect changing job position of sole active kit with recent issuances
  if (rest.jobPositionId && rest.jobPositionId !== existing.jobPositionId) {
    const inUseCheck = await checkKitInUse(existing.id);
    if (inUseCheck.inUse) {
      const otherActiveKits = await prisma.kit.count({
        where: {
          jobPositionId: existing.jobPositionId,
          id: { not: existing.id },
          active: true,
          deletedAt: null,
        },
      });
      if (otherActiveKits === 0) {
        const isAdmin = req.user!.role === "Admin" || req.user!.role.replace(/_/g, " ") === "Admin";
        if (!isAdmin) {
          throw new ApiError(400, "Changing position of sole active kit with issuances in last 90 days requires Admin override");
        }
        if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
          throw new ApiError(400, "Admin override reason is required to change position of sole active kit");
        }
      }
    }
  }

  const kit = await prisma.kit.update({ where: { id: req.params.id }, data: rest });
  await prisma.kitItem.deleteMany({ where: { kitId: req.params.id } });
  for (const it of items) {
    await prisma.kitItem.create({
      data: {
        kitId: kit.id,
        ppeItemId: it.ppeItemId,
        qty: it.qty,
        variantKey: it.variantKey || null,
      },
    });
  }
  const full = await prisma.kit.findUnique({
    where: { id: kit.id },
    include: { items: { include: { ppeItem: true } }, jobPosition: true },
  });
  await prisma.auditLog.create({
    data: {
      entityType: "Kit",
      entityId: kit.id,
      action: "UPDATED",
      performedBy: req.user!.id,
      reason: adminOverrideReason?.trim() || undefined,
      beforeValues: JSON.stringify(existing),
      afterValues: JSON.stringify(full),
    },
  });
  res.json(full);
}));

// PPE-031: Toggle active status with in-use protection
router.patch("/:id/active", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
  const { active, adminOverrideReason } = req.body;
  if (typeof active !== "boolean") throw new ApiError(400, "active boolean required");

  if (!active) {
    const inUseCheck = await checkKitInUse(req.params.id);
    if (inUseCheck.inUse) {
      const isAdmin = req.user!.role === "Admin" || req.user!.role.replace(/_/g, " ") === "Admin";
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
          performedBy: req.user!.id,
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
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(existing),
      afterValues: JSON.stringify(kit),
    },
  });
  res.json(kit);
}));

// PPE-033: Soft delete kit to trash bin with in-use protection
router.delete("/:id", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
  const kit = await prisma.kit.findUnique({ where: { id: req.params.id } });
  if (!kit) throw new ApiError(404, "Kit not found");

  const adminOverrideReason = req.body?.adminOverrideReason || (req.query.adminOverrideReason as string);
  const inUseCheck = await checkKitInUse(req.params.id);

  if (inUseCheck.inUse) {
    const isAdmin = req.user!.role === "Admin" || req.user!.role.replace(/_/g, " ") === "Admin";
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
        performedBy: req.user!.id,
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
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(kit),
    },
  });
  res.json({ message: "Soft deleted" });
}));

// PPE-033: Restore soft-deleted kit from trash
router.post("/:id/restore", authorize("Admin"), asyncHandler(async (req, res) => {
  const existing = await prisma.kit.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!existing) throw new ApiError(404, "Kit not found");
  const k = await prisma.kit.update({
    where: { id: req.params.id },
    data: { active: true, deletedAt: null },
    include: { items: { include: { ppeItem: true } }, jobPosition: true },
  });
  await prisma.auditLog.create({
    data: {
      entityType: "Kit",
      entityId: k.id,
      action: "RESTORED",
      performedBy: req.user!.id,
      beforeValues: JSON.stringify(existing),
      afterValues: JSON.stringify(k),
    },
  });
  res.json(k);
}));

export default router;
```

---

### Change 2: `src/lib/api.ts` (API Client Enhancements)
Target File: `src/lib/api.ts`  
Enhances `api.remove`, adds `toggleActive`, `checkInUse`, and explicit `kits` API methods.

```typescript
// Add to api object in src/lib/api.ts:

  // Enhanced remove helper accepting optional payload (e.g. { adminOverrideReason })
  remove: (resource: string, id: string, dataOrToken?: any, token?: string) => {
    let body: any;
    let t: string | undefined = token;
    if (typeof dataOrToken === "string") {
      t = dataOrToken;
    } else if (dataOrToken && typeof dataOrToken === "object") {
      body = JSON.stringify(dataOrToken);
    }
    return request(`/api/${resource}/${id}`, { method: "DELETE", body, token: t } as any);
  },

  // Generic in-use check
  checkInUse: (resource: string, id: string, token?: string) =>
    request<{ inUse: boolean; activeIssuanceCount?: number; recentIssuanceCount?: number }>(
      `/api/${resource}/${id}/in-use`,
      { token } as any
    ),

  // Generic active status toggle
  toggleActive: (resource: string, id: string, active: boolean, adminOverrideReason?: string, token?: string) =>
    request(`/api/${resource}/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active, adminOverrideReason }),
      token,
    } as any),

  // Dedicated Kit endpoints
  kits: (params?: { page?: number; limit?: number; search?: string; jobPositionId?: string; active?: boolean | string; includeDeleted?: boolean }, token?: string) =>
    api.list<any>("kits", params, token),
  kit: (id: string, token?: string) => api.get<any>("kits", id, token),
  createKit: (data: any, token?: string) => api.create<any>("kits", data, token),
  updateKit: (id: string, data: any, token?: string) => api.update<any>("kits", id, data, token),
  deleteKit: (id: string, adminOverrideReason?: string, token?: string) =>
    api.remove("kits", id, adminOverrideReason ? { adminOverrideReason } : undefined, token),
  restoreKit: (id: string, token?: string) => api.restore<any>("kits", id, token),
```

---

### Change 3: `src/pages/Kits.tsx` (Admin Override Modal Pass-Through)
Target File: `src/pages/Kits.tsx`  
Ensure user-provided override reason is delivered to `saveKit`, `trashKit`, or `deleteKit`.

**Lines 301–305**:
```tsx
// Before:
        onConfirm={(reason) => {
          overrideModal.action();
          setOverrideModal({ isOpen: false, title: '', warning: '', action: () => {} });
        }}

// After:
        onConfirm={(reason) => {
          overrideModal.action(reason);
          setOverrideModal({ isOpen: false, title: '', warning: '', action: () => {} });
        }}
```
**Lines 34–39**:
Update `overrideModal` type signature to accept `(reason?: string) => void`.

---

### Change 4: `src/pages/TransferForm.tsx` (Rule G6 Full Enforcement)
Target File: `src/pages/TransferForm.tsx`  
Enforces complete Rule G6 condition rules (Used->New blocked, Scrap outbound blocked, Scrap inbound via transfer blocked).

**Lines 78–100**:
```typescript
  // Rule G6 Condition Routing Rule Validation
  const isUsedToNewBlocked = fromLoc?.stockCondition === 'Used' && toLoc?.stockCondition === 'New';
  const isFromScrapBlocked = fromLoc?.stockCondition === 'Scrap';
  const isToScrapBlocked = toLoc?.stockCondition === 'Scrap';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fromLocId === toLocId) {
      setError('Source and destination locations must be different.');
      return;
    }

    if (!selectedBatch) {
      setError('Please select an active batch with available stock.');
      return;
    }

    if (quantity <= 0 || quantity > selectedBatch.availableQty) {
      setError(`Transfer quantity must be between 1 and ${selectedBatch.availableQty}.`);
      return;
    }

    if (isFromScrapBlocked) {
      setError('Stock in Scrap location cannot be transferred (Rule G6).');
      return;
    }

    if (isToScrapBlocked) {
      setError('Stock can only enter Scrap via return or stock out, not transfer (Rule G6).');
      return;
    }

    if (isUsedToNewBlocked) {
      setError('Transfer from a Used-condition location to a New-condition location is strictly BLOCKED (Rule G6).');
      return;
    }
```

---

## 5. Verification Method

### Test Invocations
1. **Targeted Defect 6 Verification**:
   ```powershell
   npx tsx -e "
     import { epic09BoundariesSuite } from './tests/e2e/tier2_boundaries/epic09_boundaries.test.js';
     // Run T2-PPE-047-01
   "
   ```
   Or execute the full runner:
   ```powershell
   npm run test:e2e
   ```
2. **Kits Feature Tests**:
   Inspect output for `Tier 1 - Epic 6: Kit Management (PPE-029 to PPE-033)`:
   - `T1-PPE-029-01` through `05` (Kit creation & line items) -> PASS
   - `T1-PPE-030-01` through `05` (Kit editing & audit logging) -> PASS
   - `T1-PPE-031-01` through `05` (Kits filtering by `jobPositionId` and `active`) -> PASS
   - `T1-PPE-032-01` through `05` (Kit details retrieval) -> PASS
   - `T1-PPE-033-01` through `05` (Soft delete & restore) -> PASS
3. **Kits Boundary Tests**:
   Inspect output for `Tier 2 - Epic 6: Kit Boundaries & Error Handling`:
   - `T2-PPE-029-01` to `T2-PPE-033-05` (400 on empty items, 403 on worker mutation, 404 on invalid ID) -> PASS
   - `T2-PPE-047-01` (`/api/kits?jobPositionId=fake-job-position-9999`) -> PASS (0 records returned)
4. **TypeScript Build Verification**:
   ```powershell
   npm run build
   npm run build:server
   ```
   Must succeed with zero diagnostic errors.

### Invalidation Conditions
- If querying `GET /api/kits?jobPositionId=non-existent-id` returns a status other than 200 or an array with length > 0, the Defect 6 fix is incomplete.
- If deleting an in-use kit succeeds without `adminOverrideReason` or with a non-admin token, in-use protection is broken.
- If transferring from `Used` to `New` or from/to `Scrap` succeeds with HTTP 200, Rule G6 condition protection is invalidated.
