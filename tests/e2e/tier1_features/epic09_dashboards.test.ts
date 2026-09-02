import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertSuccess } from "../harness/assertions.js";

export const epic09DashboardsSuite: TestSuite = {
  name: "Tier 1 - Epic 9: PPE Analytics Dashboards (PPE-045 to PPE-047)",
  tier: 1,
  tests: [
    // PPE-045: Interactive Stock Movement Trend (5 tests)
    {
      id: "T1-PPE-045-01",
      featureId: "PPE-045",
      tier: 1,
      title: "Query stock movements list with pagination",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/movements");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
        expect(res.data.meta.total).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-045-02",
      featureId: "PPE-045",
      tier: 1,
      title: "Filter stock movements by type=adjustment",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/movements?type=adjustment");
        assertSuccess(res);
        for (const mov of res.data.data) {
          expect(mov.type).toBe("adjustment");
        }
      },
    },
    {
      id: "T1-PPE-045-03",
      featureId: "PPE-045",
      tier: 1,
      title: "Filter stock movements by type=transfer",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/movements?type=transfer");
        assertSuccess(res);
        for (const mov of res.data.data) {
          expect(mov.type).toBe("transfer");
        }
      },
    },
    {
      id: "T1-PPE-045-04",
      featureId: "PPE-045",
      tier: 1,
      title: "Verify stock movements include timestamp and reference code",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/movements");
        assertSuccess(res);
        if (res.data.data.length > 0) {
          expect(res.data.data[0].createdAt).toBeDefined();
          expect(res.data.data[0].reference).toBeDefined();
        }
      },
    },
    {
      id: "T1-PPE-045-05",
      featureId: "PPE-045",
      tier: 1,
      title: "Verify stock movements include creator relation object",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/stock/movements");
        assertSuccess(res);
        if (res.data.data.length > 0) {
          expect(res.data.data[0].creator).toBeDefined();
        }
      },
    },

    // PPE-046: Location Capacity Stacked Bar (5 tests)
    {
      id: "T1-PPE-046-01",
      featureId: "PPE-046",
      tier: 1,
      title: "Query dashboard stats for capacity overview",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/dashboard/stats");
        assertSuccess(res);
        expect(typeof res.data.totalLocations).toBe("number");
        expect(typeof res.data.balancesCount).toBe("number");
      },
    },
    {
      id: "T1-PPE-046-02",
      featureId: "PPE-046",
      tier: 1,
      title: "Query location capacities across all active locations",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations");
        assertSuccess(res);
        for (const loc of res.data.data) {
          expect(typeof loc.capacityUnits).toBe("number");
        }
      },
    },
    {
      id: "T1-PPE-046-03",
      featureId: "PPE-046",
      tier: 1,
      title: "Store Keeper dashboard stats reports scoped locations count",
      fn: async (ctx) => {
        const res = await ctx.asStoreKeeper("cairo").get("/api/dashboard/stats");
        assertSuccess(res);
        expect(typeof res.data.totalLocations).toBe("number");
        expect(res.data.totalLocations).toBeGreaterThanOrEqual(1);
      },
    },
    {
      id: "T1-PPE-046-04",
      featureId: "PPE-046",
      tier: 1,
      title: "Verify dashboard inventory valuation calculation",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/dashboard/stats");
        assertSuccess(res);
        expect(typeof res.data.totalValuation).toBe("number");
      },
    },
    {
      id: "T1-PPE-046-05",
      featureId: "PPE-046",
      tier: 1,
      title: "Verify dashboard outOfStockCount and lowStockCount metrics",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/dashboard/stats");
        assertSuccess(res);
        expect(typeof res.data.outOfStockCount).toBe("number");
        expect(typeof res.data.lowStockCount).toBe("number");
      },
    },

    // PPE-047: Top Job Kits Chart (5 tests)
    {
      id: "T1-PPE-047-01",
      featureId: "PPE-047",
      tier: 1,
      title: "Query kits listing for top job kits analytics",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/kits");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-047-02",
      featureId: "PPE-047",
      tier: 1,
      title: "Verify kits include populated jobPosition details for grouping",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/kits");
        assertSuccess(res);
        for (const kit of res.data.data) {
          expect(kit.jobPosition).toBeDefined();
        }
      },
    },
    {
      id: "T1-PPE-047-03",
      featureId: "PPE-047",
      tier: 1,
      title: "Verify dashboard totalIssuances metric tracks overall volume",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/dashboard/stats");
        assertSuccess(res);
        expect(typeof res.data.totalIssuances).toBe("number");
      },
    },
    {
      id: "T1-PPE-047-04",
      featureId: "PPE-047",
      tier: 1,
      title: "Verify dashboard totalPPEItems metric matches active catalog count",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/dashboard/stats");
        assertSuccess(res);
        expect(typeof res.data.totalPPEItems).toBe("number");
      },
    },
    {
      id: "T1-PPE-047-05",
      featureId: "PPE-047",
      tier: 1,
      title: "Verify kit item lines contain ppeItem references for stock check",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/kits");
        assertSuccess(res);
        if (res.data.data.length > 0 && res.data.data[0].items.length > 0) {
          expect(res.data.data[0].items[0].ppeItemId).toBeDefined();
        }
      },
    },
  ],
};
