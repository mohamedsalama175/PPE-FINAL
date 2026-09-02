import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertError } from "../harness/assertions.js";

export const epic06BoundariesSuite: TestSuite = {
  name: "Tier 2 - Epic 6: Kit Boundaries & Error Handling (PPE-029 to PPE-033)",
  tier: 2,
  tests: [
    // PPE-029 Boundaries (5 tests)
    {
      id: "T2-PPE-029-01",
      featureId: "PPE-029",
      tier: 2,
      title: "Reject kit creation with empty items array (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/kits", {
          nameEn: "Empty Kit",
          nameAr: "طقم فارغ",
          jobPositionId: "jp-1",
          items: [],
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-029-02",
      featureId: "PPE-029",
      tier: 2,
      title: "Reject kit creation with non-existent jobPositionId",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/kits", {
          nameEn: "Bad JP Kit",
          nameAr: "طقم بوظيفة غير موجودة",
          jobPositionId: "fake-non-existent-jp-id-9999",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        assertError(res);
      },
    },
    {
      id: "T2-PPE-029-03",
      featureId: "PPE-029",
      tier: 2,
      title: "Block Worker persona from creating kit (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().post("/api/kits", {
          nameEn: "Worker Kit",
          nameAr: "طقم العامل",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-029-04",
      featureId: "PPE-029",
      tier: 2,
      title: "Reject kit line item with zero or negative quantity (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/kits", {
          nameEn: "Negative Qty Kit",
          nameAr: "طقم كمية سالبة",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: -1 }],
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-029-05",
      featureId: "PPE-029",
      tier: 2,
      title: "Reject unauthenticated kit creation request (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().post("/api/kits", {
          nameEn: "Unauth Kit",
          nameAr: "غير مصرح",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        assertStatus(res, 401);
      },
    },

    // PPE-030 Boundaries (5 tests)
    {
      id: "T2-PPE-030-01",
      featureId: "PPE-030",
      tier: 2,
      title: "Return 404 when updating non-existent kit ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().put("/api/kits/fake-non-existent-kit-9999", {
          nameEn: "Fake Kit",
          nameAr: "طقم وهمي",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        assertError(res);
      },
    },
    {
      id: "T2-PPE-030-02",
      featureId: "PPE-030",
      tier: 2,
      title: "Block Worker persona from updating kit (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().put("/api/kits/kit-elec", {
          nameEn: "Worker Edit",
          nameAr: "تعديل العامل",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-030-03",
      featureId: "PPE-030",
      tier: 2,
      title: "Reject kit update with empty nameEn string (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().put("/api/kits/kit-elec", {
          nameEn: "",
          nameAr: "طقم بلا اسم",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-030-04",
      featureId: "PPE-030",
      tier: 2,
      title: "Reject unauthenticated kit update request (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().put("/api/kits/kit-elec", {
          nameEn: "Unauth",
          nameAr: "غير مصرح",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        assertStatus(res, 401);
      },
    },
    {
      id: "T2-PPE-030-05",
      featureId: "PPE-030",
      tier: 2,
      title: "Reject kit update with non-existent item in line item array",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().put("/api/kits/kit-elec", {
          nameEn: "Bad Item Kit",
          nameAr: "طقم بصنف غير موجود",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "fake-non-existent-ppe-item", qty: 1 }],
        });
        assertError(res);
      },
    },

    // PPE-031 Boundaries (5 tests)
    {
      id: "T2-PPE-031-01",
      featureId: "PPE-031",
      tier: 2,
      title: "Search kits with special characters without server error",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/kits?search=<>{}%$");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-031-02",
      featureId: "PPE-031",
      tier: 2,
      title: "Handle negative pagination page on kits query",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/kits?page=-1&limit=5");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-031-03",
      featureId: "PPE-031",
      tier: 2,
      title: "Allow Worker persona read-only view of kits list (200)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().get("/api/kits");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-031-04",
      featureId: "PPE-031",
      tier: 2,
      title: "Reject unauthenticated kits query (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().get("/api/kits");
        assertStatus(res, 401);
      },
    },
    {
      id: "T2-PPE-031-05",
      featureId: "PPE-031",
      tier: 2,
      title: "Reject patch active status with invalid boolean (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().patch("/api/kits/kit-elec/active", { active: "not_boolean" });
        assertStatus(res, 400);
      },
    },

    // PPE-032 Boundaries (5 tests)
    {
      id: "T2-PPE-032-01",
      featureId: "PPE-032",
      tier: 2,
      title: "Return 404 for non-existent kit ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/kits/non-existent-kit-id-9999");
        assertStatus(res, 404);
      },
    },
    {
      id: "T2-PPE-032-02",
      featureId: "PPE-032",
      tier: 2,
      title: "Return 404 for malformed kit ID string",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/kits/@@@bad_id###");
        assertStatus(res, 404);
      },
    },
    {
      id: "T2-PPE-032-03",
      featureId: "PPE-032",
      tier: 2,
      title: "Allow Worker persona read-only view of kit details (200)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().get("/api/kits/kit-elec");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-032-04",
      featureId: "PPE-032",
      tier: 2,
      title: "Reject unauthenticated kit details query (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().get("/api/kits/kit-elec");
        assertStatus(res, 401);
      },
    },
    {
      id: "T2-PPE-032-05",
      featureId: "PPE-032",
      tier: 2,
      title: "Allow Store Keeper persona read-only view of kit details",
      fn: async (ctx) => {
        const res = await ctx.asStoreKeeper("cairo").get("/api/kits/kit-elec");
        assertStatus(res, 200);
      },
    },

    // PPE-033 Boundaries (5 tests)
    {
      id: "T2-PPE-033-01",
      featureId: "PPE-033",
      tier: 2,
      title: "Return error when trashing non-existent kit ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().delete("/api/kits/fake-non-existent-kit");
        assertError(res);
      },
    },
    {
      id: "T2-PPE-033-02",
      featureId: "PPE-033",
      tier: 2,
      title: "Block Worker persona from deleting kit (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().delete("/api/kits/kit-elec");
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-033-03",
      featureId: "PPE-033",
      tier: 2,
      title: "Return error when restoring non-existent kit ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/kits/fake-non-existent-kit/restore");
        assertError(res);
      },
    },
    {
      id: "T2-PPE-033-04",
      featureId: "PPE-033",
      tier: 2,
      title: "Block Worker persona from restoring kit (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().post("/api/kits/kit-elec/restore");
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-033-05",
      featureId: "PPE-033",
      tier: 2,
      title: "Reject unauthenticated kit delete request (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().delete("/api/kits/kit-elec");
        assertStatus(res, 401);
      },
    },
  ],
};
