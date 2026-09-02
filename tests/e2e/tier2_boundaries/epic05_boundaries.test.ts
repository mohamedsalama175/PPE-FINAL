import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertError } from "../harness/assertions.js";

export const epic05BoundariesSuite: TestSuite = {
  name: "Tier 2 - Epic 5: Stock Boundaries & Error Handling (PPE-024 to PPE-028)",
  tier: 2,
  tests: [
    // PPE-024 Boundaries (5 tests)
    {
      id: "T2-PPE-024-01",
      featureId: "PPE-024",
      tier: 2,
      title: "Reject transfer when source and destination locations are identical (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-new",
          batchNumber: "B-TEST",
          quantity: 5,
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-024-02",
      featureId: "PPE-024",
      tier: 2,
      title: "Reject transfer when quantity exceeds available stock (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: "B-TEST",
          quantity: 9999999,
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-024-03",
      featureId: "PPE-024",
      tier: 2,
      title: "Return error when transferring non-existent PPE item",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "fake-non-existent-ppe-item",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: "B-TEST",
          quantity: 1,
        });
        assertError(res);
      },
    },
    {
      id: "T2-PPE-024-04",
      featureId: "PPE-024",
      tier: 2,
      title: "Reject transfer with zero or negative quantity (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: "B-TEST",
          quantity: 0,
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-024-05",
      featureId: "PPE-024",
      tier: 2,
      title: "Reject unauthenticated stock transfer request (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: "B-TEST",
          quantity: 1,
        });
        assertStatus(res, 401);
      },
    },

    // PPE-025 Boundaries (5 tests)
    {
      id: "T2-PPE-025-01",
      featureId: "PPE-025",
      tier: 2,
      title: "Query balances with non-existent ppeItemId returns empty array",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=non-existent-ppe-999");
        assertStatus(res, 200);
        expect(res.data.data.length).toBe(0);
      },
    },
    {
      id: "T2-PPE-025-02",
      featureId: "PPE-025",
      tier: 2,
      title: "Query balances with non-existent locationId returns empty array",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/balances?locationId=non-existent-loc-999");
        assertStatus(res, 200);
        expect(res.data.data.length).toBe(0);
      },
    },
    {
      id: "T2-PPE-025-03",
      featureId: "PPE-025",
      tier: 2,
      title: "Query balances with invalid status filter value handles gracefully",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/balances?status=invalid_status_xyz");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-025-04",
      featureId: "PPE-025",
      tier: 2,
      title: "Allow Worker persona read-only view of stock balances (200)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().get("/api/stock/balances");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-025-05",
      featureId: "PPE-025",
      tier: 2,
      title: "Reject unauthenticated stock balances query (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().get("/api/stock/balances");
        assertStatus(res, 401);
      },
    },

    // PPE-026 Boundaries (5 tests)
    {
      id: "T2-PPE-026-01",
      featureId: "PPE-026",
      tier: 2,
      title: "Return error when creating opening balance for non-existent location",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/opening-balances", {
          locationId: "fake-location-id-9999",
          referenceDate: new Date().toISOString(),
          notes: "Fake location OB",
          lines: [],
        });
        assertError(res);
      },
    },
    {
      id: "T2-PPE-026-02",
      featureId: "PPE-026",
      tier: 2,
      title: "Reject submitting an already submitted opening balance (400)",
      fn: async (ctx) => {
        const draft = await ctx.asAdmin().post("/api/opening-balances", {
          locationId: "loc-cai-scr",
          referenceDate: new Date().toISOString(),
          notes: "Double submit test",
          lines: [
            {
              ppeItemId: "ppe-hlm-001",
              batchNumber: `B-DBLSUB-${Date.now()}`,
              expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
              quantity: 5,
            },
          ],
        });
        await ctx.asAdmin().patch(`/api/opening-balances/${draft.data.id}/submit`);
        const secondSub = await ctx.asAdmin().patch(`/api/opening-balances/${draft.data.id}/submit`);
        assertStatus(secondSub, 400);
      },
    },
    {
      id: "T2-PPE-026-03",
      featureId: "PPE-026",
      tier: 2,
      title: "Block Worker persona from creating opening balance (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().post("/api/opening-balances", {
          locationId: "loc-cai-scr",
          referenceDate: new Date().toISOString(),
          notes: "Worker OB",
          lines: [],
        });
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-026-04",
      featureId: "PPE-026",
      tier: 2,
      title: "Block Store Keeper from approving opening balance (403 requires HSE/Admin)",
      fn: async (ctx) => {
        const draft = await ctx.asAdmin().post("/api/opening-balances", {
          locationId: "loc-cai-scr",
          referenceDate: new Date().toISOString(),
          notes: "Keeper approve test",
          lines: [
            {
              ppeItemId: "ppe-hlm-001",
              batchNumber: `B-SKAPPR-${Date.now()}`,
              expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
              quantity: 5,
            },
          ],
        });
        await ctx.asAdmin().patch(`/api/opening-balances/${draft.data.id}/submit`);
        const approveRes = await ctx.asStoreKeeper("cairo").patch(`/api/opening-balances/${draft.data.id}/approve`);
        assertStatus(approveRes, 403);
      },
    },
    {
      id: "T2-PPE-026-05",
      featureId: "PPE-026",
      tier: 2,
      title: "Reject unauthenticated opening balance creation (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().post("/api/opening-balances", {
          locationId: "loc-cai-scr",
          referenceDate: new Date().toISOString(),
          notes: "Unauth OB",
          lines: [],
        });
        assertStatus(res, 401);
      },
    },

    // PPE-027 Boundaries (5 tests)
    {
      id: "T2-PPE-027-01",
      featureId: "PPE-027",
      tier: 2,
      title: "Reject Stock IN adjustment with zero or negative quantity (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: "B-TEST",
          quantityDelta: 0,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Zero quantity delivery",
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-027-02",
      featureId: "PPE-027",
      tier: 2,
      title: "Return error when recording Stock IN for non-existent PPE item",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "non-existent-ppe-item-id-9999",
          locationId: "loc-cai-new",
          batchNumber: "B-TEST",
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Bad item delivery",
        });
        assertError(res);
      },
    },
    {
      id: "T2-PPE-027-03",
      featureId: "PPE-027",
      tier: 2,
      title: "Return error when recording Stock IN for non-existent location",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "non-existent-loc-id-9999",
          batchNumber: "B-TEST",
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Bad loc delivery",
        });
        assertError(res);
      },
    },
    {
      id: "T2-PPE-027-04",
      featureId: "PPE-027",
      tier: 2,
      title: "Return 404 when reviewing non-existent stock adjustment ID",
      fn: async (ctx) => {
        const res = await ctx.asHSE().patch("/api/stock/adjustments/fake-adj-id-9999/review", {
          status: "approved",
        });
        assertStatus(res, 404);
      },
    },
    {
      id: "T2-PPE-027-05",
      featureId: "PPE-027",
      tier: 2,
      title: "Reject reviewing already approved adjustment (400)",
      fn: async (ctx) => {
        const pending = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: `B-DBLREV-${Date.now()}`,
          quantityDelta: 5,
          type: "IN",
          reasonCategory: "Manual Correction",
          reason: "Double review check",
        });
        await ctx.asHSE().patch(`/api/stock/adjustments/${pending.data.id}/review`, { status: "approved" });
        const secondRev = await ctx.asHSE().patch(`/api/stock/adjustments/${pending.data.id}/review`, { status: "approved" });
        assertStatus(secondRev, 400);
      },
    },

    // PPE-028 Boundaries (5 tests)
    {
      id: "T2-PPE-028-01",
      featureId: "PPE-028",
      tier: 2,
      title: "Reject Stock OUT with zero quantity (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: "B-TEST",
          quantityDelta: 0,
          type: "OUT",
          reasonCategory: "Damaged Stock",
          reason: "Zero quantity out",
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-028-02",
      featureId: "PPE-028",
      tier: 2,
      title: "Reject Stock OUT with missing reason description (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: "B-TEST",
          quantityDelta: 5,
          type: "OUT",
          reasonCategory: "Damaged Stock",
          reason: "",
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-028-03",
      featureId: "PPE-028",
      tier: 2,
      title: "Block Worker persona from recording Stock OUT (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: "B-TEST",
          quantityDelta: 2,
          type: "OUT",
          reasonCategory: "Damaged Stock",
          reason: "Worker out",
        });
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-028-04",
      featureId: "PPE-028",
      tier: 2,
      title: "Reject unauthenticated Stock OUT request (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: "B-TEST",
          quantityDelta: 1,
          type: "OUT",
          reasonCategory: "Damaged Stock",
          reason: "Unauth out",
        });
        assertStatus(res, 401);
      },
    },
    {
      id: "T2-PPE-028-05",
      featureId: "PPE-028",
      tier: 2,
      title: "Reject Stock OUT with invalid adjustment type (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: "B-TEST",
          quantityDelta: 1,
          type: "INVALID_TYPE",
          reasonCategory: "Damaged Stock",
          reason: "Invalid type out",
        });
        assertStatus(res, 400);
      },
    },
  ],
};
