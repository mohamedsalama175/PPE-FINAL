import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertError } from "../harness/assertions.js";

export const epic04BoundariesSuite: TestSuite = {
  name: "Tier 2 - Epic 4: Locations Boundaries & Error Handling (PPE-018 to PPE-023)",
  tier: 2,
  tests: [
    // PPE-018 Boundaries (5 tests)
    {
      id: "T2-PPE-018-01",
      featureId: "PPE-018",
      tier: 2,
      title: "Block duplicate location code creation",
      fn: async (ctx) => {
        const code = `DUP-LOC-${Date.now()}`;
        await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Original Location",
          nameAr: "موقع أصلي",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Original",
          address: "HQ",
          assignedStoreKeeperIds: [],
        });
        const dupRes = await ctx.asAdmin().post("/api/locations", {
          code,
          nameEn: "Duplicate Location",
          nameAr: "موقع مكرر",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Duplicate",
          address: "HQ",
          assignedStoreKeeperIds: [],
        });
        assertError(dupRes);
      },
    },
    {
      id: "T2-PPE-018-02",
      featureId: "PPE-018",
      tier: 2,
      title: "Reject location creation with empty code (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/locations", {
          code: "",
          nameEn: "Empty Code Loc",
          nameAr: "موقع بكود فارغ",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "Empty",
          address: "HQ",
          assignedStoreKeeperIds: [],
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-018-03",
      featureId: "PPE-018",
      tier: 2,
      title: "Block Worker persona from creating location (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().post("/api/locations", {
          code: `WRK-LOC-${Date.now()}`,
          nameEn: "Worker Loc",
          nameAr: "موقع العامل",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "Worker",
          address: "HQ",
          assignedStoreKeeperIds: [],
        });
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-018-04",
      featureId: "PPE-018",
      tier: 2,
      title: "Reject location creation with missing site string (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/locations", {
          code: `NOSITE-${Date.now()}`,
          nameEn: "No Site Loc",
          nameAr: "موقع بلا موقع جغرافي",
          site: "",
          locationType: "General",
          capacityUnits: 50,
          description: "No site",
          address: "HQ",
          assignedStoreKeeperIds: [],
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-018-05",
      featureId: "PPE-018",
      tier: 2,
      title: "Reject unauthenticated location creation (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().post("/api/locations", {
          code: `UNAUTH-LOC-${Date.now()}`,
          nameEn: "Unauth Loc",
          nameAr: "غير مصرح",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "Unauth",
          address: "HQ",
          assignedStoreKeeperIds: [],
        });
        assertStatus(res, 401);
      },
    },

    // PPE-019 Boundaries (5 tests)
    {
      id: "T2-PPE-019-01",
      featureId: "PPE-019",
      tier: 2,
      title: "Return 404 when updating non-existent location ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().put("/api/locations/non-existent-loc-id-9999", {
          code: "FAKE",
          nameEn: "Fake",
          nameAr: "وهمي",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Fake",
          address: "Fake",
          assignedStoreKeeperIds: [],
        });
        assertError(res);
      },
    },
    {
      id: "T2-PPE-019-02",
      featureId: "PPE-019",
      tier: 2,
      title: "Block Worker persona from updating location (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().put("/api/locations/loc-cai-new", {
          code: "HQ-WH-01",
          nameEn: "Worker Loc",
          nameAr: "موقع العامل",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Worker",
          address: "HQ",
          assignedStoreKeeperIds: [],
        });
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-019-03",
      featureId: "PPE-019",
      tier: 2,
      title: "Reject location update with empty nameEn string (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().put("/api/locations/loc-cai-new", {
          code: "HQ-WH-01",
          nameEn: "",
          nameAr: "مستودع رئيسي",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Desc",
          address: "HQ",
          assignedStoreKeeperIds: [],
        });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-019-04",
      featureId: "PPE-019",
      tier: 2,
      title: "Reject duplicate location code collision during edit",
      fn: async (ctx) => {
        const code1 = `LOC-C1-${Date.now()}`;
        const code2 = `LOC-C2-${Date.now()}`;
        const l1 = await ctx.asAdmin().post("/api/locations", {
          code: code1,
          nameEn: "Loc 1",
          nameAr: "موقع 1",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "1",
          address: "1",
          assignedStoreKeeperIds: [],
        });
        await ctx.asAdmin().post("/api/locations", {
          code: code2,
          nameEn: "Loc 2",
          nameAr: "موقع 2",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "2",
          address: "2",
          assignedStoreKeeperIds: [],
        });
        const collRes = await ctx.asAdmin().put(`/api/locations/${l1.data.id}`, {
          code: code2,
          nameEn: "Loc 1 Collision",
          nameAr: "موقع 1 تصادم",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 50,
          description: "1",
          address: "1",
          assignedStoreKeeperIds: [],
        });
        assertError(collRes);
      },
    },
    {
      id: "T2-PPE-019-05",
      featureId: "PPE-019",
      tier: 2,
      title: "Reject unauthenticated location update (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().put("/api/locations/loc-cai-new", {
          code: "HQ-WH-01",
          nameEn: "Unauth",
          nameAr: "غير مصرح",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Unauth",
          address: "HQ",
          assignedStoreKeeperIds: [],
        });
        assertStatus(res, 401);
      },
    },

    // PPE-020 Boundaries (5 tests)
    {
      id: "T2-PPE-020-01",
      featureId: "PPE-020",
      tier: 2,
      title: "Hard block deactivating location that currently holds stock on hand (400)",
      fn: async (ctx) => {
        // loc-1 holds stock on hand from previous tests
        const res = await ctx.asAdmin().patch("/api/locations/loc-cai-new/active", { active: false });
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-020-02",
      featureId: "PPE-020",
      tier: 2,
      title: "Search locations with emoji and unicode symbols without crashing",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations?search=🏢🛡️📍");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-020-03",
      featureId: "PPE-020",
      tier: 2,
      title: "Allow Worker persona read-only view of locations list (200)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().get("/api/locations");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-020-04",
      featureId: "PPE-020",
      tier: 2,
      title: "Reject unauthenticated locations query (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().get("/api/locations");
        assertStatus(res, 401);
      },
    },
    {
      id: "T2-PPE-020-05",
      featureId: "PPE-020",
      tier: 2,
      title: "Reject patch active status with invalid boolean (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().patch("/api/locations/loc-cai-new/active", { active: "inactive" });
        assertStatus(res, 400);
      },
    },

    // PPE-021 Boundaries (5 tests)
    {
      id: "T2-PPE-021-01",
      featureId: "PPE-021",
      tier: 2,
      title: "Return 404 for non-existent location ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations/non-existent-location-9999");
        assertStatus(res, 404);
      },
    },
    {
      id: "T2-PPE-021-02",
      featureId: "PPE-021",
      tier: 2,
      title: "Return 404 for malformed location ID string",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/locations/!!!bad_location_id###");
        assertStatus(res, 404);
      },
    },
    {
      id: "T2-PPE-021-03",
      featureId: "PPE-021",
      tier: 2,
      title: "Allow Worker persona read-only view of location details (200)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().get("/api/locations/loc-cai-new");
        assertStatus(res, 200);
      },
    },
    {
      id: "T2-PPE-021-04",
      featureId: "PPE-021",
      tier: 2,
      title: "Reject unauthenticated location details query (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().get("/api/locations/loc-cai-new");
        assertStatus(res, 401);
      },
    },
    {
      id: "T2-PPE-021-05",
      featureId: "PPE-021",
      tier: 2,
      title: "Allow Store Keeper persona read-only view of location details",
      fn: async (ctx) => {
        const res = await ctx.asStoreKeeper("cairo").get("/api/locations/loc-cai-new");
        assertStatus(res, 200);
      },
    },

    // PPE-022 Boundaries (5 tests)
    {
      id: "T2-PPE-022-01",
      featureId: "PPE-022",
      tier: 2,
      title: "Hard block deleting location that currently holds stock on hand (400)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().delete("/api/locations/loc-cai-new");
        assertStatus(res, 400);
      },
    },
    {
      id: "T2-PPE-022-02",
      featureId: "PPE-022",
      tier: 2,
      title: "Return error when trashing non-existent location ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().delete("/api/locations/fake-non-existent-location");
        assertError(res);
      },
    },
    {
      id: "T2-PPE-022-03",
      featureId: "PPE-022",
      tier: 2,
      title: "Block Worker persona from deleting location (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().delete("/api/locations/loc-cai-new");
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-022-04",
      featureId: "PPE-022",
      tier: 2,
      title: "Block Worker persona from restoring location (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().post("/api/locations/loc-cai-new/restore");
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-022-05",
      featureId: "PPE-022",
      tier: 2,
      title: "Reject unauthenticated location delete request (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().delete("/api/locations/loc-cai-new");
        assertStatus(res, 401);
      },
    },

    // PPE-023 Boundaries (5 tests)
    {
      id: "T2-PPE-023-01",
      featureId: "PPE-023",
      tier: 2,
      title: "Store Keeper cannot see inventory at unassigned location (empty returned)",
      fn: async (ctx) => {
        const res = await ctx.asStoreKeeper("cairo").get("/api/stock/balances?locationId=loc-cai-scr");
        assertStatus(res, 200);
        expect(res.data.data.length).toBe(0);
      },
    },
    {
      id: "T2-PPE-023-02",
      featureId: "PPE-023",
      tier: 2,
      title: "Store Keeper cannot see adjustments at unassigned location",
      fn: async (ctx) => {
        const res = await ctx.asStoreKeeper("cairo").get("/api/stock/adjustments?locationId=loc-cai-scr");
        assertStatus(res, 200);
        expect(res.data.data.length).toBe(0);
      },
    },
    {
      id: "T2-PPE-023-03",
      featureId: "PPE-023",
      tier: 2,
      title: "Store Keeper cannot see issuances at unassigned location",
      fn: async (ctx) => {
        const res = await ctx.asStoreKeeper("cairo").get("/api/issuances");
        assertStatus(res, 200);
        for (const iss of res.data.data) {
          expect(iss.locationId === "loc-cai-new" || iss.locationId === "loc-cai-usd").toBe(true);
        }
      },
    },
    {
      id: "T2-PPE-023-04",
      featureId: "PPE-023",
      tier: 2,
      title: "Block Worker persona from accessing Store Keeper scoped mutations (403)",
      fn: async (ctx) => {
        const res = await ctx.asWorker().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: "B-TEST",
          quantityDelta: 5,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Unauthorized worker adjustment",
        });
        assertStatus(res, 403);
      },
    },
    {
      id: "T2-PPE-023-05",
      featureId: "PPE-023",
      tier: 2,
      title: "Reject unauthenticated access to scoped stock balances endpoint (401)",
      fn: async (ctx) => {
        const res = await ctx.asUnauthenticated().get("/api/stock/balances");
        assertStatus(res, 401);
      },
    },
  ],
};
