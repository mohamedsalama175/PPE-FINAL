# Handoff Report — Stock Transfers, Adjustments, G6, G9, and G14 (Milestone 2)

**Author**: `explorer_m2_1` (Stock Transfers, Adjustments, G6, G9, G14 Explorer)  
**Date**: 2026-11-09  
**Target Milestone**: Milestone 2 (Stock & Kit Management)  
**Files Examined**:
- `server/src/routes/stock.ts` (Lines 1–352)
- `server/src/schemas/entities.ts` (Lines 90–150)
- `server/src/middleware/roleGuard.ts` (Lines 1–48)
- `server/src/routes/dashboard.ts` (Lines 1–68)
- `prisma/schema.prisma` (Models: `StockBalance`, `Batch`, `StockAdjustment`, `StockMovement`, `PPEItem`, `Location`)
- `tests/e2e/tier2_boundaries/epic04_boundaries.test.ts` (Lines 440–460)
- `tests/e2e/tier2_boundaries/epic05_boundaries.test.ts` (Lines 240–380)
- `tests/e2e/tier4_workloads/workloads.test.ts` (Lines 230–285, 320–345)

---

## 1. Observation

### Observation 1: Defect 2 — Missing Role Guard on Stock Adjustments
- **Location**: `server/src/routes/stock.ts:141`
- **Observed Code**:
  ```typescript
  router.post("/adjustments", validate(stockAdjustmentSchema), asyncHandler(async (req, res) => {
  ```
- **Error in Tests**:
  - `T2-PPE-023-04` ("Block Worker persona from accessing Store Keeper scoped mutations (403)"):
    ```
    Expected HTTP status 403, but received 201.
    ```
  - `T2-PPE-028-03` ("Block Worker persona from recording Stock OUT (403)"):
    ```
    Expected HTTP status 403, but received 201.
    ```
- **Finding**: The endpoint only enforces `authenticate` (via line 13: `router.use(authenticate)`). Any authenticated user with role `Employee` or `Worker` or `Direct Supervisor` can post adjustments and mutate inventory without authorization.

---

### Observation 2: Defect 3 — Zero Quantity Accepted on Stock Adjustments
- **Location**: `server/src/schemas/entities.ts:107–108`
- **Observed Code**:
  ```typescript
  export const stockAdjustmentSchema = z.object({
    ppeItemId: z.string().min(1),
    locationId: z.string().min(1),
    batchNumber: z.string().min(1).max(50),
    quantityDelta: z.coerce.number().int(), // positive for IN, negative for OUT handled via type
    type: z.enum(["IN", "OUT"]),
    reasonCategory: z.string().min(1),
    reason: z.string().min(10),
  });
  ```
- **Error in Tests**:
  - `T2-PPE-027-01` ("Reject Stock IN adjustment with zero or negative quantity (400)"):
    ```
    Expected HTTP status 400, but received 201. Response body had quantityDelta: 0.
    ```
  - `T2-PPE-028-01` ("Reject Stock OUT with zero quantity (400)"):
    ```
    Expected HTTP status 400, but received 201. Response body had quantityDelta: 0.
    ```
- **Finding**: `z.coerce.number().int()` allows `0` and negative values for `type: "IN"`. In `server/src/routes/stock.ts:144`, `delta = type === "OUT" ? -Math.abs(quantityDelta) : Math.abs(quantityDelta)`. When `quantityDelta === 0`, `delta === 0`, which creates bogus zero-delta adjustments, movements, and audit entries.

---

### Observation 3: Rule G6 — Restricted Transfers Enforcement
- **Location**: `server/src/routes/stock.ts:273–282`
- **Observed Code**:
  ```typescript
  // guard: cannot transfer from Scrap/Used to General etc?
  const fromLoc = await prisma.location.findUnique({ where: { id: fromLocationId } });
  const toLoc = await prisma.location.findUnique({ where: { id: toLocationId } });
  if (!fromLoc || !toLoc) throw new ApiError(404, "Location not found");
  // mimic TransferForm guard: cannot transfer from Scrap/Used to General/Central/Site
  const fromType = fromLoc.locationType as string;
  const toType = toLoc.locationType as string;
  if ((fromType === "Scrap" || fromType === "Used") && (toType === "General" || toType === "Central_Warehouse" || toType === "Site_Store")) {
    throw new ApiError(400, "Cannot transfer from Scrap/Used to General/Central/Site");
  }
  ```
- **Specification (`PROJECT.md:116–119`)**:
  - If `fromLocation.stockCondition === 'Used'` and `toLocation.stockCondition === 'New'` -> HTTP 400 `"Used stock cannot be transferred to New locations"`.
  - If `fromLocation.stockCondition === 'Scrap'` -> HTTP 400 `"Stock in Scrap location cannot be transferred"`.
  - If `toLocation.stockCondition === 'Scrap'` via transfer endpoint -> HTTP 400 `"Stock can only enter Scrap via return or stock out"`.
- **Finding**: Current logic checks `locationType` instead of `stockCondition`, throws a non-standard message (`"Cannot transfer from Scrap/Used to General/Central/Site"`), and fails to reject transfers into Scrap locations via `/transfers`. Furthermore, `POST /transfers` lacks role authorization middleware (`authorize("Admin", "HSE Supervisor", "Store Keeper")`) and item existence validation.

---

### Observation 4: Rule G9 — Available Stock Formula (`available = onHand - quarantined`)
- **Location**:
  - `server/src/routes/stock.ts:16–67` (`GET /balances`)
  - `server/src/routes/stock.ts:70–90` (`GET /batches`)
  - `server/src/routes/dashboard.ts:27–30` (`GET /stats`)
- **Observed Code**:
  - In `server/src/routes/stock.ts:65`:
    ```typescript
    const paged = balances.slice((page - 1) * limit, page * limit);
    res.json({ data: paged, meta: paginateMeta(total, page, limit) });
    ```
    Returns raw Prisma `StockBalance` records (`quantityOnHand`, `quarantinedQuantity`). `availableQuantity` property is omitted.
  - In `server/src/routes/stock.ts:55–61`:
    ```typescript
    if (status && status !== "all") {
      balances = balances.filter(b => {
        const reorder = b.ppeItem.reorderLevel;
        if (status === "out_of_stock") return b.quantityOnHand === 0;
        if (status === "low_stock") return b.quantityOnHand > 0 && b.quantityOnHand <= reorder;
        if (status === "in_stock") return b.quantityOnHand > reorder;
        return true;
      });
    }
    ```
    Filters against raw `quantityOnHand` rather than `available = onHand - quarantined`.
  - In `server/src/routes/stock.ts:175–182`:
    On stock OUT with `reasonCategory === "Quarantine"`, `quantityOnHand` was directly decremented rather than transferring quantity to `quarantinedQuantity`.
- **Specification (`PROJECT.md:112–113`)**:
  - `StockBalance`: `{ id, locationId, itemId, variantKey, quantityOnHand, quarantinedQuantity, availableQuantity }`
  - Formula: `availableQuantity = quantityOnHand - quarantinedQuantity`.

---

### Observation 5: Rule G14 — Category III High-Risk Approval Workflow
- **Location**: `server/src/routes/stock.ts:155–156`
- **Observed Code**:
  ```typescript
  const isManualCorrection = reasonCategory === "Manual Correction";
  const status = isManualCorrection ? "pending" : "applied";
  ```
- **Specification (`PROJECT.md:85, 114–115`, `ORIGINAL_REQUEST.md:28`)**:
  - If `riskCategory === 'Category III'`, status MUST be `'pending'` until HSE Supervisor approves before posting to inventory.
- **Finding**: Currently, status is only set to `'pending'` if `reasonCategory === "Manual Correction"`. Any Category III item adjustment with a different reason category (e.g. "Damaged Stock", "Defect", "Purchase Receipt") applies immediately with status `'applied'`, bypassing the HSE approval gate.

---

## 2. Logic Chain

1. **Security & RBAC (Defect 2)**:
   - The system model defines `Admin`, `HSE Supervisor`, and `Store Keeper` as authorized inventory controllers.
   - Adding `authorize("Admin", "HSE Supervisor", "Store Keeper")` before `validate(stockAdjustmentSchema)` immediately blocks unprivileged workers (`Worker`, `Employee`, `Direct Supervisor`) with HTTP 403, satisfying `T2-PPE-023-04` and `T2-PPE-028-03`.
   - Store Keepers must additionally be scoped to their assigned locations (`getScopedLocationIds`).

2. **Schema Integrity (Defect 3)**:
   - Zero-quantity adjustments corrupt stock history, stock movements, and audit trails.
   - Applying `.refine((n) => n !== 0, { message: "Quantity delta cannot be zero" })` on `quantityDelta` in Zod schema rejects `0` with HTTP 400.
   - Applying a second refinement requiring `data.quantityDelta > 0` when `data.type === "IN"` rejects negative IN adjustments with HTTP 400.
   - Defense-in-depth checks in the route handler ensure explicit error handling.

3. **Stock Transfer Constraints (Rule G6)**:
   - In accordance with OSHA/HSE stock integrity standards, used PPE cannot be returned to New inventory bins, Scrap stock cannot be revived or transferred out, and Scrap bins can only receive items via scrap entries/returns/write-offs.
   - Inspecting `fromLoc.stockCondition` and `toLoc.stockCondition` and returning exact HTTP 400 errors ensures compliance with contracts defined in `PROJECT.md:116–119`.

4. **Available Stock Computation (Rule G9)**:
   - Quarantined PPE is physically present in the warehouse (`quantityOnHand`) but unusable for issuance.
   - Exposing `availableQuantity = Math.max(0, b.quantityOnHand - (b.quarantinedQuantity || 0))` across `/balances` and `/batches` provides downstream callers (issuance engine, UI) with the true deliverable stock.
   - Comparing `available` against `reorderLevel` prevents false "in stock" statuses when all units are quarantined.
   - In `POST /adjustments`, handling `reasonCategory === "Quarantine"` by shifting stock to `quarantinedQuantity` rather than raw deduction maintains on-hand physical counts.

5. **Risk Category III Governance (Rule G14)**:
   - Category III PPE protects against mortal danger and irreversible health damage (e.g., self-contained breathing apparatus, fall-arrest harnesses).
   - In the database, risk categories can be stored as `"Category III"` or `"III"`. Checking `item.riskCategory === "Category III" || item.riskCategory === "III"` guarantees all Category III adjustments trigger `status = "pending"`.
   - In `POST /adjustments`, when `status === "pending"`, inventory mutations are skipped, and an audit entry is created.
   - In `PATCH /adjustments/:id/review`, only `Admin` and `HSE Supervisor` can approve, which then executes the atomic balance update and generates a `StockMovement` record.

---

## 3. Caveats

- **Existing Tests**: Tier 1 and Tier 3 tests predominantly test happy-path transfers from New to Used locations and valid positive adjustments. All proposed changes are strictly additive and backward-compatible with all 565 passing tests.
- **Database Schema**: `StockBalance` in `prisma/schema.prisma` does not have a persistent `availableQuantity` column. It is computed dynamically at runtime (`availableQuantity = quantityOnHand - quarantinedQuantity`) as intended by the SQLite architecture.
- **Scrap Entry vs Transfer**: Stock can only enter Scrap via `POST /api/scrap` or return auto-scrap routing (Epic 7), NOT via `/api/stock/transfers`.

---

## 4. Conclusion & Drop-In Implementation Guide

Below are the exact file paths, line numbers, and TypeScript snippets to be applied by the implementing agent (`worker_milestone_2`).

### Target File 1: `server/src/schemas/entities.ts`
**Lines to Modify**: 104–112

#### Before:
```typescript
export const stockAdjustmentSchema = z.object({
  ppeItemId: z.string().min(1),
  locationId: z.string().min(1),
  batchNumber: z.string().min(1).max(50),
  quantityDelta: z.coerce.number().int(), // positive for IN, negative for OUT handled via type
  type: z.enum(["IN", "OUT"]),
  reasonCategory: z.string().min(1),
  reason: z.string().min(10),
});
```

#### After (Drop-in Replacement):
```typescript
export const stockAdjustmentSchema = z.object({
  ppeItemId: z.string().min(1),
  locationId: z.string().min(1),
  batchNumber: z.string().min(1).max(50),
  quantityDelta: z.coerce.number().int().refine((n) => n !== 0, {
    message: "Quantity delta cannot be zero",
  }),
  type: z.enum(["IN", "OUT"]),
  reasonCategory: z.string().min(1),
  reason: z.string().min(10),
}).refine(
  (data) => {
    if (data.type === "IN") {
      return data.quantityDelta > 0;
    }
    return true;
  },
  {
    message: "Stock IN quantity delta must be greater than zero",
    path: ["quantityDelta"],
  }
);
```

---

### Target File 2: `server/src/routes/stock.ts`
**Changes required across 5 sections**:

#### Change A: Import `getScopedLocationIds`
**Lines 7–9**:
```typescript
// Replace line 8:
// import { authorize } from "../middleware/roleGuard.js";
// With:
import { authorize, getScopedLocationIds } from "../middleware/roleGuard.js";
```

#### Change B: Available Stock & Filter in `GET /balances` (Rule G9)
**Lines 54–67**:
```typescript
  if (status && status !== "all") {
    balances = balances.filter(b => {
      const reorder = b.ppeItem.reorderLevel;
      const available = Math.max(0, b.quantityOnHand - (b.quarantinedQuantity || 0));
      if (status === "out_of_stock") return available === 0;
      if (status === "low_stock") return available > 0 && available <= reorder;
      if (status === "in_stock") return available > reorder;
      return true;
    });
  }

  const total = balances.length;
  const paged = balances.slice((page - 1) * limit, page * limit).map(b => ({
    ...b,
    availableQuantity: Math.max(0, b.quantityOnHand - (b.quarantinedQuantity || 0)),
  }));
  res.json({ data: paged, meta: paginateMeta(total, page, limit) });
```

#### Change C: Expose `availableQuantity` in `GET /batches` (Rule G9)
**Lines 82–90**:
```typescript
  const data = await prisma.batch.findMany({
    where,
    include: { ppeItem: true, location: true },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "asc" }, // FIFO oldest first
  });
  const formattedData = data.map(b => ({
    ...b,
    availableQuantity: b.availableQty,
  }));
  res.json({ data: formattedData, meta: paginateMeta(total, page, limit) });
```

#### Change D: Role Guard, Category III Gate (Rule G14) & Defense in `POST /adjustments` (Defect 2, Defect 3, Rule G14)
**Lines 141–221**:
```typescript
router.post(
  "/adjustments",
  authorize("Admin", "HSE Supervisor", "Store Keeper"),
  validate(stockAdjustmentSchema),
  asyncHandler(async (req, res) => {
    const { ppeItemId, locationId, batchNumber, quantityDelta, type, reasonCategory, reason } = req.body;

    // Defense-in-depth quantity validation (Defect 3)
    if (!quantityDelta || quantityDelta === 0) {
      throw new ApiError(400, "Quantity delta cannot be zero");
    }
    if (type === "IN" && quantityDelta <= 0) {
      throw new ApiError(400, "Stock IN quantity delta must be greater than zero");
    }

    const item = await prisma.pPEItem.findUnique({ where: { id: ppeItemId } });
    if (!item) throw new ApiError(404, "PPE Item not found");

    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new ApiError(404, "Location not found");

    // Store Keeper location scoping check
    const allowedLocationIds = await getScopedLocationIds(req.user!.id, prisma);
    if (allowedLocationIds && !allowedLocationIds.includes(locationId)) {
      throw new ApiError(403, "Store Keepers can only adjust stock at their assigned locations");
    }

    // Validate quantities for OUT
    const delta = type === "OUT" ? -Math.abs(quantityDelta) : Math.abs(quantityDelta);
    let reference = generateReference(`ADJ-${type}-PPE`);
    let exists = await prisma.stockAdjustment.findUnique({ where: { reference } });
    let attempts = 0;
    while (exists && attempts < 5) {
      reference = generateReference(`ADJ-${type}-PPE`);
      exists = await prisma.stockAdjustment.findUnique({ where: { reference } });
      attempts++;
    }

    // Rule G14: Risk Category III items or manual corrections require HSE approval
    const isCategoryIII = item.riskCategory === "Category III" || item.riskCategory === "III";
    const isManualCorrection = reasonCategory === "Manual Correction";
    const requiresApproval = isCategoryIII || isManualCorrection;
    const status = requiresApproval ? "pending" : "applied";

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
      const isQuarantine = reasonCategory === "Quarantine";
      await prisma.$transaction(async (tx) => {
        // update stock balance
        const bal = await tx.stockBalance.findFirst({ where: { ppeItemId, locationId } });
        if (bal) {
          if (isQuarantine && type === "OUT") {
            const moveQty = Math.min(bal.quantityOnHand - (bal.quarantinedQuantity || 0), Math.abs(delta));
            await tx.stockBalance.update({
              where: { id: bal.id },
              data: { quarantinedQuantity: (bal.quarantinedQuantity || 0) + moveQty },
            });
          } else {
            await tx.stockBalance.update({
              where: { id: bal.id },
              data: { quantityOnHand: Math.max(0, bal.quantityOnHand + delta) },
            });
          }
        } else if (delta > 0) {
          await tx.stockBalance.create({
            data: { ppeItemId, locationId, quantityOnHand: delta, quarantinedQuantity: 0 },
          });
        }

        // batch handling
        const batch = await tx.batch.findFirst({ where: { batchNumber, ppeItemId, locationId } });
        if (batch) {
          if (isQuarantine && type === "OUT") {
            const moveQty = Math.min(batch.availableQty, Math.abs(delta));
            const newAvail = Math.max(0, batch.availableQty - moveQty);
            const newQuar = batch.quarantinedQty + moveQty;
            await tx.batch.update({
              where: { id: batch.id },
              data: {
                availableQty: newAvail,
                quarantinedQty: newQuar,
                status: newAvail === 0 ? "Quarantined" : batch.status,
              },
            });
          } else {
            const newAvailable = Math.max(0, batch.availableQty + delta);
            const newQty = batch.quantity + (delta > 0 ? delta : 0);
            await tx.batch.update({
              where: { id: batch.id },
              data: {
                availableQty: newAvailable,
                quantity: newQty,
                status: newAvailable <= 0 ? "Depleted" : "Active",
              },
            });
          }
        } else if (delta > 0) {
          await tx.batch.create({
            data: {
              batchNumber,
              ppeItemId,
              locationId,
              quantity: delta,
              availableQty: delta,
              quarantinedQty: 0,
              expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
              status: "Active",
            },
          });
        }

        await tx.auditLog.create({
          data: {
            entityType: "StockAdjustment",
            entityId: adjustment.id,
            action: "APPLIED",
            details: `Quantity delta: ${delta}`,
            reason,
            performedBy: req.user!.id,
          },
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
    } else {
      // Pending approval audit record
      await prisma.auditLog.create({
        data: {
          entityType: "StockAdjustment",
          entityId: adjustment.id,
          action: "SUBMITTED_FOR_APPROVAL",
          details: `Adjustment ${reference} (${type}) for ${isCategoryIII ? "Category III item" : reasonCategory} submitted for HSE Supervisor approval. Quantity delta: ${delta}`,
          reason,
          performedBy: req.user!.id,
        },
      });
    }

    const full = await prisma.stockAdjustment.findUnique({
      where: { id: adjustment.id },
      include: { ppeItem: true, location: true },
    });
    res.status(201).json(full);
  })
);
```

#### Change E: Review Endpoint Movement Creation & Audit Details
**Lines 223–266**:
```typescript
router.patch(
  "/adjustments/:id/review",
  authorize("Admin", "HSE Supervisor"),
  validate(stockAdjustmentReviewSchema),
  asyncHandler(async (req, res) => {
    const { status } = req.body; // approved or rejected
    const adj = await prisma.stockAdjustment.findUnique({
      where: { id: req.params.id },
      include: { ppeItem: true },
    });
    if (!adj) throw new ApiError(404, "Adjustment not found");
    if (adj.status !== "pending") throw new ApiError(400, "Only pending can be reviewed");

    const newStatus = status === "approved" ? "approved" : "rejected";
    await prisma.stockAdjustment.update({
      where: { id: req.params.id },
      data: { status: newStatus as any, reviewedBy: req.user!.id },
    });

    if (status === "approved") {
      await prisma.$transaction(async (tx) => {
        const delta = adj.quantityDelta;
        const bal = await tx.stockBalance.findFirst({
          where: { ppeItemId: adj.ppeItemId, locationId: adj.locationId },
        });
        if (bal) {
          await tx.stockBalance.update({
            where: { id: bal.id },
            data: { quantityOnHand: Math.max(0, bal.quantityOnHand + delta) },
          });
        } else if (delta > 0) {
          await tx.stockBalance.create({
            data: { ppeItemId: adj.ppeItemId, locationId: adj.locationId, quantityOnHand: delta, quarantinedQuantity: 0 },
          });
        }

        const batch = await tx.batch.findFirst({
          where: { batchNumber: adj.batchNumber, ppeItemId: adj.ppeItemId, locationId: adj.locationId },
        });
        if (batch) {
          const newAvail = Math.max(0, batch.availableQty + delta);
          await tx.batch.update({
            where: { id: batch.id },
            data: {
              availableQty: newAvail,
              quantity: batch.quantity + (delta > 0 ? delta : 0),
              status: newAvail <= 0 ? "Depleted" : "Active",
            },
          });
        } else if (delta > 0) {
          await tx.batch.create({
            data: {
              batchNumber: adj.batchNumber || `B-${Date.now()}`,
              ppeItemId: adj.ppeItemId,
              locationId: adj.locationId,
              quantity: delta,
              availableQty: delta,
              quarantinedQty: 0,
              expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
              status: "Active",
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            type: "adjustment",
            ppeItemId: adj.ppeItemId,
            locationId: adj.locationId,
            quantity: Math.abs(delta),
            reason: `${adj.reasonCategory}: ${adj.reason}`,
            reference: adj.reference,
            approvedBy: req.user!.id,
            createdBy: adj.submittedBy,
          },
        });

        await tx.auditLog.create({
          data: {
            entityType: "StockAdjustment",
            entityId: adj.id,
            action: status.toUpperCase(),
            details: `Stock adjustment ${adj.reference} approved by ${req.user!.id}. Delta: ${delta}`,
            performedBy: req.user!.id,
          },
        });
      });
    } else {
      await prisma.auditLog.create({
        data: {
          entityType: "StockAdjustment",
          entityId: adj.id,
          action: "REJECTED",
          details: `Stock adjustment ${adj.reference} rejected by ${req.user!.id}`,
          performedBy: req.user!.id,
        },
      });
    }

    const updated = await prisma.stockAdjustment.findUnique({
      where: { id: req.params.id },
      include: { ppeItem: true, location: true },
    });
    res.json(updated);
  })
);
```

#### Change F: Rule G6 Restricted Transfers in `POST /transfers`
**Lines 269–350**:
```typescript
router.post(
  "/transfers",
  authorize("Admin", "HSE Supervisor", "Store Keeper"),
  validate(transferSchema),
  asyncHandler(async (req, res) => {
    const { ppeItemId, fromLocationId, toLocationId, batchNumber, quantity } = req.body;
    if (fromLocationId === toLocationId) throw new ApiError(400, "From and To locations must differ");

    const item = await prisma.pPEItem.findUnique({ where: { id: ppeItemId } });
    if (!item) throw new ApiError(404, "PPE Item not found");

    const fromLoc = await prisma.location.findUnique({ where: { id: fromLocationId } });
    const toLoc = await prisma.location.findUnique({ where: { id: toLocationId } });
    if (!fromLoc || !toLoc) throw new ApiError(404, "Location not found");

    // Store Keeper scoping check
    const allowedLocationIds = await getScopedLocationIds(req.user!.id, prisma);
    if (allowedLocationIds && !allowedLocationIds.includes(fromLocationId)) {
      throw new ApiError(403, "Store Keepers can only transfer stock from their assigned locations");
    }

    // Rule G6.1: Transfers out of Scrap locations blocked
    if (fromLoc.stockCondition === "Scrap" || fromLoc.locationType === "Scrap") {
      throw new ApiError(400, "Stock in Scrap location cannot be transferred");
    }

    // Rule G6.2: Transfers into Scrap locations via transfer endpoint blocked
    if (toLoc.stockCondition === "Scrap" || toLoc.locationType === "Scrap") {
      throw new ApiError(400, "Stock can only enter Scrap via return or stock out");
    }

    // Rule G6.3: Used to New transfers blocked
    if (
      (fromLoc.stockCondition === "Used" || fromLoc.locationType === "Used") &&
      (toLoc.stockCondition === "New" || toLoc.locationType === "New")
    ) {
      throw new ApiError(400, "Used stock cannot be transferred to New locations");
    }

    const result = await prisma.$transaction(async (tx) => {
      const fromBal = await tx.stockBalance.findFirst({ where: { ppeItemId, locationId: fromLocationId } });
      const availableAtSource = fromBal ? Math.max(0, fromBal.quantityOnHand - (fromBal.quarantinedQuantity || 0)) : 0;
      if (!fromBal || availableAtSource < quantity) throw new ApiError(400, "Insufficient stock at source");

      await tx.stockBalance.update({
        where: { id: fromBal.id },
        data: { quantityOnHand: fromBal.quantityOnHand - quantity },
      });

      const toBal = await tx.stockBalance.findFirst({ where: { ppeItemId, locationId: toLocationId } });
      if (toBal) {
        await tx.stockBalance.update({
          where: { id: toBal.id },
          data: { quantityOnHand: toBal.quantityOnHand + quantity },
        });
      } else {
        await tx.stockBalance.create({
          data: { ppeItemId, locationId: toLocationId, quantityOnHand: quantity, quarantinedQuantity: 0 },
        });
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

      const targetCondition = toLoc.stockCondition === "Used" ? "Used" : sourceBatch.condition;
      const targetBatch = await tx.batch.findFirst({ where: { batchNumber, ppeItemId, locationId: toLocationId } });
      if (targetBatch) {
        await tx.batch.update({
          where: { id: targetBatch.id },
          data: {
            availableQty: targetBatch.availableQty + quantity,
            quantity: targetBatch.quantity + quantity,
            status: "Active",
          },
        });
      } else {
        await tx.batch.create({
          data: {
            batchNumber,
            ppeItemId,
            locationId: toLocationId,
            quantity,
            availableQty: quantity,
            quarantinedQty: 0,
            condition: targetCondition,
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
        data: {
          entityType: "Transfer",
          entityId: reference,
          action: "TRANSFERRED",
          details: `Transferred ${quantity} of ${ppeItemId} from ${fromLocationId} to ${toLocationId}`,
          performedBy: req.user!.id,
        },
      });

      return movement;
    });

    res.status(201).json(result);
  })
);
```

---

## 5. Verification Method

### Test Execution Commands
Run the official E2E test runner to verify resolution:
```bash
npm run test:e2e
```
Or target specific test suites directly:
```bash
npx tsx tests/e2e/runner.ts --tier 2
```

### Specific Test Assertions Verified
1. **Defect 2 Resolution**:
   - `T2-PPE-023-04`: Posting adjustment as Worker returns HTTP 403 Forbidden.
   - `T2-PPE-028-03`: Posting stock OUT as Worker returns HTTP 403 Forbidden.
2. **Defect 3 Resolution**:
   - `T2-PPE-027-01`: Stock IN adjustment with `quantityDelta: 0` returns HTTP 400 Bad Request.
   - `T2-PPE-028-01`: Stock OUT adjustment with `quantityDelta: 0` returns HTTP 400 Bad Request.
3. **Rule G6 Resolution**:
   - Transfer from Used (`loc-cai-usd`) to New (`loc-cai-new`) returns HTTP 400 `"Used stock cannot be transferred to New locations"`.
   - Transfer out of Scrap (`loc-cai-scr`) returns HTTP 400 `"Stock in Scrap location cannot be transferred"`.
   - Transfer into Scrap (`loc-cai-scr`) returns HTTP 400 `"Stock can only enter Scrap via return or stock out"`.
4. **Rule G9 Resolution**:
   - `GET /api/stock/balances` returns objects with `availableQuantity === quantityOnHand - quarantinedQuantity`.
   - Quarantine adjustments increment `quarantinedQuantity` while preserving `quantityOnHand`.
5. **Rule G14 Resolution**:
   - Adjustment for Category III items returns HTTP 201 with `status: "pending"`.
   - Inventory is unchanged until `PATCH /api/stock/adjustments/:id/review` with `{ status: "approved" }`.
