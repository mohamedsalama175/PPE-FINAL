import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertSuccess } from "../harness/assertions.js";

export const epic10AdminSuite: TestSuite = {
  name: "Tier 1 - Epic 10: System Administration & Governance (PPE-048 to PPE-050)",
  tier: 1,
  tests: [
    // PPE-048: Shared Trash Bin (5 tests)
    {
      id: "T1-PPE-048-01",
      featureId: "PPE-048",
      tier: 1,
      title: "Query shared trash bin via GET /api/trash",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/trash");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-048-02",
      featureId: "PPE-048",
      tier: 1,
      title: "Verify deleted PPE item appears in shared trash bin with entityType=PPEItem",
      fn: async (ctx) => {
        const code = `TRASH-BIN-ITEM-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Trash Bin Helmet",
          nameAr: "خوذة سلة المهملات",
          category: "Head",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Years",
          lifespanValue: 2,
          riskCategory: "I",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        await ctx.asAdmin().delete(`/api/ppe-items/${created.data.id}`);
        const trashRes = await ctx.asAdmin().get("/api/trash");
        assertSuccess(trashRes);
        const match = trashRes.data.data.find((item: any) => item.id === created.data.id && item.entityType === "PPEItem");
        expect(match).toBeDefined();
      },
    },
    {
      id: "T1-PPE-048-03",
      featureId: "PPE-048",
      tier: 1,
      title: "Verify deleted Attribute appears in shared trash bin with entityType=Attribute",
      fn: async (ctx) => {
        const code = `TRASH-ATTR-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Trash Attr",
          nameAr: "سمة مهملة",
          values: [{ value: "T1", sortOrder: 1 }],
        });
        await ctx.asAdmin().delete(`/api/attributes/${created.data.id}`);
        const trashRes = await ctx.asAdmin().get("/api/trash");
        assertSuccess(trashRes);
        const match = trashRes.data.data.find((item: any) => item.id === created.data.id && item.entityType === "Attribute");
        expect(match).toBeDefined();
      },
    },
    {
      id: "T1-PPE-048-04",
      featureId: "PPE-048",
      tier: 1,
      title: "Verify deleted Location appears in shared trash bin with entityType=Location",
      fn: async (ctx) => {
        const code = `TRASH-LOC-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Trash Loc",
          nameAr: "موقع مهمل",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 10,
          description: "Trash loc",
          address: "Yard",
          assignedStoreKeeperIds: [],
        });
        await ctx.asAdmin().delete(`/api/locations/${created.data.id}`);
        const trashRes = await ctx.asAdmin().get("/api/trash");
        assertSuccess(trashRes);
        const match = trashRes.data.data.find((item: any) => item.id === created.data.id && item.entityType === "Location");
        expect(match).toBeDefined();
      },
    },
    {
      id: "T1-PPE-048-05",
      featureId: "PPE-048",
      tier: 1,
      title: "Verify deleted Kit appears in shared trash bin with entityType=Kit",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Trash Bin Kit ${Date.now()}`,
          nameAr: "طقم سلة المهملات",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        await ctx.asAdmin().delete(`/api/kits/${created.data.id}`);
        const trashRes = await ctx.asAdmin().get("/api/trash");
        assertSuccess(trashRes);
        const match = trashRes.data.data.find((item: any) => item.id === created.data.id && item.entityType === "Kit");
        expect(match).toBeDefined();
      },
    },

    // PPE-049: Immutable Audit Log Viewer (5 tests)
    {
      id: "T1-PPE-049-01",
      featureId: "PPE-049",
      tier: 1,
      title: "Query audit logs list with pagination metadata",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/audit-logs");
        assertSuccess(res);
        expect(res.data.meta.total).toBeGreaterThan(0);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-049-02",
      featureId: "PPE-049",
      tier: 1,
      title: "Filter audit logs by entityType=Location",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/audit-logs?entityType=Location");
        assertSuccess(res);
        for (const log of res.data.data) {
          expect(log.entityType).toBe("Location");
        }
      },
    },
    {
      id: "T1-PPE-049-03",
      featureId: "PPE-049",
      tier: 1,
      title: "Filter audit logs by action=CREATED",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/audit-logs?action=CREATED");
        assertSuccess(res);
        for (const log of res.data.data) {
          expect(log.action).toBe("CREATED");
        }
      },
    },
    {
      id: "T1-PPE-049-04",
      featureId: "PPE-049",
      tier: 1,
      title: "Verify audit log entries include performer relation with actor name",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/audit-logs");
        assertSuccess(res);
        if (res.data.data.length > 0) {
          expect(res.data.data[0].performer).toBeDefined();
          expect(res.data.data[0].performer.name).toBeDefined();
        }
      },
    },
    {
      id: "T1-PPE-049-05",
      featureId: "PPE-049",
      tier: 1,
      title: "Verify audit logs access is restricted to Admin and HSE Supervisor (Worker forbidden)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().get("/api/audit-logs");
        assertStatus(res, 403);
      },
    },

    // PPE-050: Module Settings (5 tests)
    {
      id: "T1-PPE-050-01",
      featureId: "PPE-050",
      tier: 1,
      title: "Retrieve module expiry settings via GET /api/expiry-settings",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/expiry-settings");
        assertSuccess(res);
        expect(typeof res.data.generalLeadTimeDays).toBe("number");
        const cat1 = res.data.categoryILeadTimeDays ?? res.data.raw?.categoryILeadTimeDays ?? res.data.categoryOverrides?.[0]?.leadTimeDays;
        const cat3 = res.data.categoryIIILeadTimeDays ?? res.data.raw?.categoryIIILeadTimeDays ?? res.data.categoryOverrides?.[2]?.leadTimeDays;
        expect(typeof cat1).toBe("number");
        expect(typeof cat3).toBe("number");
      },
    },
    {
      id: "T1-PPE-050-02",
      featureId: "PPE-050",
      tier: 1,
      title: "Update general lead time days via PUT /api/expiry-settings",
      fn: async (ctx) => {
        const updateRes = await ctx.asAdmin().put("/api/expiry-settings", {
          generalLeadTimeDays: 45,
          categoryILeadTimeDays: 15,
          categoryIILeadTimeDays: 30,
          categoryIIILeadTimeDays: 60,
        });
        assertStatus(updateRes, 200);
        expect(updateRes.data.generalLeadTimeDays).toBe(45);
      },
    },
    {
      id: "T1-PPE-050-03",
      featureId: "PPE-050",
      tier: 1,
      title: "Update category-specific lead times (Category III = 75 days)",
      fn: async (ctx) => {
        const updateRes = await ctx.asAdmin().put("/api/expiry-settings", {
          generalLeadTimeDays: 30,
          categoryILeadTimeDays: 20,
          categoryIILeadTimeDays: 40,
          categoryIIILeadTimeDays: 75,
        });
        assertStatus(updateRes, 200);
        const cat3 = updateRes.data.categoryIIILeadTimeDays ?? updateRes.data.raw?.categoryIIILeadTimeDays ?? updateRes.data.categoryOverrides?.find((c: any) => c.riskCategory === "III")?.leadTimeDays;
        expect(cat3).toBe(75);
      },
    },
    {
      id: "T1-PPE-050-04",
      featureId: "PPE-050",
      tier: 1,
      title: "Verify module settings changes take effect immediately without restart",
      fn: async (ctx) => {
        await ctx.asAdmin().put("/api/expiry-settings", {
          generalLeadTimeDays: 50,
          categoryILeadTimeDays: 25,
          categoryIILeadTimeDays: 35,
          categoryIIILeadTimeDays: 65,
        });
        const getRes = await ctx.asAdmin().get("/api/expiry-settings");
        assertSuccess(getRes);
        expect(getRes.data.generalLeadTimeDays).toBe(50);
      },
    },
    {
      id: "T1-PPE-050-05",
      featureId: "PPE-050",
      tier: 1,
      title: "Verify non-privileged personas cannot modify module settings",
      fn: async (ctx) => {
        const res = await ctx.asWorker().put("/api/expiry-settings", {
          generalLeadTimeDays: 10,
        });
        assertStatus(res, 403);
      },
    },
  ],
};
