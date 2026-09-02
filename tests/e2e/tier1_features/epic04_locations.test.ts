import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertSuccess } from "../harness/assertions.js";

export const epic04LocationsSuite: TestSuite = {
  name: "Tier 1 - Epic 4: Locations Management (PPE-018 to PPE-023)",
  tier: 1,
  tests: [
    // PPE-018: Add New Location (5 tests)
    {
      id: "T1-PPE-018-01",
      featureId: "PPE-018",
      tier: 1,
      title: "Add Central Warehouse location with capacity and assigned store keeper",
      fn: async (ctx) => {
        const code = `LOC-CW-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Central Safety Hub",
          nameAr: "مركز السلامة الرئيسي",
          site: "Cairo Site",
          locationType: "Central Warehouse",
          capacityUnits: 1500,
          description: "Main central distribution warehouse",
          address: "Building 4, Industrial Zone, Cairo",
          assignedStoreKeeperIds: ["emp-8"],
        });
        assertStatus(res, 201);
        expect(res.data.code).toBe(code);
        expect(res.data.capacityUnits).toBe(1500);
      },
    },
    {
      id: "T1-PPE-018-02",
      featureId: "PPE-018",
      tier: 1,
      title: "Add Site Store location with capacity units",
      fn: async (ctx) => {
        const code = `LOC-SS-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Plant Site Store B",
          nameAr: "مستودع الموقع ب",
          site: "Alexandria Site",
          locationType: "Site Store",
          capacityUnits: 500,
          description: "Local jobsite tool and PPE shed",
          address: "Gate 2, Alexandria Complex",
          assignedStoreKeeperIds: ["emp-11"],
        });
        assertStatus(res, 201);
      },
    },
    {
      id: "T1-PPE-018-03",
      featureId: "PPE-018",
      tier: 1,
      title: "Add Scrap location (exempt from capacity)",
      fn: async (ctx) => {
        const code = `LOC-SC-${Date.now()}`;
        const res = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Scrap Yard Yard 1",
          nameAr: "ساحة الخردة والتكهين",
          site: "Cairo Site",
          locationType: "Scrap",
          capacityUnits: 0,
          description: "Decommissioned PPE quarantine & disposal",
          address: "Yard perimeter C",
          assignedStoreKeeperIds: [],
        });
        assertStatus(res, 201);
      },
    },
    {
      id: "T1-PPE-018-04",
      featureId: "PPE-018",
      tier: 1,
      title: "Add Used equipment staging location",
      fn: async (ctx) => {
        const code = `LOC-US-${Date.now()}`;
        const res = await ctx.asHSE().post("/api/locations", {
          code,
          nameEn: "Used Equipment Staging",
          nameAr: "مستودع المهمات المستعملة",
          site: "Cairo Site",
          locationType: "Used",
          capacityUnits: 300,
          description: "Inspected reusable PPE for temporary loan",
          address: "Room 102",
          assignedStoreKeeperIds: ["emp-8"],
        });
        assertStatus(res, 201);
      },
    },
    {
      id: "T1-PPE-018-05",
      featureId: "PPE-018",
      tier: 1,
      title: "Verify audit log entry generated on location creation",
      fn: async (ctx) => {
        const code = `LOC-AUD-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Audit Location",
          nameAr: "موقع التدقيق",
          site: "Main Campus",
          locationType: "General",
          capacityUnits: 100,
          description: "Test description",
          address: "HQ Floor 1",
          assignedStoreKeeperIds: [],
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Location");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === created.data.id && l.action === "CREATED");
        expect(match).toBeDefined();
      },
    },

    // PPE-019: Edit Location (5 tests)
    {
      id: "T1-PPE-019-01",
      featureId: "PPE-019",
      tier: 1,
      title: "Edit location descriptive metadata",
      fn: async (ctx) => {
        const code = `LOC-EDNAME-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Initial Location Name",
          nameAr: "اسم الموقع الأولي",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 200,
          description: "Old description",
          address: "Old address",
          assignedStoreKeeperIds: [],
        });
        const updateRes = await ctx.asAdmin().put(`/api/locations/${created.data.id}`, {
          code,
          nameEn: "Updated Location Name EN",
          nameAr: "اسم الموقع المحدث",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 200,
          description: "New description",
          address: "New address",
          assignedStoreKeeperIds: [],
        });
        assertStatus(updateRes, 200);
        expect(updateRes.data.nameEn).toBe("Updated Location Name EN");
      },
    },
    {
      id: "T1-PPE-019-02",
      featureId: "PPE-019",
      tier: 1,
      title: "Update capacity units on existing location",
      fn: async (ctx) => {
        const code = `LOC-EDCAP-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Cap Location",
          nameAr: "موقع السعة",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Capacity test",
          address: "B1",
          assignedStoreKeeperIds: [],
        });
        const updateRes = await ctx.asAdmin().put(`/api/locations/${created.data.id}`, {
          code,
          nameEn: "Cap Location",
          nameAr: "موقع السعة",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 450,
          description: "Expanded capacity",
          address: "B1",
          assignedStoreKeeperIds: [],
        });
        assertStatus(updateRes, 200);
        expect(updateRes.data.capacityUnits).toBe(450);
      },
    },
    {
      id: "T1-PPE-019-03",
      featureId: "PPE-019",
      tier: 1,
      title: "Update assigned store keepers for location",
      fn: async (ctx) => {
        const code = `LOC-EDSK-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Keeper Location",
          nameAr: "موقع أمناء المخزن",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Keeper test",
          address: "B2",
          assignedStoreKeeperIds: ["emp-8"],
        });
        const updateRes = await ctx.asAdmin().put(`/api/locations/${created.data.id}`, {
          code,
          nameEn: "Keeper Location",
          nameAr: "موقع أمناء المخزن",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Keeper test",
          address: "B2",
          assignedStoreKeeperIds: ["emp-8", "emp-11"],
        });
        assertStatus(updateRes, 200);
        const getRes = await ctx.asAdmin().get(`/api/locations/${created.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.assignedStoreKeeperIds.length).toBe(2);
      },
    },
    {
      id: "T1-PPE-019-04",
      featureId: "PPE-019",
      tier: 1,
      title: "Edit location as HSE Supervisor",
      fn: async (ctx) => {
        const code = `LOC-HSEED-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "HSE Location",
          nameAr: "موقع السلامة",
          site: "Alexandria Site",
          locationType: "Site Store",
          capacityUnits: 150,
          description: "HSE store",
          address: "Gate 1",
          assignedStoreKeeperIds: [],
        });
        const updateRes = await ctx.asHSE().put(`/api/locations/${created.data.id}`, {
          code,
          nameEn: "HSE Location Pro",
          nameAr: "موقع السلامة المطور",
          site: "Alexandria Site",
          locationType: "Site Store",
          capacityUnits: 250,
          description: "Upgraded HSE store",
          address: "Gate 1",
          assignedStoreKeeperIds: [],
        });
        assertStatus(updateRes, 200);
      },
    },
    {
      id: "T1-PPE-019-05",
      featureId: "PPE-019",
      tier: 1,
      title: "Verify audit log entry generated on location update",
      fn: async (ctx) => {
        const code = `LOC-AUDED-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Audited Loc",
          nameAr: "موقع مدقق",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Desc",
          address: "Addr",
          assignedStoreKeeperIds: [],
        });
        await ctx.asAdmin().put(`/api/locations/${created.data.id}`, {
          code,
          nameEn: "Audited Loc Updated",
          nameAr: "موقع مدقق محدث",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 120,
          description: "Desc updated",
          address: "Addr updated",
          assignedStoreKeeperIds: [],
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Location");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === created.data.id && l.action === "UPDATED");
        expect(match).toBeDefined();
      },
    },

    // PPE-020: View & Filter Locations (5 tests)
    {
      id: "T1-PPE-020-01",
      featureId: "PPE-020",
      tier: 1,
      title: "List locations with pagination metadata",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations");
        assertSuccess(res);
        expect(res.data.meta.total).toBeGreaterThan(0);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-020-02",
      featureId: "PPE-020",
      tier: 1,
      title: "Filter locations by site name",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations?site=Cairo Site");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-020-03",
      featureId: "PPE-020",
      tier: 1,
      title: "Filter locations by locationType",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations?locationType=Central Warehouse");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-020-04",
      featureId: "PPE-020",
      tier: 1,
      title: "Search locations by keyword in name or code",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations?search=Cairo");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-020-05",
      featureId: "PPE-020",
      tier: 1,
      title: "Toggle location active status for empty location",
      fn: async (ctx) => {
        const code = `LOC-TOG-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Empty Loc",
          nameAr: "موقع فارغ",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "Empty",
          address: "Room 9",
          assignedStoreKeeperIds: [],
        });
        const patchRes = await ctx.asAdmin().patch(`/api/locations/${created.data.id}/active`, { active: false });
        assertStatus(patchRes, 200);
        expect(patchRes.data.active).toBe(false);
      },
    },

    // PPE-021: View Location Details (5 tests)
    {
      id: "T1-PPE-021-01",
      featureId: "PPE-021",
      tier: 1,
      title: "Retrieve location details by ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations/loc-cai-new");
        assertSuccess(res);
        expect(res.data.id).toBe("loc-cai-new");
      },
    },
    {
      id: "T1-PPE-021-02",
      featureId: "PPE-021",
      tier: 1,
      title: "Verify location details include assignedStoreKeeperIds",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations/loc-cai-new");
        assertSuccess(res);
        expect(Array.isArray(res.data.assignedStoreKeeperIds)).toBe(true);
      },
    },
    {
      id: "T1-PPE-021-03",
      featureId: "PPE-021",
      tier: 1,
      title: "Verify capacity units are returned for location",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations/loc-cai-new");
        assertSuccess(res);
        expect(typeof res.data.capacityUnits).toBe("number");
      },
    },
    {
      id: "T1-PPE-021-04",
      featureId: "PPE-021",
      tier: 1,
      title: "Verify site and denormalized locationType are returned",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations/loc-cai-new");
        assertSuccess(res);
        expect(res.data.site).toBeDefined();
        expect(res.data.locationType).toBeDefined();
      },
    },
    {
      id: "T1-PPE-021-05",
      featureId: "PPE-021",
      tier: 1,
      title: "Verify bilingual names are present in location details",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations/loc-cai-new");
        assertSuccess(res);
        expect(res.data.nameEn).toBeDefined();
        expect(res.data.nameAr).toBeDefined();
      },
    },

    // PPE-022: Move Location to Trash / Restore (5 tests)
    {
      id: "T1-PPE-022-01",
      featureId: "PPE-022",
      tier: 1,
      title: "Soft delete empty location to trash",
      fn: async (ctx) => {
        const code = `LOC-DEL-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Temporary Loc",
          nameAr: "موقع مؤقت",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "Temporary",
          address: "A1",
          assignedStoreKeeperIds: [],
        });
        const delRes = await ctx.asAdmin().delete(`/api/locations/${created.data.id}`);
        assertStatus(delRes, 200);
      },
    },
    {
      id: "T1-PPE-022-02",
      featureId: "PPE-022",
      tier: 1,
      title: "Verify deleted location is excluded from active listings",
      fn: async (ctx) => {
        const code = `LOC-EXCL-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Excluded Loc",
          nameAr: "موقع مستبعد",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "Excluded",
          address: "A2",
          assignedStoreKeeperIds: [],
        });
        await ctx.asAdmin().delete(`/api/locations/${created.data.id}`);
        const listRes = await ctx.asAdmin().get(`/api/locations?search=${code}`);
        assertSuccess(listRes);
        expect(listRes.data.data.length).toBe(0);
      },
    },
    {
      id: "T1-PPE-022-03",
      featureId: "PPE-022",
      tier: 1,
      title: "Verify deleted location is returned with includeDeleted=true",
      fn: async (ctx) => {
        const code = `LOC-INC-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Include Loc",
          nameAr: "موقع متضمن",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "Include",
          address: "A3",
          assignedStoreKeeperIds: [],
        });
        await ctx.asAdmin().delete(`/api/locations/${created.data.id}`);
        const listRes = await ctx.asAdmin().get(`/api/locations?search=${code}&includeDeleted=true`);
        assertSuccess(listRes);
        expect(listRes.data.data.length).toBe(1);
        expect(listRes.data.data[0].deletedAt).toBeDefined();
      },
    },
    {
      id: "T1-PPE-022-04",
      featureId: "PPE-022",
      tier: 1,
      title: "Restore soft-deleted location from trash",
      fn: async (ctx) => {
        const code = `LOC-REST-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Restore Loc",
          nameAr: "موقع مستعاد",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "Restore",
          address: "A4",
          assignedStoreKeeperIds: [],
        });
        await ctx.asAdmin().delete(`/api/locations/${created.data.id}`);
        const restRes = await ctx.asAdmin().post(`/api/locations/${created.data.id}/restore`);
        assertStatus(restRes, 200);
        expect(restRes.data.active).toBe(true);
        expect(restRes.data.deletedAt).toBeNull();
      },
    },
    {
      id: "T1-PPE-022-05",
      featureId: "PPE-022",
      tier: 1,
      title: "Verify restored location is searchable again",
      fn: async (ctx) => {
        const code = `LOC-RESRCH-${Date.now()}`;
        const created = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Re-search Loc",
          nameAr: "موقع يبحث ثانية",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "Research",
          address: "A5",
          assignedStoreKeeperIds: [],
        });
        await ctx.asAdmin().delete(`/api/locations/${created.data.id}`);
        await ctx.asAdmin().post(`/api/locations/${created.data.id}/restore`);
        const listRes = await ctx.asAdmin().get(`/api/locations?search=${code}`);
        assertSuccess(listRes);
        expect(listRes.data.data.length).toBe(1);
      },
    },

    // PPE-023: Restrict Store Keeper Access (5 tests)
    {
      id: "T1-PPE-023-01",
      featureId: "PPE-023",
      tier: 1,
      title: "Store Keeper sees only stock balances for assigned locations",
      fn: async (ctx) => {
        const keeperRes = await ctx.asStoreKeeper("cairo").get("/api/stock/balances");
        assertSuccess(keeperRes);
        // Cairo keeper is assigned to loc-1 and loc-2
        for (const item of keeperRes.data.data) {
          expect(item.locationId === "loc-cai-new" || item.locationId === "loc-cai-usd").toBe(true);
        }
      },
    },
    {
      id: "T1-PPE-023-02",
      featureId: "PPE-023",
      tier: 1,
      title: "Alexandria Store Keeper sees only Alexandria assigned locations",
      fn: async (ctx) => {
        const alexRes = await ctx.asStoreKeeper("alex").get("/api/stock/balances");
        assertSuccess(alexRes);
        for (const item of alexRes.data.data) {
          expect(item.locationId === "loc-cai-scr" || item.locationId === "loc-alx-new").toBe(true);
        }
      },
    },
    {
      id: "T1-PPE-023-03",
      featureId: "PPE-023",
      tier: 1,
      title: "Store Keeper query for unassigned location returns empty data",
      fn: async (ctx) => {
        // Cairo storekeeper requests loc-3 (Alexandria)
        const res = await ctx.asStoreKeeper("cairo").get("/api/stock/balances?locationId=loc-cai-scr");
        assertSuccess(res);
        expect(res.data.data.length).toBe(0);
      },
    },
    {
      id: "T1-PPE-023-04",
      featureId: "PPE-023",
      tier: 1,
      title: "Store Keeper stock adjustment listing is scoped to assigned locations",
      fn: async (ctx) => {
        const adjRes = await ctx.asStoreKeeper("cairo").get("/api/stock/adjustments");
        assertSuccess(adjRes);
        for (const adj of adjRes.data.data) {
          expect(adj.locationId === "loc-cai-new" || adj.locationId === "loc-cai-usd").toBe(true);
        }
      },
    },
    {
      id: "T1-PPE-023-05",
      featureId: "PPE-023",
      tier: 1,
      title: "Admin persona has global unscoped visibility across all locations",
      fn: async (ctx) => {
        const adminRes = await ctx.asAdmin().get("/api/stock/balances");
        assertSuccess(adminRes);
        const locationIds = new Set(adminRes.data.data.map((b: any) => b.locationId));
        expect(locationIds.size).toBeGreaterThan(1);
      },
    },
  ],
};
