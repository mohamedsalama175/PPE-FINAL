import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertSuccess } from "../harness/assertions.js";

export const epic05StockSuite: TestSuite = {
  name: "Tier 1 - Epic 5: Stock Operations (PPE-024 to PPE-028)",
  tier: 1,
  tests: [
    // PPE-024: Transfer Stock (5 tests)
    {
      id: "T1-PPE-024-01",
      featureId: "PPE-024",
      tier: 1,
      title: "Transfer stock between valid locations",
      fn: async (ctx) => {
        // Ensure source batch exists at loc-1
        const batchNum = `B-TRF-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 20,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Seed delivery for transfer test",
        });

        const trfRes = await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: batchNum,
          quantity: 5,
        });
        assertStatus(trfRes, 201);
        expect(trfRes.data.type).toBe("transfer");
        expect(trfRes.data.quantity).toBe(5);
      },
    },
    {
      id: "T1-PPE-024-02",
      featureId: "PPE-024",
      tier: 1,
      title: "Verify source batch availableQty decremented after transfer",
      fn: async (ctx) => {
        const batchNum = `B-DEC-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 30,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Pre-transfer stock",
        });
        await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: batchNum,
          quantity: 10,
        });
        const batchRes = await ctx.asAdmin().get(`/api/stock/batches?batchNumber=${batchNum}&locationId=loc-cai-new`);
        assertSuccess(batchRes);
        expect(batchRes.data.data[0].availableQty).toBe(20);
      },
    },
    {
      id: "T1-PPE-024-03",
      featureId: "PPE-024",
      tier: 1,
      title: "Verify destination batch created/incremented after transfer",
      fn: async (ctx) => {
        const batchNum = `B-INC-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 15,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Delivery to be transferred",
        });
        await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: batchNum,
          quantity: 7,
        });
        const destBatch = await ctx.asAdmin().get(`/api/stock/batches?batchNumber=${batchNum}&locationId=loc-cai-usd`);
        assertSuccess(destBatch);
        expect(destBatch.data.data.length).toBeGreaterThan(0);
        expect(destBatch.data.data[0].availableQty).toBe(7);
      },
    },
    {
      id: "T1-PPE-024-04",
      featureId: "PPE-024",
      tier: 1,
      title: "Verify stock movement record created for transfer",
      fn: async (ctx) => {
        const batchNum = `B-MOV-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Stock for movement check",
        });
        const trf = await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: batchNum,
          quantity: 4,
        });
        const movRes = await ctx.asAdmin().get("/api/stock/movements?type=transfer");
        assertSuccess(movRes);
        const found = movRes.data.data.find((m: any) => m.reference === trf.data.reference);
        expect(found).toBeDefined();
      },
    },
    {
      id: "T1-PPE-024-05",
      featureId: "PPE-024",
      tier: 1,
      title: "Verify audit log entry written for transfer",
      fn: async (ctx) => {
        const batchNum = `B-TRFAUD-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Audit test",
        });
        const trf = await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: batchNum,
          quantity: 2,
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Transfer");
        assertSuccess(auditRes);
        const found = auditRes.data.data.find((a: any) => a.entityId === trf.data.reference);
        expect(found).toBeDefined();
      },
    },

    // PPE-025: View Stock Levels & Low Stock (5 tests)
    {
      id: "T1-PPE-025-01",
      featureId: "PPE-025",
      tier: 1,
      title: "Query live stock balances listing",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/balances");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
        expect(res.data.meta.total).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-025-02",
      featureId: "PPE-025",
      tier: 1,
      title: "Filter stock balances by status=low_stock",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/balances?status=low_stock");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-025-03",
      featureId: "PPE-025",
      tier: 1,
      title: "Filter stock balances by status=out_of_stock",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/balances?status=out_of_stock");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-025-04",
      featureId: "PPE-025",
      tier: 1,
      title: "Filter stock balances by ppeItemId and locationId",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-025-05",
      featureId: "PPE-025",
      tier: 1,
      title: "Query active batches ordered by FIFO",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/batches?status=Active");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },

    // PPE-026: Post Opening Balance (5 tests)
    {
      id: "T1-PPE-026-01",
      featureId: "PPE-026",
      tier: 1,
      title: "Create draft opening balance with item lines",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/opening-balances", {
          locationId: "loc-cai-scr",
          referenceDate: new Date().toISOString(),
          notes: "Site B Go-Live Inventory Initial Draft",
          lines: [
            {
              ppeItemId: "ppe-hlm-001",
              batchNumber: `B-OB-${Date.now()}`,
              expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
              quantity: 25,
              costPerUnit: 12.5,
            },
          ],
        });
        assertStatus(res, 201);
        expect(res.data.status).toBe("Draft");
      },
    },
    {
      id: "T1-PPE-026-02",
      featureId: "PPE-026",
      tier: 1,
      title: "Submit draft opening balance for HSE review",
      fn: async (ctx) => {
        const draft = await ctx.asAdmin().post("/api/opening-balances", {
          locationId: "loc-cai-scr",
          referenceDate: new Date().toISOString(),
          notes: "Submit test",
          lines: [
            {
              ppeItemId: "ppe-glv-002",
              batchNumber: `B-OBSUB-${Date.now()}`,
              expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
              quantity: 15,
              costPerUnit: 8.0,
            },
          ],
        });
        const subRes = await ctx.asAdmin().patch(`/api/opening-balances/${draft.data.id}/submit`);
        assertStatus(subRes, 200);
        expect(subRes.data.status).toBe("Pending_Approval");
      },
    },
    {
      id: "T1-PPE-026-03",
      featureId: "PPE-026",
      tier: 1,
      title: "Query opening balances listing",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/opening-balances");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-026-04",
      featureId: "PPE-026",
      tier: 1,
      title: "View single opening balance details",
      fn: async (ctx) => {
        const draft = await ctx.asAdmin().post("/api/opening-balances", {
          locationId: "loc-cai-scr",
          referenceDate: new Date().toISOString(),
          notes: "Detail test",
          lines: [
            {
              ppeItemId: "ppe-hlm-001",
              batchNumber: `B-OBDET-${Date.now()}`,
              expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
              quantity: 5,
              costPerUnit: 10.0,
            },
          ],
        });
        const getRes = await ctx.asAdmin().get(`/api/opening-balances/${draft.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.id).toBe(draft.data.id);
      },
    },
    {
      id: "T1-PPE-026-05",
      featureId: "PPE-026",
      tier: 1,
      title: "Reject opening balance draft with explanation",
      fn: async (ctx) => {
        const draft = await ctx.asAdmin().post("/api/opening-balances", {
          locationId: "loc-cai-scr",
          referenceDate: new Date().toISOString(),
          notes: "Reject test",
          lines: [
            {
              ppeItemId: "ppe-hlm-001",
              batchNumber: `B-OBREJ-${Date.now()}`,
              expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
              quantity: 5,
              costPerUnit: 10.0,
            },
          ],
        });
        await ctx.asAdmin().patch(`/api/opening-balances/${draft.data.id}/submit`);
        const rejRes = await ctx.asHSE().patch(`/api/opening-balances/${draft.data.id}/reject`, {
          reason: "Counts do not match physical audit sheet on ground",
        });
        assertStatus(rejRes, 200);
        expect(rejRes.data.status).toBe("Rejected");
      },
    },

    // PPE-027: Record Stock IN (5 tests)
    {
      id: "T1-PPE-027-01",
      featureId: "PPE-027",
      tier: 1,
      title: "Record Stock IN delivery applied immediately",
      fn: async (ctx) => {
        const batchNum = `B-DELIV-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 50,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Shipment from supplier received at dock",
        });
        assertStatus(res, 201);
        expect(res.data.status).toBe("applied");
      },
    },
    {
      id: "T1-PPE-027-02",
      featureId: "PPE-027",
      tier: 1,
      title: "Verify Stock IN increments location stock balance",
      fn: async (ctx) => {
        const preRes = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        const preQty = preRes.data.data[0]?.quantityOnHand || 0;
        const batchNum = `B-BALIN-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 25,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Balance check delivery",
        });
        const postRes = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        expect(postRes.data.data[0].quantityOnHand).toBe(preQty + 25);
      },
    },
    {
      id: "T1-PPE-027-03",
      featureId: "PPE-027",
      tier: 1,
      title: "Record Stock IN Manual Correction as pending review",
      fn: async (ctx) => {
        const batchNum = `B-MAN-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "Manual Correction",
          reason: "Found 10 extra units behind shelf during count",
        });
        assertStatus(res, 201);
        expect(res.data.status).toBe("pending");
      },
    },
    {
      id: "T1-PPE-027-04",
      featureId: "PPE-027",
      tier: 1,
      title: "Approve pending Stock IN adjustment by HSE Supervisor",
      fn: async (ctx) => {
        const batchNum = `B-APPR-${Date.now()}`;
        const pending = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 8,
          type: "IN",
          reasonCategory: "Manual Correction",
          reason: "Cycle count surplus approval required",
        });
        const reviewRes = await ctx.asHSE().patch(`/api/stock/adjustments/${pending.data.id}/review`, {
          status: "approved",
        });
        assertStatus(reviewRes, 200);
        expect(reviewRes.data.status).toBe("approved");
      },
    },
    {
      id: "T1-PPE-027-05",
      featureId: "PPE-027",
      tier: 1,
      title: "Verify batch record created upon Stock IN",
      fn: async (ctx) => {
        const batchNum = `B-VER-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 12,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Batch verification delivery",
        });
        const batchRes = await ctx.asAdmin().get(`/api/stock/batches?batchNumber=${batchNum}`);
        assertSuccess(batchRes);
        expect(batchRes.data.data.length).toBeGreaterThan(0);
        expect(batchRes.data.data[0].quantity).toBe(12);
      },
    },

    // PPE-028: Record Stock OUT (5 tests)
    {
      id: "T1-PPE-028-01",
      featureId: "PPE-028",
      tier: 1,
      title: "Record Stock OUT deduction for damaged inventory",
      fn: async (ctx) => {
        const batchNum = `B-OUTDAM-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 20,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Pre-stock for out",
        });
        const outRes = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 5,
          type: "OUT",
          reasonCategory: "Damaged Stock",
          reason: "Crushed by forklift in aisle 3",
        });
        assertStatus(outRes, 201);
        expect(outRes.data.type).toBe("OUT");
        expect(outRes.data.quantityDelta).toBe(-5);
      },
    },
    {
      id: "T1-PPE-028-02",
      featureId: "PPE-028",
      tier: 1,
      title: "Verify Stock OUT decrements location balance",
      fn: async (ctx) => {
        const batchNum = `B-OUTBAL-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 15,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Stock before out",
        });
        const pre = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        const preOnHand = pre.data.data[0].quantityOnHand;

        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 5,
          type: "OUT",
          reasonCategory: "Supplier Return",
          reason: "Recall returned to vendor",
        });
        const post = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        expect(post.data.data[0].quantityOnHand).toBe(preOnHand - 5);
      },
    },
    {
      id: "T1-PPE-028-03",
      featureId: "PPE-028",
      tier: 1,
      title: "Verify Stock OUT decrements batch availableQty",
      fn: async (ctx) => {
        const batchNum = `B-OUTBATCH-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Delivery of new stock for batch deduction test",
        });
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 4,
          type: "OUT",
          reasonCategory: "Disposal",
          reason: "Expired shelf life disposal",
        });
        const b = await ctx.asAdmin().get(`/api/stock/batches?batchNumber=${batchNum}`);
        assertSuccess(b);
        expect(b.data.data[0].availableQty).toBe(6);
      },
    },
    {
      id: "T1-PPE-028-04",
      featureId: "PPE-028",
      tier: 1,
      title: "Record Stock OUT with Manual Correction pending review",
      fn: async (ctx) => {
        const batchNum = `B-OUTPEND-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Initial stock",
        });
        const outRes = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 3,
          type: "OUT",
          reasonCategory: "Manual Correction",
          reason: "Missing units during physical count",
        });
        assertStatus(outRes, 201);
        expect(outRes.data.status).toBe("pending");
      },
    },
    {
      id: "T1-PPE-028-05",
      featureId: "PPE-028",
      tier: 1,
      title: "Verify Stock OUT logs audit trail",
      fn: async (ctx) => {
        const batchNum = `B-OUTAUD-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Pre - verified valid reason length",
        });
        const outRes = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 2,
          type: "OUT",
          reasonCategory: "Damaged Stock",
          reason: "Water damage write-off",
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=StockAdjustment");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((a: any) => a.entityId === outRes.data.id);
        expect(match).toBeDefined();
      },
    },
  ],
};
