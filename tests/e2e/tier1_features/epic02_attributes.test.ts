import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertSuccess } from "../harness/assertions.js";

export const epic02AttributesSuite: TestSuite = {
  name: "Tier 1 - Epic 2: Dynamic Attributes Management (PPE-008 to PPE-012)",
  tier: 1,
  tests: [
    // PPE-008: Add New Attribute (5 tests)
    {
      id: "T1-PPE-008-01",
      featureId: "PPE-008",
      tier: 1,
      title: "Add new dynamic attribute with sortable bilingual values",
      fn: async (ctx) => {
        const code = `ATTR-SZ-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Boot Size",
          nameAr: "مقاس الحذاء",
          values: [
            { value: "40", sortOrder: 1 },
            { value: "41", sortOrder: 2 },
            { value: "42", sortOrder: 3 },
          ],
        });
        assertStatus(res, 201);
        expect(res.data.code).toBe(code);
      },
    },
    {
      id: "T1-PPE-008-02",
      featureId: "PPE-008",
      tier: 1,
      title: "Add single-value attribute",
      fn: async (ctx) => {
        const code = `ATTR-SG-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Standard Rating",
          nameAr: "تصنيف المعيار",
          values: [{ value: "ANSI-Z87", sortOrder: 1 }],
        });
        assertStatus(res, 201);
      },
    },
    {
      id: "T1-PPE-008-03",
      featureId: "PPE-008",
      tier: 1,
      title: "Add attribute as HSE Supervisor persona",
      fn: async (ctx) => {
        const code = `ATTR-HSE-${Date.now()}`;
        const res = await ctx.asHSE().post("/api/attributes", {
          code,
          nameEn: "HSE Filter Type",
          nameAr: "نوع فلتر السلامة",
          values: [{ value: "P3", sortOrder: 1 }, { value: "A2B2", sortOrder: 2 }],
        });
        assertStatus(res, 201);
        expect(res.data.code).toBe(code);
      },
    },
    {
      id: "T1-PPE-008-04",
      featureId: "PPE-008",
      tier: 1,
      title: "Verify attribute values are persisted in database",
      fn: async (ctx) => {
        const code = `ATTR-VALS-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Impact Rating",
          nameAr: "مقاومة الصدمات",
          values: [{ value: "Level 1", sortOrder: 1 }, { value: "Level 2", sortOrder: 2 }],
        });
        const getRes = await ctx.asAdmin().get(`/api/attributes/${created.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.values.length).toBe(2);
      },
    },
    {
      id: "T1-PPE-008-05",
      featureId: "PPE-008",
      tier: 1,
      title: "Verify audit log entry generated on attribute creation",
      fn: async (ctx) => {
        const code = `ATTR-AUD-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Grip Type",
          nameAr: "نوع التماسك",
          values: [{ value: "Smooth", sortOrder: 1 }],
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Attribute");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === created.data.id && l.action === "CREATED");
        expect(match).toBeDefined();
      },
    },

    // PPE-009: Edit Attribute (5 tests)
    {
      id: "T1-PPE-009-01",
      featureId: "PPE-009",
      tier: 1,
      title: "Edit attribute bilingual names",
      fn: async (ctx) => {
        const code = `ATTR-EDN-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Initial Attr",
          nameAr: "سمة أولية",
          values: [{ value: "A", sortOrder: 1 }],
        });
        const updateRes = await ctx.asAdmin().put(`/api/attributes/${created.data.id}`, {
          code,
          nameEn: "Updated Attr Name",
          nameAr: "سمة محدثة",
          values: [{ value: "A", sortOrder: 1 }],
        });
        assertStatus(updateRes, 200);
        expect(updateRes.data.nameEn).toBe("Updated Attr Name");
      },
    },
    {
      id: "T1-PPE-009-02",
      featureId: "PPE-009",
      tier: 1,
      title: "Append new values to existing attribute",
      fn: async (ctx) => {
        const code = `ATTR-ADDVAL-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Thickness",
          nameAr: "السماكة",
          values: [{ value: "0.5mm", sortOrder: 1 }],
        });
        const updateRes = await ctx.asAdmin().put(`/api/attributes/${created.data.id}`, {
          code,
          nameEn: "Thickness",
          nameAr: "السماكة",
          values: [{ value: "0.5mm", sortOrder: 1 }, { value: "1.0mm", sortOrder: 2 }],
        });
        assertStatus(updateRes, 200);
        const getRes = await ctx.asAdmin().get(`/api/attributes/${created.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.values.length).toBe(2);
      },
    },
    {
      id: "T1-PPE-009-03",
      featureId: "PPE-009",
      tier: 1,
      title: "Modify sortOrder of existing attribute values",
      fn: async (ctx) => {
        const code = `ATTR-SORT-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Priority",
          nameAr: "الأولوية",
          values: [{ value: "Low", sortOrder: 1 }, { value: "High", sortOrder: 2 }],
        });
        const updateRes = await ctx.asAdmin().put(`/api/attributes/${created.data.id}`, {
          code,
          nameEn: "Priority",
          nameAr: "الأولوية",
          values: [{ value: "High", sortOrder: 1 }, { value: "Low", sortOrder: 2 }],
        });
        assertStatus(updateRes, 200);
      },
    },
    {
      id: "T1-PPE-009-04",
      featureId: "PPE-009",
      tier: 1,
      title: "Edit attribute as HSE Supervisor",
      fn: async (ctx) => {
        const code = `ATTR-HSEED-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Grip Rating",
          nameAr: "مستوى القبضة",
          values: [{ value: "Standard", sortOrder: 1 }],
        });
        const updateRes = await ctx.asHSE().put(`/api/attributes/${created.data.id}`, {
          code,
          nameEn: "Grip Rating Pro",
          nameAr: "مستوى القبضة المحترف",
          values: [{ value: "Standard", sortOrder: 1 }, { value: "Extra", sortOrder: 2 }],
        });
        assertStatus(updateRes, 200);
      },
    },
    {
      id: "T1-PPE-009-05",
      featureId: "PPE-009",
      tier: 1,
      title: "Verify audit log entry generated on attribute update",
      fn: async (ctx) => {
        const code = `ATTR-UPDAUD-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Cuff Style",
          nameAr: "نوع الحافة",
          values: [{ value: "Knit", sortOrder: 1 }],
        });
        await ctx.asAdmin().put(`/api/attributes/${created.data.id}`, {
          code,
          nameEn: "Cuff Style Updated",
          nameAr: "نوع الحافة المحدث",
          values: [{ value: "Knit", sortOrder: 1 }],
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Attribute");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === created.data.id && l.action === "UPDATED");
        expect(match).toBeDefined();
      },
    },

    // PPE-010: View & Filter Attributes (5 tests)
    {
      id: "T1-PPE-010-01",
      featureId: "PPE-010",
      tier: 1,
      title: "List attributes with pagination metadata",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes");
        assertSuccess(res);
        expect(res.data.meta.total).toBeGreaterThan(0);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-010-02",
      featureId: "PPE-010",
      tier: 1,
      title: "Filter attributes by search term matching code",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes?search=COLOR");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-010-03",
      featureId: "PPE-010",
      tier: 1,
      title: "Filter attributes by search term matching English name",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes?search=Size");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-010-04",
      featureId: "PPE-010",
      tier: 1,
      title: "Filter attributes by active=true",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes?active=true");
        assertSuccess(res);
        expect(res.data.meta.total).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-010-05",
      featureId: "PPE-010",
      tier: 1,
      title: "Toggle attribute active status via PATCH /:id/active",
      fn: async (ctx) => {
        const code = `ATTR-TOG-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Temporary Attr",
          nameAr: "سمة مؤقتة",
          values: [{ value: "T1", sortOrder: 1 }],
        });
        const patchRes = await ctx.asAdmin().patch(`/api/attributes/${created.data.id}/active`, { active: false });
        assertStatus(patchRes, 200);
        expect(patchRes.data.active).toBe(false);
      },
    },

    // PPE-011: View Attribute Details (5 tests)
    {
      id: "T1-PPE-011-01",
      featureId: "PPE-011",
      tier: 1,
      title: "Retrieve attribute details by ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes/attr-color");
        assertSuccess(res);
        expect(res.data.id).toBe("attr-color");
      },
    },
    {
      id: "T1-PPE-011-02",
      featureId: "PPE-011",
      tier: 1,
      title: "Verify attribute details return child values array",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes/attr-color");
        assertSuccess(res);
        expect(Array.isArray(res.data.values)).toBe(true);
      },
    },
    {
      id: "T1-PPE-011-03",
      featureId: "PPE-011",
      tier: 1,
      title: "Verify child values have sortOrder and value string",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes/attr-color");
        assertSuccess(res);
        if (res.data.values.length > 0) {
          expect(typeof res.data.values[0].value).toBe("string");
          expect(typeof res.data.values[0].sortOrder).toBe("number");
        }
      },
    },
    {
      id: "T1-PPE-011-04",
      featureId: "PPE-011",
      tier: 1,
      title: "Verify bilingual names are returned for attribute",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes/attr-color");
        assertSuccess(res);
        expect(res.data.nameEn).toBeDefined();
        expect(res.data.nameAr).toBeDefined();
      },
    },
    {
      id: "T1-PPE-011-05",
      featureId: "PPE-011",
      tier: 1,
      title: "Verify attribute details return linked values relation",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/attributes/attr-color");
        assertSuccess(res);
        expect(res.data.id).toBe("attr-color");
        expect(Array.isArray(res.data.values)).toBe(true);
      },
    },

    // PPE-012: Move Attribute to Trash / Restore (5 tests)
    {
      id: "T1-PPE-012-01",
      featureId: "PPE-012",
      tier: 1,
      title: "Soft delete unused attribute to trash",
      fn: async (ctx) => {
        const code = `ATTR-DEL-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Disposable Attr",
          nameAr: "سمة قابلة للحذف",
          values: [{ value: "D1", sortOrder: 1 }],
        });
        const delRes = await ctx.asAdmin().delete(`/api/attributes/${created.data.id}`);
        assertStatus(delRes, 200);
      },
    },
    {
      id: "T1-PPE-012-02",
      featureId: "PPE-012",
      tier: 1,
      title: "Verify deleted attribute is excluded from default list",
      fn: async (ctx) => {
        const code = `ATTR-EXCL-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Excluded Attr",
          nameAr: "سمة مستبعدة",
          values: [{ value: "E1", sortOrder: 1 }],
        });
        await ctx.asAdmin().delete(`/api/attributes/${created.data.id}`);
        const listRes = await ctx.asAdmin().get(`/api/attributes?search=${code}`);
        assertSuccess(listRes);
        expect(listRes.data.data.length).toBe(0);
      },
    },
    {
      id: "T1-PPE-012-03",
      featureId: "PPE-012",
      tier: 1,
      title: "Verify deleted attribute is included with includeDeleted=true",
      fn: async (ctx) => {
        const code = `ATTR-INC-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Include Attr",
          nameAr: "سمة متضمنة",
          values: [{ value: "I1", sortOrder: 1 }],
        });
        await ctx.asAdmin().delete(`/api/attributes/${created.data.id}`);
        const listRes = await ctx.asAdmin().get(`/api/attributes?search=${code}&includeDeleted=true`);
        assertSuccess(listRes);
        expect(listRes.data.data.length).toBe(1);
        expect(listRes.data.data[0].deletedAt).toBeDefined();
      },
    },
    {
      id: "T1-PPE-012-04",
      featureId: "PPE-012",
      tier: 1,
      title: "Restore soft-deleted attribute from trash",
      fn: async (ctx) => {
        const code = `ATTR-REST-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Restore Attr",
          nameAr: "سمة مستعادة",
          values: [{ value: "R1", sortOrder: 1 }],
        });
        await ctx.asAdmin().delete(`/api/attributes/${created.data.id}`);
        const restRes = await ctx.asAdmin().post(`/api/attributes/${created.data.id}/restore`);
        assertStatus(restRes, 200);
        expect(restRes.data.active).toBe(true);
        expect(restRes.data.deletedAt).toBeNull();
      },
    },
    {
      id: "T1-PPE-012-05",
      featureId: "PPE-012",
      tier: 1,
      title: "Verify restored attribute child values remain intact",
      fn: async (ctx) => {
        const code = `ATTR-INTACT-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/attributes", {
          code,
          nameEn: "Intact Attr",
          nameAr: "سمة سليمة",
          values: [{ value: "V1", sortOrder: 1 }, { value: "V2", sortOrder: 2 }],
        });
        await ctx.asAdmin().delete(`/api/attributes/${created.data.id}`);
        await ctx.asAdmin().post(`/api/attributes/${created.data.id}/restore`);
        const getRes = await ctx.asAdmin().get(`/api/attributes/${created.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.values.length).toBe(2);
      },
    },
  ],
};
