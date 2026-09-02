import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertSuccess } from "../harness/assertions.js";

export const epic03ItemGroupsSuite: TestSuite = {
  name: "Tier 1 - Epic 3: Item Groups Management (PPE-013 to PPE-017)",
  tier: 1,
  tests: [
    // PPE-013: Add New Item Group (5 tests)
    {
      id: "T1-PPE-013-01",
      featureId: "PPE-013",
      tier: 1,
      title: "Add new item group with assigned attributes",
      fn: async (ctx) => {
        const code = `GRP-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Welding Protection",
          nameAr: "معدات وقاية اللحام",
          attributeIds: ["attr-color"],
        });
        assertStatus(res, 201);
        expect(res.data.code).toBe(code);
      },
    },
    {
      id: "T1-PPE-013-02",
      featureId: "PPE-013",
      tier: 1,
      title: "Add item group with multiple assigned attributes",
      fn: async (ctx) => {
        const code = `GRP-MULTI-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Specialty Footwear",
          nameAr: "أحذية تخصصية",
          attributeIds: ["attr-size", "attr-color"],
        });
        assertStatus(res, 201);
        const getRes = await ctx.asAdmin().get(`/api/item-groups/${res.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.attributeIds.length).toBe(2);
      },
    },
    {
      id: "T1-PPE-013-03",
      featureId: "PPE-013",
      tier: 1,
      title: "Add item group as HSE Supervisor",
      fn: async (ctx) => {
        const code = `GRP-HSE-${Date.now()}`;
        const res = await ctx.asHSE().post("/api/item-groups", {
          code,
          nameEn: "Chemical Ensembles",
          nameAr: "أطقم كيميائية",
          attributeIds: ["attr-gender"],
        });
        assertStatus(res, 201);
      },
    },
    {
      id: "T1-PPE-013-04",
      featureId: "PPE-013",
      tier: 1,
      title: "Add item group without initial attributes",
      fn: async (ctx) => {
        const code = `GRP-EMPTY-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "General Tools",
          nameAr: "أدوات عامة",
          attributeIds: [],
        });
        assertStatus(res, 201);
        expect(res.data.code).toBe(code);
      },
    },
    {
      id: "T1-PPE-013-05",
      featureId: "PPE-013",
      tier: 1,
      title: "Verify audit log entry generated on item group creation",
      fn: async (ctx) => {
        const code = `GRP-AUD-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Audited Group",
          nameAr: "مجموعة مدققة",
          attributeIds: ["attr-color"],
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=ItemGroup");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === created.data.id && l.action === "CREATED");
        expect(match).toBeDefined();
      },
    },

    // PPE-014: Edit Item Group (5 tests)
    {
      id: "T1-PPE-014-01",
      featureId: "PPE-014",
      tier: 1,
      title: "Edit item group bilingual names",
      fn: async (ctx) => {
        const code = `GRP-EDNAME-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Initial Group Name",
          nameAr: "اسم أولي",
          attributeIds: [],
        });
        const updateRes = await ctx.asAdmin().put(`/api/item-groups/${created.data.id}`, {
          code,
          nameEn: "Updated Group Name EN",
          nameAr: "اسم محدث",
          attributeIds: [],
        });
        assertStatus(updateRes, 200);
        expect(updateRes.data.nameEn).toBe("Updated Group Name EN");
      },
    },
    {
      id: "T1-PPE-014-02",
      featureId: "PPE-014",
      tier: 1,
      title: "Update assigned attributes on item group",
      fn: async (ctx) => {
        const code = `GRP-EDATTR-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Eye Gear",
          nameAr: "معدات العين",
          attributeIds: ["attr-color"],
        });
        const updateRes = await ctx.asAdmin().put(`/api/item-groups/${created.data.id}`, {
          code,
          nameEn: "Eye Gear",
          nameAr: "معدات العين",
          attributeIds: ["attr-gender", "attr-color"],
        });
        assertStatus(updateRes, 200);
        const getRes = await ctx.asAdmin().get(`/api/item-groups/${created.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.attributeIds.length).toBe(2);
      },
    },
    {
      id: "T1-PPE-014-03",
      featureId: "PPE-014",
      tier: 1,
      title: "Remove all attributes from item group",
      fn: async (ctx) => {
        const code = `GRP-CLR-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Clear Group",
          nameAr: "مجموعة مفرغة",
          attributeIds: ["attr-color"],
        });
        const updateRes = await ctx.asAdmin().put(`/api/item-groups/${created.data.id}`, {
          code,
          nameEn: "Clear Group",
          nameAr: "مجموعة مفرغة",
          attributeIds: [],
        });
        assertStatus(updateRes, 200);
        const getRes = await ctx.asAdmin().get(`/api/item-groups/${created.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.attributeIds.length).toBe(0);
      },
    },
    {
      id: "T1-PPE-014-04",
      featureId: "PPE-014",
      tier: 1,
      title: "Edit item group as HSE Supervisor",
      fn: async (ctx) => {
        const code = `GRP-HSEED-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "HSE Group",
          nameAr: "مجموعة السلامة",
          attributeIds: [],
        });
        const updateRes = await ctx.asHSE().put(`/api/item-groups/${created.data.id}`, {
          code,
          nameEn: "HSE Group Modified",
          nameAr: "مجموعة السلامة معدلة",
          attributeIds: ["attr-color"],
        });
        assertStatus(updateRes, 200);
      },
    },
    {
      id: "T1-PPE-014-05",
      featureId: "PPE-014",
      tier: 1,
      title: "Verify audit log entry generated on item group edit",
      fn: async (ctx) => {
        const code = `GRP-AUDED-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Audited Edit Group",
          nameAr: "مجموعة مدققة للتعديل",
          attributeIds: [],
        });
        await ctx.asAdmin().put(`/api/item-groups/${created.data.id}`, {
          code,
          nameEn: "Audited Edit Group Upd",
          nameAr: "مجموعة مدققة للتعديل محدثة",
          attributeIds: [],
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=ItemGroup");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === created.data.id && l.action === "UPDATED");
        expect(match).toBeDefined();
      },
    },

    // PPE-015: View & Filter Item Groups (5 tests)
    {
      id: "T1-PPE-015-01",
      featureId: "PPE-015",
      tier: 1,
      title: "List item groups with pagination metadata",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/item-groups");
        assertSuccess(res);
        expect(res.data.meta.total).toBeGreaterThan(0);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-015-02",
      featureId: "PPE-015",
      tier: 1,
      title: "Search item groups by code keyword",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/item-groups?search=HEAD");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-015-03",
      featureId: "PPE-015",
      tier: 1,
      title: "Search item groups by name keyword",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/item-groups?search=Protection");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-015-04",
      featureId: "PPE-015",
      tier: 1,
      title: "Filter item groups by active=true",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/item-groups?active=true");
        assertSuccess(res);
        expect(res.data.meta.total).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-015-05",
      featureId: "PPE-015",
      tier: 1,
      title: "Toggle item group active status via PATCH /:id/active",
      fn: async (ctx) => {
        const code = `GRP-TOG-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Toggleable Group",
          nameAr: "مجموعة قابلة للتبديل",
          attributeIds: [],
        });
        const patchRes = await ctx.asAdmin().patch(`/api/item-groups/${created.data.id}/active`, { active: false });
        assertStatus(patchRes, 200);
        expect(patchRes.data.active).toBe(false);
      },
    },

    // PPE-016: View Item Group Details (5 tests)
    {
      id: "T1-PPE-016-01",
      featureId: "PPE-016",
      tier: 1,
      title: "Retrieve item group details by ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/item-groups/grp-helmets");
        assertSuccess(res);
        expect(res.data.id).toBe("grp-helmets");
      },
    },
    {
      id: "T1-PPE-016-02",
      featureId: "PPE-016",
      tier: 1,
      title: "Verify item group details include assigned attributeIds array",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/item-groups/grp-helmets");
        assertSuccess(res);
        expect(Array.isArray(res.data.attributeIds)).toBe(true);
      },
    },
    {
      id: "T1-PPE-016-03",
      featureId: "PPE-016",
      tier: 1,
      title: "Verify bilingual names are returned in item group details",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/item-groups/grp-helmets");
        assertSuccess(res);
        expect(res.data.nameEn).toBeDefined();
        expect(res.data.nameAr).toBeDefined();
      },
    },
    {
      id: "T1-PPE-016-04",
      featureId: "PPE-016",
      tier: 1,
      title: "Verify item group details include linked ppeItems count or array",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/item-groups/grp-helmets");
        assertSuccess(res);
        const ppeRes = await ctx.asAdmin().get(`/api/ppe-items?itemGroupId=${res.data.id}`);
        assertSuccess(ppeRes);
        expect(Array.isArray(ppeRes.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-016-05",
      featureId: "PPE-016",
      tier: 1,
      title: "Verify item group details include attributes relation",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/item-groups/grp-helmets");
        assertSuccess(res);
        expect(res.data.attributes).toBeDefined();
      },
    },

    // PPE-017: Move Item Group to Trash / Restore (5 tests)
    {
      id: "T1-PPE-017-01",
      featureId: "PPE-017",
      tier: 1,
      title: "Soft delete unused item group to trash",
      fn: async (ctx) => {
        const code = `GRP-DEL-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Temporary Group",
          nameAr: "مجموعة مؤقتة",
          attributeIds: [],
        });
        const delRes = await ctx.asAdmin().delete(`/api/item-groups/${created.data.id}`);
        assertStatus(delRes, 200);
      },
    },
    {
      id: "T1-PPE-017-02",
      featureId: "PPE-017",
      tier: 1,
      title: "Verify deleted item group is excluded from standard list",
      fn: async (ctx) => {
        const code = `GRP-EXCL-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Excluded Group",
          nameAr: "مجموعة مستبعدة",
          attributeIds: [],
        });
        await ctx.asAdmin().delete(`/api/item-groups/${created.data.id}`);
        const listRes = await ctx.asAdmin().get(`/api/item-groups?search=${code}`);
        assertSuccess(listRes);
        expect(listRes.data.data.length).toBe(0);
      },
    },
    {
      id: "T1-PPE-017-03",
      featureId: "PPE-017",
      tier: 1,
      title: "Verify deleted item group is returned with includeDeleted=true",
      fn: async (ctx) => {
        const code = `GRP-INC-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Include Group",
          nameAr: "مجموعة متضمنة",
          attributeIds: [],
        });
        await ctx.asAdmin().delete(`/api/item-groups/${created.data.id}`);
        const listRes = await ctx.asAdmin().get(`/api/item-groups?search=${code}&includeDeleted=true`);
        assertSuccess(listRes);
        expect(listRes.data.data.length).toBe(1);
        expect(listRes.data.data[0].deletedAt).toBeDefined();
      },
    },
    {
      id: "T1-PPE-017-04",
      featureId: "PPE-017",
      tier: 1,
      title: "Restore soft-deleted item group from trash",
      fn: async (ctx) => {
        const code = `GRP-REST-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Restore Group",
          nameAr: "مجموعة مستعادة",
          attributeIds: ["attr-color"],
        });
        await ctx.asAdmin().delete(`/api/item-groups/${created.data.id}`);
        const restRes = await ctx.asAdmin().post(`/api/item-groups/${created.data.id}/restore`);
        assertStatus(restRes, 200);
        expect(restRes.data.active).toBe(true);
        expect(restRes.data.deletedAt).toBeNull();
      },
    },
    {
      id: "T1-PPE-017-05",
      featureId: "PPE-017",
      tier: 1,
      title: "Verify restored item group preserves assigned attributes",
      fn: async (ctx) => {
        const code = `GRP-PRES-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/item-groups", {
          code,
          nameEn: "Preserved Group",
          nameAr: "مجموعة محفوظة",
          attributeIds: ["attr-color"],
        });
        await ctx.asAdmin().delete(`/api/item-groups/${created.data.id}`);
        await ctx.asAdmin().post(`/api/item-groups/${created.data.id}/restore`);
        const getRes = await ctx.asAdmin().get(`/api/item-groups/${created.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.attributeIds.length).toBe(1);
      },
    },
  ],
};
