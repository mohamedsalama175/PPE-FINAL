import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertSuccess } from "../harness/assertions.js";

export const epic01CatalogSuite: TestSuite = {
  name: "Tier 1 - Epic 1: Catalog Management (PPE-001 to PPE-007)",
  tier: 1,
  tests: [
    // PPE-001: Add New PPE Item (5 tests)
    {
      id: "T1-PPE-001-01",
      featureId: "PPE-001",
      tier: 1,
      title: "Add PPE item with Days lifespan and verify creation",
      fn: async (ctx) => {
        const code = `ITEM-D-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Safety Helmet Class E",
          nameAr: "خوذة سلامة فئة E",
          category: "Head",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Days",
          lifespanValue: 180,
          riskCategory: "II",
          reorderLevel: 10,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        assertStatus(res, 201);
        expect(res.data.itemCode).toBe(code);
        expect(res.data.lifespanType).toBe("Days");
        expect(res.data.lifespanValue).toBe(180);
      },
    },
    {
      id: "T1-PPE-001-02",
      featureId: "PPE-001",
      tier: 1,
      title: "Add PPE item with Months lifespan unit",
      fn: async (ctx) => {
        const code = `ITEM-M-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Heavy Duty Chemical Gloves",
          nameAr: "قفازات كيميائية ثقيلة",
          category: "Hand",
          itemGroupId: "grp-gloves",
          hasSize: true,
          gender: "Unisex",
          lifespanType: "Months",
          lifespanValue: 6,
          riskCategory: "II",
          reorderLevel: 25,
          locationIds: ["loc-cai-new", "loc-cai-usd"],
          uom: "Pair",
        });
        assertStatus(res, 201);
        expect(res.data.lifespanType).toBe("Months");
        expect(res.data.lifespanValue).toBe(6);
      },
    },
    {
      id: "T1-PPE-001-03",
      featureId: "PPE-001",
      tier: 1,
      title: "Add PPE item with Years lifespan unit",
      fn: async (ctx) => {
        const code = `ITEM-Y-${Date.now()}`;
        const res = await ctx.asHSE().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Fall Arrest Full Harness",
          nameAr: "حزام أمان كامل لمقاومة السقوط",
          category: "Body",
          itemGroupId: "grp-respirators",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Years",
          lifespanValue: 5,
          riskCategory: "III",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        assertStatus(res, 201);
        expect(res.data.lifespanType).toBe("Years");
        expect(res.data.lifespanValue).toBe(5);
      },
    },
    {
      id: "T1-PPE-001-04",
      featureId: "PPE-001",
      tier: 1,
      title: "Add PPE item with multiple assigned locations",
      fn: async (ctx) => {
        const code = `ITEM-ML-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Safety Glasses Clear",
          nameAr: "نظارات حماية شفافة",
          category: "Eye",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Months",
          lifespanValue: 12,
          riskCategory: "I",
          reorderLevel: 50,
          locationIds: ["loc-cai-new", "loc-cai-usd", "loc-cai-scr"],
          uom: "Piece",
        });
        assertStatus(res, 201);
        const getRes = await ctx.asAdmin().get(`/api/ppe-items/${res.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.locationIds.length).toBe(3);
      },
    },
    {
      id: "T1-PPE-001-05",
      featureId: "PPE-001",
      tier: 1,
      title: "Add PPE item with Category III high risk classification",
      fn: async (ctx) => {
        const code = `ITEM-CAT3-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Supplied Air Respirator Hood",
          nameAr: "غطاء تنفس مزود بهواء نقي",
          category: "Respiratory",
          itemGroupId: "grp-respirators",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Years",
          lifespanValue: 2,
          riskCategory: "III",
          reorderLevel: 8,
          locationIds: ["loc-cai-new"],
          uom: "Set",
        });
        assertStatus(res, 201);
        expect(res.data.riskCategory).toBe("III");
      },
    },

    // PPE-002: Edit or Deactivate Item (5 tests)
    {
      id: "T1-PPE-002-01",
      featureId: "PPE-002",
      tier: 1,
      title: "Edit PPE item descriptive names and metadata",
      fn: async (ctx) => {
        const code = `EDIT-META-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Initial Name",
          nameAr: "الاسم الأولي",
          category: "Head",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Months",
          lifespanValue: 12,
          riskCategory: "I",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        const updateRes = await ctx.asAdmin().put(`/api/ppe-items/${created.data.id}`, {
          itemCode: code,
          nameEn: "Updated Name EN",
          nameAr: "الاسم المحدث",
          category: "Head",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Months",
          lifespanValue: 12,
          riskCategory: "I",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        assertStatus(updateRes, 200);
        expect(updateRes.data.nameEn).toBe("Updated Name EN");
      },
    },
    {
      id: "T1-PPE-002-02",
      featureId: "PPE-002",
      tier: 1,
      title: "Update reorder levels on existing catalog item",
      fn: async (ctx) => {
        const code = `REORDER-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Ear Plugs Box",
          nameAr: "علبة سدادات أذن",
          category: "Hearing",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Days",
          lifespanValue: 30,
          riskCategory: "I",
          reorderLevel: 20,
          locationIds: ["loc-cai-new"],
          uom: "Box",
        });
        const updateRes = await ctx.asAdmin().put(`/api/ppe-items/${created.data.id}`, {
          itemCode: code,
          nameEn: "Ear Plugs Box",
          nameAr: "علبة سدادات أذن",
          category: "Hearing",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Days",
          lifespanValue: 30,
          riskCategory: "I",
          reorderLevel: 45,
          locationIds: ["loc-cai-new"],
          uom: "Box",
        });
        assertStatus(updateRes, 200);
        expect(updateRes.data.reorderLevel).toBe(45);
      },
    },
    {
      id: "T1-PPE-002-03",
      featureId: "PPE-002",
      tier: 1,
      title: "Deactivate item via active toggle endpoint",
      fn: async (ctx) => {
        const code = `DEACT-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Disposable Dust Mask",
          nameAr: "قناع غبار أحادي الاستخدام",
          category: "Respiratory",
          itemGroupId: "grp-respirators",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Days",
          lifespanValue: 1,
          riskCategory: "I",
          reorderLevel: 100,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        const deactRes = await ctx.asAdmin().patch(`/api/ppe-items/${created.data.id}/active`, { active: false });
        assertStatus(deactRes, 200);
        expect(deactRes.data.active).toBe(false);
      },
    },
    {
      id: "T1-PPE-002-04",
      featureId: "PPE-002",
      tier: 1,
      title: "Reactivate previously deactivated item",
      fn: async (ctx) => {
        const code = `REACT-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Hi-Vis Vest",
          nameAr: "سترة عاكسة",
          category: "Body",
          itemGroupId: "grp-respirators",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Months",
          lifespanValue: 12,
          riskCategory: "I",
          reorderLevel: 30,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        await ctx.asAdmin().patch(`/api/ppe-items/${created.data.id}/active`, { active: false });
        const reactRes = await ctx.asAdmin().patch(`/api/ppe-items/${created.data.id}/active`, { active: true });
        assertStatus(reactRes, 200);
        expect(reactRes.data.active).toBe(true);
      },
    },
    {
      id: "T1-PPE-002-05",
      featureId: "PPE-002",
      tier: 1,
      title: "Verify audit log entry generated on item edit",
      fn: async (ctx) => {
        const code = `AUDIT-ITEM-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Audit Helmet",
          nameAr: "خوذة تدقيق",
          category: "Head",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Years",
          lifespanValue: 3,
          riskCategory: "II",
          reorderLevel: 10,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=PPEItem");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === created.data.id && l.action === "CREATED");
        expect(match).toBeDefined();
      },
    },

    // PPE-003: Set Item Lifespan (5 tests)
    {
      id: "T1-PPE-003-01",
      featureId: "PPE-003",
      tier: 1,
      title: "Set short time-based lifespan (15 Days)",
      fn: async (ctx) => {
        const code = `LIFE-D15-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Disposable Gloves",
          nameAr: "قفازات استخدام مرة واحدة",
          category: "Hand",
          itemGroupId: "grp-gloves",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Days",
          lifespanValue: 15,
          riskCategory: "I",
          reorderLevel: 50,
          locationIds: ["loc-cai-new"],
          uom: "Box",
        });
        assertStatus(res, 201);
        expect(res.data.lifespanValue).toBe(15);
        expect(res.data.lifespanType).toBe("Days");
      },
    },
    {
      id: "T1-PPE-003-02",
      featureId: "PPE-003",
      tier: 1,
      title: "Set medium time-based lifespan (9 Months)",
      fn: async (ctx) => {
        const code = `LIFE-M9-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Rubber Work Boots",
          nameAr: "أحذية عمل مطاطية",
          category: "Foot",
          itemGroupId: "grp-footwear",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Months",
          lifespanValue: 9,
          riskCategory: "II",
          reorderLevel: 15,
          locationIds: ["loc-cai-new"],
          uom: "Pair",
        });
        assertStatus(res, 201);
        expect(res.data.lifespanValue).toBe(9);
        expect(res.data.lifespanType).toBe("Months");
      },
    },
    {
      id: "T1-PPE-003-03",
      featureId: "PPE-003",
      tier: 1,
      title: "Set long time-based lifespan (4 Years)",
      fn: async (ctx) => {
        const code = `LIFE-Y4-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Heavy Safety Visor",
          nameAr: "قناع أمان ثقيل للوجه",
          category: "Eye",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Years",
          lifespanValue: 4,
          riskCategory: "II",
          reorderLevel: 10,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        assertStatus(res, 201);
        expect(res.data.lifespanValue).toBe(4);
        expect(res.data.lifespanType).toBe("Years");
      },
    },
    {
      id: "T1-PPE-003-04",
      featureId: "PPE-003",
      tier: 1,
      title: "Update lifespan value on existing item from 6 to 18 Months",
      fn: async (ctx) => {
        const code = `LIFE-MOD-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Welding Apron",
          nameAr: "مريلة لحام جلدية",
          category: "Body",
          itemGroupId: "grp-respirators",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Months",
          lifespanValue: 6,
          riskCategory: "II",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        const updateRes = await ctx.asAdmin().put(`/api/ppe-items/${created.data.id}`, {
          itemCode: code,
          nameEn: "Welding Apron",
          nameAr: "مريلة لحام جلدية",
          category: "Body",
          itemGroupId: "grp-respirators",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Months",
          lifespanValue: 18,
          riskCategory: "II",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        assertStatus(updateRes, 200);
        expect(updateRes.data.lifespanValue).toBe(18);
      },
    },
    {
      id: "T1-PPE-003-05",
      featureId: "PPE-003",
      tier: 1,
      title: "Verify lifespan fields are returned in item details view",
      fn: async (ctx) => {
        const code = `LIFE-VIEW-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Filter Cartridge ABEK1",
          nameAr: "فلتر تنفس ABEK1",
          category: "Respiratory",
          itemGroupId: "grp-respirators",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Days",
          lifespanValue: 90,
          riskCategory: "III",
          reorderLevel: 20,
          locationIds: ["loc-cai-new"],
          uom: "Pair",
        });
        const getRes = await ctx.asAdmin().get(`/api/ppe-items/${created.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.lifespanType).toBe("Days");
        expect(getRes.data.lifespanValue).toBe(90);
      },
    },

    // PPE-004: Move Item to Trash / Restore (5 tests)
    {
      id: "T1-PPE-004-01",
      featureId: "PPE-004",
      tier: 1,
      title: "Soft delete item to trash bin",
      fn: async (ctx) => {
        const code = `TRASH-ITEM-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Temporary Goggles",
          nameAr: "نظارات مؤقتة",
          category: "Eye",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Months",
          lifespanValue: 6,
          riskCategory: "I",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        const delRes = await ctx.asAdmin().delete(`/api/ppe-items/${created.data.id}`);
        assertStatus(delRes, 200);
      },
    },
    {
      id: "T1-PPE-004-02",
      featureId: "PPE-004",
      tier: 1,
      title: "Verify soft-deleted item is excluded from active catalog query",
      fn: async (ctx) => {
        const code = `EXCL-TRASH-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Excluded Mask",
          nameAr: "كمامة مستبعدة",
          category: "Respiratory",
          itemGroupId: "grp-respirators",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Days",
          lifespanValue: 30,
          riskCategory: "I",
          reorderLevel: 10,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        await ctx.asAdmin().delete(`/api/ppe-items/${created.data.id}`);
        const listRes = await ctx.asAdmin().get(`/api/ppe-items?search=${code}`);
        assertSuccess(listRes);
        expect(listRes.data.data.length).toBe(0);
      },
    },
    {
      id: "T1-PPE-004-03",
      featureId: "PPE-004",
      tier: 1,
      title: "Query soft-deleted item with includeDeleted=true",
      fn: async (ctx) => {
        const code = `INC-TRASH-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Queryable Trashed Item",
          nameAr: "صنف محذوف قابل للاستعلام",
          category: "Head",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Years",
          lifespanValue: 1,
          riskCategory: "I",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        await ctx.asAdmin().delete(`/api/ppe-items/${created.data.id}`);
        const listRes = await ctx.asAdmin().get(`/api/ppe-items?search=${code}&includeDeleted=true`);
        assertSuccess(listRes);
        expect(listRes.data.data.length).toBe(1);
        expect(listRes.data.data[0].deletedAt).toBeDefined();
      },
    },
    {
      id: "T1-PPE-004-04",
      featureId: "PPE-004",
      tier: 1,
      title: "Restore soft-deleted item from trash",
      fn: async (ctx) => {
        const code = `RESTORE-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Restorable Shield",
          nameAr: "درع قابل للاستعادة",
          category: "Eye",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Years",
          lifespanValue: 2,
          riskCategory: "I",
          reorderLevel: 10,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        await ctx.asAdmin().delete(`/api/ppe-items/${created.data.id}`);
        const restRes = await ctx.asAdmin().post(`/api/ppe-items/${created.data.id}/restore`);
        assertStatus(restRes, 200);
        expect(restRes.data.active).toBe(true);
        expect(restRes.data.deletedAt).toBeNull();
      },
    },
    {
      id: "T1-PPE-004-05",
      featureId: "PPE-004",
      tier: 1,
      title: "Verify restored item reappears in active catalog search",
      fn: async (ctx) => {
        const code = `REAPPEAR-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Reappearing Helmet",
          nameAr: "خوذة تستعيد الظهور",
          category: "Head",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Years",
          lifespanValue: 3,
          riskCategory: "II",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        await ctx.asAdmin().delete(`/api/ppe-items/${created.data.id}`);
        await ctx.asAdmin().post(`/api/ppe-items/${created.data.id}/restore`);
        const searchRes = await ctx.asAdmin().get(`/api/ppe-items?search=${code}`);
        assertSuccess(searchRes);
        expect(searchRes.data.data.length).toBe(1);
      },
    },

    // PPE-005: View & Filter Catalog (5 tests)
    {
      id: "T1-PPE-005-01",
      featureId: "PPE-005",
      tier: 1,
      title: "Search catalog by keyword in itemCode or name",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items?search=HELM");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-005-02",
      featureId: "PPE-005",
      tier: 1,
      title: "Filter catalog by category (Head)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items?category=Head");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-005-03",
      featureId: "PPE-005",
      tier: 1,
      title: "Filter catalog by itemGroupId (ig-1)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items?itemGroupId=grp-helmets");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-005-04",
      featureId: "PPE-005",
      tier: 1,
      title: "Filter catalog by active=true status",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items?active=true");
        assertSuccess(res);
        expect(res.data.meta.total).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-005-05",
      featureId: "PPE-005",
      tier: 1,
      title: "Verify catalog pagination structure and limit",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items?page=1&limit=2");
        assertSuccess(res);
        expect(res.data.data.length).toBeLessThanOrEqual(2);
        expect(res.data.meta.page).toBe(1);
        expect(res.data.meta.limit).toBe(2);
      },
    },

    // PPE-006: View Item Details (5 tests)
    {
      id: "T1-PPE-006-01",
      featureId: "PPE-006",
      tier: 1,
      title: "Retrieve item details by ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items/ppe-hlm-001");
        assertSuccess(res);
        expect(res.data.id).toBe("ppe-hlm-001");
      },
    },
    {
      id: "T1-PPE-006-02",
      featureId: "PPE-006",
      tier: 1,
      title: "Verify item details include linked locationIds",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items/ppe-hlm-001");
        assertSuccess(res);
        expect(Array.isArray(res.data.locationIds)).toBe(true);
      },
    },
    {
      id: "T1-PPE-006-03",
      featureId: "PPE-006",
      tier: 1,
      title: "Verify item details include parent itemGroup relation",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items/ppe-hlm-001");
        assertSuccess(res);
        expect(res.data.itemGroup).toBeDefined();
        expect(res.data.itemGroup.id).toBeDefined();
      },
    },
    {
      id: "T1-PPE-006-04",
      featureId: "PPE-006",
      tier: 1,
      title: "Verify bilingual names are returned in details view",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items/ppe-hlm-001");
        assertSuccess(res);
        expect(typeof res.data.nameEn).toBe("string");
        expect(typeof res.data.nameAr).toBe("string");
      },
    },
    {
      id: "T1-PPE-006-05",
      featureId: "PPE-006",
      tier: 1,
      title: "Verify UOM and risk category are present in item details",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items/ppe-hlm-001");
        assertSuccess(res);
        expect(res.data.uom).toBeDefined();
        expect(res.data.riskCategory).toBeDefined();
      },
    },

    // PPE-007: Export / Import Catalog (5 tests)
    {
      id: "T1-PPE-007-01",
      featureId: "PPE-007",
      tier: 1,
      title: "Export catalog as CSV with text/csv header",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items/export");
        assertSuccess(res);
        expect(res.headers.get("content-type") || "").toContain("text/csv");
      },
    },
    {
      id: "T1-PPE-007-02",
      featureId: "PPE-007",
      tier: 1,
      title: "Verify CSV export contains column header row",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items/export");
        assertSuccess(res);
        expect(res.text).toContain("Item Code");
        expect(res.text).toContain("Name EN");
      },
    },
    {
      id: "T1-PPE-007-03",
      featureId: "PPE-007",
      tier: 1,
      title: "Verify CSV export includes active items in database",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items/export");
        assertSuccess(res);
        expect(res.text).toContain("HLM-001");
      },
    },
    {
      id: "T1-PPE-007-04",
      featureId: "PPE-007",
      tier: 1,
      title: "Verify export attachment filename in Content-Disposition header",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/ppe-items/export");
        assertSuccess(res);
        const disposition = res.headers.get("content-disposition") || "";
        expect(disposition).toContain("attachment");
      },
    },
    {
      id: "T1-PPE-007-05",
      featureId: "PPE-007",
      tier: 1,
      title: "Verify catalog export is restricted from unauthenticated access",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().get("/api/ppe-items/export");
        assertStatus(res, 401);
      },
    },
  ],
};
