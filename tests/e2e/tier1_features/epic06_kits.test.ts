import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertSuccess } from "../harness/assertions.js";

export const epic06KitsSuite: TestSuite = {
  name: "Tier 1 - Epic 6: Kit Management (PPE-029 to PPE-033)",
  tier: 1,
  tests: [
    // PPE-029: Add New Job-Specific Kit (5 tests)
    {
      id: "T1-PPE-029-01",
      featureId: "PPE-029",
      tier: 1,
      title: "Add job-specific kit with line items",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Electrical Safety Kit ${Date.now()}`,
          nameAr: "طقم سلامة فني الكهرباء",
          jobPositionId: "jp-1",
          items: [
            { ppeItemId: "ppe-hlm-001", qty: 1 },
            { ppeItemId: "ppe-glv-002", qty: 2 },
          ],
        });
        assertStatus(res, 201);
        expect(res.data.nameAr).toBe("طقم سلامة فني الكهرباء");
      },
    },
    {
      id: "T1-PPE-029-02",
      featureId: "PPE-029",
      tier: 1,
      title: "Add kit as HSE Supervisor persona",
      fn: async (ctx) => {
        const res = await ctx.asHSE().post("/api/kits", {
          nameEn: `Welder Protection Kit ${Date.now()}`,
          nameAr: "طقم وقاية اللحام",
          jobPositionId: "jp-4",
          items: [{ ppeItemId: "ppe-bot-003", qty: 1 }],
        });
        assertStatus(res, 201);
      },
    },
    {
      id: "T1-PPE-029-03",
      featureId: "PPE-029",
      tier: 1,
      title: "Add kit with 3 different PPE line items",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Scaffolding Rig Kit ${Date.now()}`,
          nameAr: "طقم فني السقالات الكامل",
          jobPositionId: "jp-5",
          items: [
            { ppeItemId: "ppe-hlm-001", qty: 1 },
            { ppeItemId: "ppe-glv-002", qty: 1 },
            { ppeItemId: "ppe-bot-003", qty: 1 },
          ],
        });
        assertStatus(res, 201);
        const getRes = await ctx.asAdmin().get(`/api/kits/${res.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.items.length).toBe(3);
      },
    },
    {
      id: "T1-PPE-029-04",
      featureId: "PPE-029",
      tier: 1,
      title: "Verify kit items quantities are persisted correctly",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Multiple Qty Kit ${Date.now()}`,
          nameAr: "طقم كميات متعددة",
          jobPositionId: "jp-10",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 3 }],
        });
        assertStatus(res, 201);
        const getRes = await ctx.asAdmin().get(`/api/kits/${res.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.items[0].qty).toBe(3);
      },
    },
    {
      id: "T1-PPE-029-05",
      featureId: "PPE-029",
      tier: 1,
      title: "Verify audit log entry generated on kit creation",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Audit Test Kit ${Date.now()}`,
          nameAr: "طقم تدقيق",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Kit");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === created.data.id && l.action === "CREATED");
        expect(match).toBeDefined();
      },
    },

    // PPE-030: Edit Kit (5 tests)
    {
      id: "T1-PPE-030-01",
      featureId: "PPE-030",
      tier: 1,
      title: "Edit kit bilingual names",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Initial Kit ${Date.now()}`,
          nameAr: "طقم أولي",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const updateRes = await ctx.asAdmin().put(`/api/kits/${created.data.id}`, {
          nameEn: "Updated Kit Name EN",
          nameAr: "اسم طقم محدث",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        assertStatus(updateRes, 200);
        expect(updateRes.data.nameEn).toBe("Updated Kit Name EN");
      },
    },
    {
      id: "T1-PPE-030-02",
      featureId: "PPE-030",
      tier: 1,
      title: "Update job position link on kit",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Reassigned Kit ${Date.now()}`,
          nameAr: "طقم يعاد تعيينه",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const updateRes = await ctx.asAdmin().put(`/api/kits/${created.data.id}`, {
          nameEn: "Reassigned Kit",
          nameAr: "طقم يعاد تعيينه",
          jobPositionId: "jp-4",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        assertStatus(updateRes, 200);
        expect(updateRes.data.jobPositionId).toBe("jp-4");
      },
    },
    {
      id: "T1-PPE-030-03",
      featureId: "PPE-030",
      tier: 1,
      title: "Modify line items inside existing kit",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Lines Kit ${Date.now()}`,
          nameAr: "طقم بنود",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const updateRes = await ctx.asAdmin().put(`/api/kits/${created.data.id}`, {
          nameEn: "Lines Kit",
          nameAr: "طقم بنود",
          jobPositionId: "jp-1",
          items: [
            { ppeItemId: "ppe-hlm-001", qty: 2 },
            { ppeItemId: "ppe-glv-002", qty: 3 },
          ],
        });
        assertStatus(updateRes, 200);
        const getRes = await ctx.asAdmin().get(`/api/kits/${created.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.items.length).toBe(2);
      },
    },
    {
      id: "T1-PPE-030-04",
      featureId: "PPE-030",
      tier: 1,
      title: "Edit kit as HSE Supervisor",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `HSE Edit Kit ${Date.now()}`,
          nameAr: "طقم تعديل السلامة",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const updateRes = await ctx.asHSE().put(`/api/kits/${created.data.id}`, {
          nameEn: "HSE Edit Kit Pro",
          nameAr: "طقم تعديل السلامة مطور",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        assertStatus(updateRes, 200);
      },
    },
    {
      id: "T1-PPE-030-05",
      featureId: "PPE-030",
      tier: 1,
      title: "Verify audit log entry generated on kit edit",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Audit Edit Kit ${Date.now()}`,
          nameAr: "طقم تدقيق التعديل",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        await ctx.asAdmin().put(`/api/kits/${created.data.id}`, {
          nameEn: "Audit Edit Kit Updated",
          nameAr: "طقم تدقيق التعديل محدث",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Kit");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === created.data.id && l.action === "UPDATED");
        expect(match).toBeDefined();
      },
    },

    // PPE-031: View & Filter Kits List (5 tests)
    {
      id: "T1-PPE-031-01",
      featureId: "PPE-031",
      tier: 1,
      title: "List kits with pagination metadata",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/kits");
        assertSuccess(res);
        expect(res.data.meta.total).toBeGreaterThan(0);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-031-02",
      featureId: "PPE-031",
      tier: 1,
      title: "Search kits by name keyword",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/kits?search=Safety");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-031-03",
      featureId: "PPE-031",
      tier: 1,
      title: "Filter kits by jobPositionId",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/kits?jobPositionId=jp-1");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-031-04",
      featureId: "PPE-031",
      tier: 1,
      title: "Filter kits by active=true",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/kits?active=true");
        assertSuccess(res);
        expect(res.data.meta.total).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-031-05",
      featureId: "PPE-031",
      tier: 1,
      title: "Toggle kit active status via PATCH /:id/active",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Toggle Kit ${Date.now()}`,
          nameAr: "طقم قابل للتبديل",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const patchRes = await ctx.asAdmin().patch(`/api/kits/${created.data.id}/active`, { active: false });
        assertStatus(patchRes, 200);
        expect(patchRes.data.active).toBe(false);
      },
    },

    // PPE-032: View Kit Details (5 tests)
    {
      id: "T1-PPE-032-01",
      featureId: "PPE-032",
      tier: 1,
      title: "Retrieve kit details by ID",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Details Kit ${Date.now()}`,
          nameAr: "طقم تفاصيل",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const res = await ctx.asAdmin().get(`/api/kits/${created.data.id}`);
        assertSuccess(res);
        expect(res.data.id).toBe(created.data.id);
      },
    },
    {
      id: "T1-PPE-032-02",
      featureId: "PPE-032",
      tier: 1,
      title: "Verify kit details return populated items array",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Items Pop Kit ${Date.now()}`,
          nameAr: "طقم بنود ممتلئة",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 2 }],
        });
        const res = await ctx.asAdmin().get(`/api/kits/${created.data.id}`);
        assertSuccess(res);
        expect(res.data.items.length).toBe(1);
        expect(res.data.items[0].ppeItemId || res.data.items[0].ppeItem).toBeDefined();
      },
    },
    {
      id: "T1-PPE-032-03",
      featureId: "PPE-032",
      tier: 1,
      title: "Verify kit details return jobPosition relation object",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `JP Rel Kit ${Date.now()}`,
          nameAr: "طقم علاقة الوظيفة",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const res = await ctx.asAdmin().get(`/api/kits/${created.data.id}`);
        assertSuccess(res);
        expect(res.data.jobPosition).toBeDefined();
        expect(res.data.jobPosition.id).toBe("jp-1");
      },
    },
    {
      id: "T1-PPE-032-04",
      featureId: "PPE-032",
      tier: 1,
      title: "Verify bilingual names are present in kit details",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Bilingual Kit ${Date.now()}`,
          nameAr: "طقم ثنائي اللغة",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const res = await ctx.asAdmin().get(`/api/kits/${created.data.id}`);
        assertSuccess(res);
        expect(res.data.nameEn).toBeDefined();
        expect(res.data.nameAr).toBeDefined();
      },
    },
    {
      id: "T1-PPE-032-05",
      featureId: "PPE-032",
      tier: 1,
      title: "Verify recent issuances relation is included or queryable",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Issuance Query Kit ${Date.now()}`,
          nameAr: "طقم استعلام الصرف",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const issRes = await ctx.asAdmin().get(`/api/issuances?kitId=${created.data.id}`);
        assertSuccess(issRes);
        expect(Array.isArray(issRes.data.data)).toBe(true);
      },
    },

    // PPE-033: Move Kit to Trash / Restore (5 tests)
    {
      id: "T1-PPE-033-01",
      featureId: "PPE-033",
      tier: 1,
      title: "Soft delete kit to trash bin",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Trash Kit ${Date.now()}`,
          nameAr: "طقم مهملات",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const delRes = await ctx.asAdmin().delete(`/api/kits/${created.data.id}`);
        assertStatus(delRes, 200);
      },
    },
    {
      id: "T1-PPE-033-02",
      featureId: "PPE-033",
      tier: 1,
      title: "Verify soft-deleted kit is excluded from standard kit listings",
      fn: async (ctx) => {
        const name = `Excl Kit ${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: name,
          nameAr: "طقم مستبعد",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        await ctx.asAdmin().delete(`/api/kits/${created.data.id}`);
        const listRes = await ctx.asAdmin().get(`/api/kits?search=${name}`);
        assertSuccess(listRes);
        expect(listRes.data.data.length).toBe(0);
      },
    },
    {
      id: "T1-PPE-033-03",
      featureId: "PPE-033",
      tier: 1,
      title: "Verify deleted kit is included with includeDeleted=true",
      fn: async (ctx) => {
        const name = `Inc Kit ${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: name,
          nameAr: "طقم متضمن",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        await ctx.asAdmin().delete(`/api/kits/${created.data.id}`);
        const listRes = await ctx.asAdmin().get(`/api/kits?search=${name}&includeDeleted=true`);
        assertSuccess(listRes);
        expect(listRes.data.data.length).toBe(1);
        expect(listRes.data.data[0].deletedAt).toBeDefined();
      },
    },
    {
      id: "T1-PPE-033-04",
      featureId: "PPE-033",
      tier: 1,
      title: "Restore soft-deleted kit from trash",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Restore Kit ${Date.now()}`,
          nameAr: "طقم مستعاد",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        await ctx.asAdmin().delete(`/api/kits/${created.data.id}`);
        const restRes = await ctx.asAdmin().post(`/api/kits/${created.data.id}/restore`);
        assertStatus(restRes, 200);
        expect(restRes.data.active).toBe(true);
        expect(restRes.data.deletedAt).toBeNull();
      },
    },
    {
      id: "T1-PPE-033-05",
      featureId: "PPE-033",
      tier: 1,
      title: "Verify restored kit line items remain intact",
      fn: async (ctx) => {
        const created = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Intact Kit ${Date.now()}`,
          nameAr: "طقم بنود محفوظة",
          jobPositionId: "jp-1",
          items: [
            { ppeItemId: "ppe-hlm-001", qty: 1 },
            { ppeItemId: "ppe-glv-002", qty: 2 },
          ],
        });
        await ctx.asAdmin().delete(`/api/kits/${created.data.id}`);
        await ctx.asAdmin().post(`/api/kits/${created.data.id}/restore`);
        const getRes = await ctx.asAdmin().get(`/api/kits/${created.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.items.length).toBe(2);
      },
    },
  ],
};
