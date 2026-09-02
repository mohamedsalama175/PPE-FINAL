import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertError } from "../harness/assertions.js";

export const epic02BoundariesSuite: TestSuite = {
  name: "Tier 2 - Epic 2: Attributes Boundaries & Error Handling (PPE-008 to PPE-012)",
  tier: 2,
  tests: [
    // PPE-008 Boundaries (5 tests)
    {
      id: "T2-PPE-008-01",
      featureId: "PPE-008",
      tier: 2,
      title: "Block duplicate attribute code creation",
      fn: async (ctx) => {
        const code = `DUP-ATTR-${Date.now()}`;
        await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Original Attr",
          nameAr: "سمة أصلية",
          values: [{ value: "V1", sortOrder: 1 }],
        });
        const dupRes = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Duplicate Attr",
          nameAr: "سمة مكررة",
          values: [{ value: "V2", sortOrder: 1 }],
        });
        assertError(dupRes);
      },
    },
    {
      id: "T2-PPE-008-02",
      featureId: "PPE-008",
      tier: 2,
      title: "Reject attribute creation with empty code (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/attributes", {
          code: "",
          nameEn: "Empty Code",
          nameAr: "كود فارغ",
          values: [{ value: "V1", sortOrder: 1 }],
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-008-03",
      featureId: "PPE-008",
      tier: 2,
      title: "Reject attribute creation with empty values array (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/attributes", {
          code: `NO-VAL-${Date.now()}`,
          nameEn: "No Values Attr",
          nameAr: "سمة بلا قيم",
          values: [],
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-008-04",
      featureId: "PPE-008",
      tier: 2,
      title: "Block Worker persona from creating attribute (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().post("/api/attributes", {
          code: `WORKER-ATTR-${Date.now()}`,
          nameEn: "Worker Attr",
          nameAr: "سمة العامل",
          values: [{ value: "W1", sortOrder: 1 }],
        });
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-008-05",
      featureId: "PPE-008",
      tier: 2,
      title: "Reject unauthenticated attribute creation (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().post("/api/attributes", {
          code: `UNAUTH-ATTR-${Date.now()}`,
          nameEn: "Unauth",
          nameAr: "غير مصرح",
          values: [{ value: "U1", sortOrder: 1 }],
        });
        assertStatus(res, 401);
      },
    },

    // PPE-009 Boundaries (5 tests)
    {
      id: "T2-PPE-009-01",
      featureId: "PPE-009",
      tier: 2,
      title: "Return 404 when updating non-existent attribute ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().put("/api/attributes/fake-non-existent-attr-id", {
          code: "FAKE",
          nameEn: "Fake",
          nameAr: "وهمي",
          values: [{ value: "F1", sortOrder: 1 }],
        });
        assertError(res);
      },
    },
    {
      id: "T2-PPE-009-02",
      featureId: "PPE-009",
      tier: 2,
      title: "Block Worker persona from updating attribute (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().put("/api/attributes/attr-color", {
          code: "COLOR",
          nameEn: "Worker Color",
          nameAr: "لون العامل",
          values: [{ value: "Red", sortOrder: 1 }],
        });
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-009-03",
      featureId: "PPE-009",
      tier: 2,
      title: "Reject attribute update with empty nameEn string (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().put("/api/attributes/attr-color", {
          code: "COLOR",
          nameEn: "",
          nameAr: "لون",
          values: [{ value: "Red", sortOrder: 1 }],
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-009-04",
      featureId: "PPE-009",
      tier: 2,
      title: "Reject duplicate attribute code collision during edit",
      fn: async (ctx) => {
        const code1 = `ATTR-C1-${Date.now()}`;
        const code2 = `ATTR-C2-${Date.now()}`;
        const a1 = await ctx.asAdmin().post("/api/attributes", {
          code: code1,
          nameEn: "Attr 1",
          nameAr: "سمة 1",
          values: [{ value: "A", sortOrder: 1 }],
        });
        await ctx.asAdmin().post("/api/attributes", {
          code: code2,
          nameEn: "Attr 2",
          nameAr: "سمة 2",
          values: [{ value: "B", sortOrder: 1 }],
        });
        const collRes = await ctx.asAdmin().put(`/api/attributes/${a1.data.id}`, {
          code: code2,
          nameEn: "Attr 1 Collision",
          nameAr: "سمة 1 تصادم",
          values: [{ value: "A", sortOrder: 1 }],
        });
        assertError(collRes);
      },
    },
    {
      id: "T2-PPE-009-05",
      featureId: "PPE-009",
      tier: 2,
      title: "Reject unauthenticated attribute update (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().put("/api/attributes/attr-color", {
          code: "COLOR",
          nameEn: "Unauth",
          nameAr: "غير مصرح",
          values: [{ value: "Red", sortOrder: 1 }],
        });
        assertStatus(res, 401);
      },
    },

    // PPE-010 Boundaries (5 tests)
    {
      id: "T2-PPE-010-01",
      featureId: "PPE-010",
      tier: 2,
      title: "Search attributes with regex special characters without server error",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes?search=[a-z]+.*$");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-010-02",
      featureId: "PPE-010",
      tier: 2,
      title: "Handle pagination page < 0 gracefully",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes?page=-5&limit=10");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-010-03",
      featureId: "PPE-010",
      tier: 2,
      title: "Allow Worker persona read-only view of attributes (200)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().get("/api/attributes");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-010-04",
      featureId: "PPE-010",
      tier: 2,
      title: "Reject unauthenticated attributes query (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().get("/api/attributes");
        assertStatus(res, 401);
      },
    },
    {
      id: "T2-PPE-010-05",
      featureId: "PPE-010",
      tier: 2,
      title: "Reject patch active status with invalid boolean (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().patch("/api/attributes/attr-color/active", { active: "not_a_bool" });
        assertStatus(res, 400);
      },
    },

    // PPE-011 Boundaries (5 tests)
    {
      id: "T2-PPE-011-01",
      featureId: "PPE-011",
      tier: 2,
      title: "Return 404 for non-existent attribute ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes/non-existent-attr-id-9999");
        assertStatus(res, 404);
      },
    },
    {
      id: "T2-PPE-011-02",
      featureId: "PPE-011",
      tier: 2,
      title: "Return 404 for malformed attribute ID with injection payload",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes/' OR '1'='1");
        assertStatus(res, 404);
      },
    },
    {
      id: "T2-PPE-011-03",
      featureId: "PPE-011",
      tier: 2,
      title: "Allow Worker persona read-only view of attribute details (200)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().get("/api/attributes/attr-color");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-011-04",
      featureId: "PPE-011",
      tier: 2,
      title: "Reject unauthenticated attribute details query (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().get("/api/attributes/attr-color");
        assertStatus(res, 401);
      },
    },
    {
      id: "T2-PPE-011-05",
      featureId: "PPE-011",
      tier: 2,
      title: "Allow Store Keeper persona read-only view of attribute details",
      fn: async (ctx) => {
        const res = await ctx.asStoreKeeper("cairo").get("/api/attributes/attr-color");
        assertStatus(res, 200);
      },
    },

    // PPE-012 Boundaries (5 tests)
    {
      id: "T2-PPE-012-01",
      featureId: "PPE-012",
      tier: 2,
      title: "Return error when trashing non-existent attribute ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().delete("/api/attributes/fake-non-existent-attr");
        assertError(res);
      },
    },
    {
      id: "T2-PPE-012-02",
      featureId: "PPE-012",
      tier: 2,
      title: "Block Worker persona from deleting attribute (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().delete("/api/attributes/attr-color");
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-012-03",
      featureId: "PPE-012",
      tier: 2,
      title: "Return error when restoring non-existent attribute ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/attributes/fake-non-existent-attr/restore");
        assertError(res);
      },
    },
    {
      id: "T2-PPE-012-04",
      featureId: "PPE-012",
      tier: 2,
      title: "Block Worker persona from restoring attribute (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().post("/api/attributes/attr-color/restore");
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-012-05",
      featureId: "PPE-012",
      tier: 2,
      title: "Reject unauthenticated attribute delete request (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().delete("/api/attributes/attr-color");
        assertStatus(res, 401);
      },
    },
  ],
};
