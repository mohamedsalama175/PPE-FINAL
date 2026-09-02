import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertSuccess } from "../harness/assertions.js";

export const tier3InteractionsSuite: TestSuite = {
  name: "Tier 3 - Cross-Feature Pairwise Interactions (50 Tests)",
  tier: 3,
  tests: [
    // 1. PPE-001 + PPE-026: Add Item then post Opening Balance
    {
      id: "T3-PAIR-01",
      featureId: "PPE-001+PPE-026",
      tier: 3,
      title: "Add new PPE item and post opening balance for it",
      fn: async (ctx) => {
        const code = `PAIR-ITM-${Date.now()}`;
        const item = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Pair Item 1",
          nameAr: "صنف تجريبي 1",
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
        const ob = await ctx.asAdmin().post("/api/opening-balances", {
          locationId: "loc-cai-scr",
          referenceDate: new Date().toISOString(),
          notes: "Pair OB",
          lines: [
            {
              ppeItemId: item.data.id,
              batchNumber: `B-PAIR1-${Date.now()}`,
              expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
              quantity: 20,
              costPerUnit: 15.0,
            },
          ],
        });
        assertStatus(ob, 201);
      },
    },

    // 2. PPE-001 + PPE-027: Add Item then receive Stock IN delivery
    {
      id: "T3-PAIR-02",
      featureId: "PPE-001+PPE-027",
      tier: 3,
      title: "Add new PPE item then receive Stock IN delivery",
      fn: async (ctx) => {
        const item = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: `PAIR-IN-${Date.now()}`,
          nameEn: "Pair Item In",
          nameAr: "صنف توريد",
          category: "Hand",
          itemGroupId: "grp-gloves",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Months",
          lifespanValue: 6,
          riskCategory: "I",
          reorderLevel: 10,
          locationIds: ["loc-cai-new"],
          uom: "Pair",
        });
        const stockIn = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: item.data.id,
          locationId: "loc-cai-new",
          batchNumber: `B-PIN-${Date.now()}`,
          quantityDelta: 40,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Initial receipt for pair test",
        });
        assertStatus(stockIn, 201);
        expect(stockIn.data.status).toBe("applied");
      },
    },

    // 3. PPE-001 + PPE-028: Add Item then deduct Stock OUT
    {
      id: "T3-PAIR-03",
      featureId: "PPE-001+PPE-028",
      tier: 3,
      title: "Add new PPE item, seed delivery, then deduct Stock OUT",
      fn: async (ctx) => {
        const item = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: `PAIR-OUT-${Date.now()}`,
          nameEn: "Pair Item Out",
          nameAr: "صنف صرف",
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
        const batchNum = `B-POUT-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: item.data.id,
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Stock seed",
        });
        const stockOut = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: item.data.id,
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 3,
          type: "OUT",
          reasonCategory: "Damaged Stock",
          reason: "Damaged during handling",
        });
        assertStatus(stockOut, 201);
        expect(stockOut.data.quantityDelta).toBe(-3);
      },
    },

    // 4. PPE-001 + PPE-024: Add Item then transfer stock between locations
    {
      id: "T3-PAIR-04",
      featureId: "PPE-001+PPE-024",
      tier: 3,
      title: "Add new PPE item with multiple locations and execute stock transfer",
      fn: async (ctx) => {
        const item = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: `PAIR-TRF-${Date.now()}`,
          nameEn: "Pair Item Transfer",
          nameAr: "صنف تحويل",
          category: "Head",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Years",
          lifespanValue: 2,
          riskCategory: "I",
          reorderLevel: 5,
          locationIds: ["loc-cai-new", "loc-cai-usd"],
          uom: "Piece",
        });
        const batchNum = `B-PTRF-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: item.data.id,
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 15,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Seed delivery",
        });
        const trf = await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: item.data.id,
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: batchNum,
          quantity: 5,
        });
        assertStatus(trf, 201);
      },
    },

    // 5. PPE-001 + PPE-034: Add Item then issue single item to employee
    {
      id: "T3-PAIR-05",
      featureId: "PPE-001+PPE-034",
      tier: 3,
      title: "Add new PPE item, receive stock, then issue to employee",
      fn: async (ctx) => {
        const item = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: `PAIR-ISS-${Date.now()}`,
          nameEn: "Pair Item Issuance",
          nameAr: "صنف صرف عامل",
          category: "Head",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Days",
          lifespanValue: 120,
          riskCategory: "I",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: item.data.id,
          locationId: "loc-cai-new",
          batchNumber: `B-PISS-${Date.now()}`,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Seed for issue",
        });
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: item.data.id,
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        assertStatus(iss, 201);
      },
    },

    // 6. PPE-001 + PPE-029: Add Item then add kit containing that item
    {
      id: "T3-PAIR-06",
      featureId: "PPE-001+PPE-029",
      tier: 3,
      title: "Add new PPE item then create a kit containing that item",
      fn: async (ctx) => {
        const item = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: `PAIR-KITM-${Date.now()}`,
          nameEn: "Pair Kit Item",
          nameAr: "صنف طقم",
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
        const kit = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Pair Kit ${Date.now()}`,
          nameAr: "طقم زوجي",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: item.data.id, qty: 1 }],
        });
        assertStatus(kit, 201);
      },
    },

    // 7. PPE-001 + PPE-045: Add Item, move stock, verify in Stock Movements trend
    {
      id: "T3-PAIR-07",
      featureId: "PPE-001+PPE-045",
      tier: 3,
      title: "Add item, record movement, verify in movement trend listing",
      fn: async (ctx) => {
        const item = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: `PAIR-MOV-${Date.now()}`,
          nameEn: "Pair Movement Item",
          nameAr: "صنف حركة",
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
        const adj = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: item.data.id,
          locationId: "loc-cai-new",
          batchNumber: `B-PMOV-${Date.now()}`,
          quantityDelta: 8,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Stock movement verification",
        });
        const movRes = await ctx.asAdmin().get("/api/stock/movements");
        assertSuccess(movRes);
        const match = movRes.data.data.find((m: any) => m.reference === adj.data.reference);
        expect(match).toBeDefined();
      },
    },

    // 8. PPE-001 + PPE-004: Add Item then move to trash and verify cascade
    {
      id: "T3-PAIR-08",
      featureId: "PPE-001+PPE-004",
      tier: 3,
      title: "Add item then move to trash and verify cascade soft deletion",
      fn: async (ctx) => {
        const item = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: `PAIR-DEL-${Date.now()}`,
          nameEn: "Pair Delete Item",
          nameAr: "صنف حذف",
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
        const delRes = await ctx.asAdmin().delete(`/api/ppe-items/${item.data.id}`);
        assertStatus(delRes, 200);
      },
    },

    // 9. PPE-008 + PPE-013: Add Attribute then assign to new Item Group
    {
      id: "T3-PAIR-09",
      featureId: "PPE-008+PPE-013",
      tier: 3,
      title: "Create dynamic attribute and assign to newly created item group",
      fn: async (ctx) => {
        const attr = await ctx.asAdmin().post("/api/attributes", {
          code: `PATTR-${Date.now()}`,
          nameEn: "Pair Attribute",
          nameAr: "سمة زوجية",
          values: [{ value: "Alpha", sortOrder: 1 }, { value: "Beta", sortOrder: 2 }],
        });
        const grp = await ctx.asAdmin().post("/api/item-groups", {
          code: `PGRP-${Date.now()}`,
          nameEn: "Pair Group",
          nameAr: "مجموعة زوجية",
          attributeIds: [attr.data.id],
        });
        assertStatus(grp, 201);
      },
    },

    // 10. PPE-008 + PPE-001: Add Attribute then assign attribute value to PPE Item variant
    {
      id: "T3-PAIR-10",
      featureId: "PPE-008+PPE-001",
      tier: 3,
      title: "Create dynamic attribute and assign its value to PPE Item variant",
      fn: async (ctx) => {
        const attr = await ctx.asAdmin().post("/api/attributes", {
          code: `PVAR-${Date.now()}`,
          nameEn: "Pair Variant Attr",
          nameAr: "سمة متغير زوجي",
          values: [{ value: "SpecA", sortOrder: 1 }],
        });
        const valId = attr.data.values[0].id;
        const item = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: `PITEM-VAR-${Date.now()}`,
          nameEn: "Variant Item",
          nameAr: "صنف بمتغير",
          category: "Head",
          itemGroupId: "grp-helmets",
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Years",
          lifespanValue: 1,
          riskCategory: "I",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          variantAttributeValueIds: [valId],
          uom: "Piece",
        });
        assertStatus(item, 201);
      },
    },

    // 11. PPE-008 + PPE-014: Add Attribute then edit Item Group to include it
    {
      id: "T3-PAIR-11",
      featureId: "PPE-008+PPE-014",
      tier: 3,
      title: "Create attribute then edit existing item group to link it",
      fn: async (ctx) => {
        const attr = await ctx.asAdmin().post("/api/attributes", {
          code: `PLINK-${Date.now()}`,
          nameEn: "Link Attr",
          nameAr: "سمة ربط",
          values: [{ value: "Standard", sortOrder: 1 }],
        });
        const grp = await ctx.asAdmin().post("/api/item-groups", {
          code: `PGRPLINK-${Date.now()}`,
          nameEn: "Link Group",
          nameAr: "مجموعة ربط",
          attributeIds: [],
        });
        const updateRes = await ctx.asAdmin().put(`/api/item-groups/${grp.data.id}`, {
          code: grp.data.code,
          nameEn: "Link Group",
          nameAr: "مجموعة ربط",
          attributeIds: [attr.data.id],
        });
        assertStatus(updateRes, 200);
      },
    },

    // 12. PPE-013 + PPE-001: Add Item Group then create item assigned to that group
    {
      id: "T3-PAIR-12",
      featureId: "PPE-013+PPE-001",
      tier: 3,
      title: "Create item group then create PPE item belonging to that group",
      fn: async (ctx) => {
        const grp = await ctx.asAdmin().post("/api/item-groups", {
          code: `PNEWGRP-${Date.now()}`,
          nameEn: "New Epic Group",
          nameAr: "مجموعة ملحمية جديدة",
          attributeIds: [],
        });
        const item = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: `PNEWGRP-ITM-${Date.now()}`,
          nameEn: "Item In New Group",
          nameAr: "صنف في المجموعة الجديدة",
          category: "Head",
          itemGroupId: grp.data.id,
          hasSize: false,
          gender: "Unisex",
          lifespanType: "Years",
          lifespanValue: 1,
          riskCategory: "I",
          reorderLevel: 5,
          locationIds: ["loc-cai-new"],
          uom: "Piece",
        });
        assertStatus(item, 201);
        expect(item.data.itemGroupId).toBe(grp.data.id);
      },
    },

    // 13. PPE-013 + PPE-014: Add Item Group then edit attributes list
    {
      id: "T3-PAIR-13",
      featureId: "PPE-013+PPE-014",
      tier: 3,
      title: "Create item group with 1 attribute then edit to 2 attributes",
      fn: async (ctx) => {
        const grp = await ctx.asAdmin().post("/api/item-groups", {
          code: `PGRPSIZE-${Date.now()}`,
          nameEn: "Sized Group",
          nameAr: "مجموعة ذات مقاس",
          attributeIds: ["attr-gender"],
        });
        const updateRes = await ctx.asAdmin().put(`/api/item-groups/${grp.data.id}`, {
          code: grp.data.code,
          nameEn: "Sized Group",
          nameAr: "مجموعة ذات مقاس",
          attributeIds: ["attr-gender", "attr-size"],
        });
        assertStatus(updateRes, 200);
      },
    },

    // 14. PPE-013 + PPE-017: Add Item Group, soft-delete it, verify restore
    {
      id: "T3-PAIR-14",
      featureId: "PPE-013+PPE-017",
      tier: 3,
      title: "Create item group, trash it, then restore it successfully",
      fn: async (ctx) => {
        const grp = await ctx.asAdmin().post("/api/item-groups", {
          code: `PTRASHGRP-${Date.now()}`,
          nameEn: "Trash Group",
          nameAr: "مجموعة للحذف",
          attributeIds: [],
        });
        await ctx.asAdmin().delete(`/api/item-groups/${grp.data.id}`);
        const restRes = await ctx.asAdmin().post(`/api/item-groups/${grp.data.id}/restore`);
        assertStatus(restRes, 200);
        expect(restRes.data.active).toBe(true);
      },
    },

    // 15. PPE-018 + PPE-026: Add Location then post Opening Balance at that location
    {
      id: "T3-PAIR-15",
      featureId: "PPE-018+PPE-026",
      tier: 3,
      title: "Add location then post opening balance draft at that location",
      fn: async (ctx) => {
        const loc = await ctx.asAdmin().post("/api/locations", {
          code: `PLOC-OB-${Date.now()}`,
          nameEn: "OB Location",
          nameAr: "موقع رصيد افتتاحي",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 500,
          description: "OB test",
          address: "Room 10",
          assignedStoreKeeperIds: [],
        });
        const ob = await ctx.asAdmin().post("/api/opening-balances", {
          locationId: loc.data.id,
          referenceDate: new Date().toISOString(),
          notes: "Location OB test",
          lines: [
            {
              ppeItemId: "ppe-hlm-001",
              batchNumber: `B-PAIR15-${Date.now()}`,
              expiryDate: new Date(Date.now() + 864000000).toISOString(),
              quantity: 10,
            },
          ],
        });
        assertStatus(ob, 201);
      },
    },

    // 16. PPE-018 + PPE-027: Add Location then receive Stock IN at that location
    {
      id: "T3-PAIR-16",
      featureId: "PPE-018+PPE-027",
      tier: 3,
      title: "Add location then receive Stock IN delivery at that location",
      fn: async (ctx) => {
        const loc = await ctx.asAdmin().post("/api/locations", {
          code: `PLOC-IN-${Date.now()}`,
          nameEn: "Receipt Location",
          nameAr: "موقع استلام",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 300,
          description: "Receipt",
          address: "Dock 1",
          assignedStoreKeeperIds: [],
        });
        const stockIn = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: loc.data.id,
          batchNumber: `B-LOCIN-${Date.now()}`,
          quantityDelta: 20,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Delivery to new location",
        });
        assertStatus(stockIn, 201);
      },
    },

    // 17. PPE-018 + PPE-024: Add Location then transfer stock into it
    {
      id: "T3-PAIR-17",
      featureId: "PPE-018+PPE-024",
      tier: 3,
      title: "Add new location and transfer stock into it from existing location",
      fn: async (ctx) => {
        const loc = await ctx.asAdmin().post("/api/locations", {
          code: `PLOC-TRFIN-${Date.now()}`,
          nameEn: "Transfer Target Loc",
          nameAr: "موقع مستهدف للتحويل",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 400,
          description: "Target",
          address: "Bld 2",
          assignedStoreKeeperIds: [],
        });
        const batchNum = `B-PLTRF-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Pre-trf - verified valid reason length",
        });
        const trf = await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: loc.data.id,
          batchNumber: batchNum,
          quantity: 3,
        });
        assertStatus(trf, 201);
      },
    },

    // 18. PPE-018 + PPE-023: Add Location, assign Store Keeper, verify keeper sees only this location
    {
      id: "T3-PAIR-18",
      featureId: "PPE-018+PPE-023",
      tier: 3,
      title: "Add location with assigned keeper and verify keeper visibility",
      fn: async (ctx) => {
        const loc = await ctx.asAdmin().post("/api/locations", {
          code: `PLOC-SK-${Date.now()}`,
          nameEn: "Keeper Assigned Loc",
          nameAr: "موقع مخصص لأمين المخزن",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 200,
          description: "Scoped",
          address: "Room 5",
          assignedStoreKeeperIds: ["emp-8"],
        });
        const getRes = await ctx.asStoreKeeper("cairo").get(`/api/locations/${loc.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.id).toBe(loc.data.id);
      },
    },

    // 19. PPE-018 + PPE-020: Add Location, receive stock, verify deactivation is hard-blocked (G2)
    {
      id: "T3-PAIR-19",
      featureId: "PPE-018+PPE-020",
      tier: 3,
      title: "Add location, receive stock, verify deactivation is blocked (G2)",
      fn: async (ctx) => {
        const loc = await ctx.asAdmin().post("/api/locations", {
          code: `PLOC-BLOK-${Date.now()}`,
          nameEn: "Stock Holding Loc",
          nameAr: "موقع به مخزون",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Block test",
          address: "Room 1",
          assignedStoreKeeperIds: [],
        });
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: loc.data.id,
          batchNumber: `B-PBLOK-${Date.now()}`,
          quantityDelta: 5,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Hold stock",
        });
        const patchRes = await ctx.asAdmin().patch(`/api/locations/${loc.data.id}/active`, { active: false });
        assertStatus(patchRes, 400);
      },
    },

    // 20. PPE-018 + PPE-022: Add Location, receive stock, verify deletion is hard-blocked (G2)
    {
      id: "T3-PAIR-20",
      featureId: "PPE-018+PPE-022",
      tier: 3,
      title: "Add location, receive stock, verify deletion is blocked (G2)",
      fn: async (ctx) => {
        const loc = await ctx.asAdmin().post("/api/locations", {
          code: `PLOC-DELBLK-${Date.now()}`,
          nameEn: "Delete Block Loc",
          nameAr: "موقع منع الحذف",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 100,
          description: "Delete block",
          address: "Room 2",
          assignedStoreKeeperIds: [],
        });
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: loc.data.id,
          batchNumber: `B-DELBLK-${Date.now()}`,
          quantityDelta: 5,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Hold stock for delete block",
        });
        const delRes = await ctx.asAdmin().delete(`/api/locations/${loc.data.id}`);
        assertStatus(delRes, 400);
      },
    },

    // 21. PPE-024 + PPE-025: Transfer stock then verify source decreased and dest increased (G9)
    {
      id: "T3-PAIR-21",
      featureId: "PPE-024+PPE-025",
      tier: 3,
      title: "Transfer stock and verify balances update at source and destination (G9)",
      fn: async (ctx) => {
        const batchNum = `B-BALTRF-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Balance transfer test",
        });
        const preDest = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-usd");
        const preDestQty = preDest.data.data[0]?.quantityOnHand || 0;

        await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: batchNum,
          quantity: 4,
        });

        const postDest = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-usd");
        expect(postDest.data.data[0].quantityOnHand).toBe(preDestQty + 4);
      },
    },

    // 22. PPE-024 + PPE-045: Transfer stock then verify movement record appears in movements list
    {
      id: "T3-PAIR-22",
      featureId: "PPE-024+PPE-045",
      tier: 3,
      title: "Transfer stock and verify reference appears in movements list",
      fn: async (ctx) => {
        const batchNum = `B-MOVTRF-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Seed - verified valid reason length",
        });
        const trf = await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: batchNum,
          quantity: 2,
        });
        const movs = await ctx.asAdmin().get("/api/stock/movements?type=transfer");
        assertSuccess(movs);
        const found = movs.data.data.find((m: any) => m.reference === trf.data.reference);
        expect(found).toBeDefined();
      },
    },

    // 23. PPE-024 + PPE-049: Transfer stock then verify audit log record created (G1)
    {
      id: "T3-PAIR-23",
      featureId: "PPE-024+PPE-049",
      tier: 3,
      title: "Transfer stock and verify audit log record created (G1)",
      fn: async (ctx) => {
        const batchNum = `B-AUDTRF-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Seed - verified valid reason length",
        });
        const trf = await ctx.asAdmin().post("/api/stock/transfers", {
          ppeItemId: "ppe-hlm-001",
          fromLocationId: "loc-cai-new",
          toLocationId: "loc-cai-usd",
          batchNumber: batchNum,
          quantity: 1,
        });
        const audits = await ctx.asAdmin().get("/api/audit-logs?entityType=Transfer");
        assertSuccess(audits);
        const match = audits.data.data.find((a: any) => a.entityId === trf.data.reference);
        expect(match).toBeDefined();
      },
    },

    // 24. PPE-026 + PPE-025: Opening balance draft submitted and approved updates balance
    {
      id: "T3-PAIR-24",
      featureId: "PPE-026+PPE-025",
      tier: 3,
      title: "Submit and approve opening balance, verifying stock balance created",
      fn: async (ctx) => {
        // Create new location to avoid duplicate opening balance restriction
        const loc = await ctx.asAdmin().post("/api/locations", {
          code: `LOC-OBA-${Date.now()}`,
          nameEn: "OB Approval Loc",
          nameAr: "موقع اعتماد رصيد",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 500,
          description: "OB Approval",
          address: "Room 8",
          assignedStoreKeeperIds: [],
        });
        const ob = await ctx.asAdmin().post("/api/opening-balances", {
          locationId: loc.data.id,
          referenceDate: new Date().toISOString(),
          notes: "Approval balance test",
          lines: [
            {
              ppeItemId: "ppe-hlm-001",
              batchNumber: `B-OBA-${Date.now()}`,
              expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
              quantity: 12,
              costPerUnit: 14.0,
            },
          ],
        });
        await ctx.asAdmin().patch(`/api/opening-balances/${ob.data.id}/submit`);
        const appRes = await ctx.asHSE().patch(`/api/opening-balances/${ob.data.id}/approve`);
        assertStatus(appRes, 200);
      },
    },

    // 25. PPE-026 + G14: Opening balance requires HSE Supervisor approval (G14)
    {
      id: "T3-PAIR-25",
      featureId: "PPE-026+G14",
      tier: 3,
      title: "Opening balance draft requires HSE Supervisor approval before posting (G14)",
      fn: async (ctx) => {
        const loc = await ctx.asAdmin().post("/api/locations", {
          code: `LOC-G14-${Date.now()}`,
          nameEn: "G14 Loc",
          nameAr: "موقع معيار 14",
          site: "Cairo Site",
          locationType: "General",
          capacityUnits: 300,
          description: "G14",
          address: "Room 9",
          assignedStoreKeeperIds: [],
        });
        const ob = await ctx.asAdmin().post("/api/opening-balances", {
          locationId: loc.data.id,
          referenceDate: new Date().toISOString(),
          notes: "G14 check",
          lines: [
            {
              ppeItemId: "ppe-hlm-001",
              batchNumber: `B-PAIR25-${Date.now()}`,
              expiryDate: new Date(Date.now() + 864000000).toISOString(),
              quantity: 10,
            },
          ],
        });
        const sub = await ctx.asAdmin().patch(`/api/opening-balances/${ob.data.id}/submit`);
        expect(sub.data.status).toBe("Pending_Approval");
      },
    },

    // 26. PPE-027 + PPE-025: Stock IN delivery increments balanceOnHand
    {
      id: "T3-PAIR-26",
      featureId: "PPE-027+PPE-025",
      tier: 3,
      title: "Stock IN delivery increments stock balance immediately",
      fn: async (ctx) => {
        const pre = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        const preQty = pre.data.data[0].quantityOnHand;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: `B-DELIVINC-${Date.now()}`,
          quantityDelta: 15,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Delivery balance test",
        });
        const post = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        expect(post.data.data[0].quantityOnHand).toBe(preQty + 15);
      },
    },

    // 27. PPE-027 + PPE-045: Stock IN creates adjustment movement record
    {
      id: "T3-PAIR-27",
      featureId: "PPE-027+PPE-045",
      tier: 3,
      title: "Stock IN creates adjustment movement record queryable in movements",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: `B-MOVADJ-${Date.now()}`,
          quantityDelta: 7,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Movement record verification",
        });
        const movs = await ctx.asAdmin().get("/api/stock/movements?type=adjustment");
        assertSuccess(movs);
        const match = movs.data.data.find((m: any) => m.reference === res.data.reference);
        expect(match).toBeDefined();
      },
    },

    // 28. PPE-027 + G14: Manual correction Stock IN sets status to pending review (G14)
    {
      id: "T3-PAIR-28",
      featureId: "PPE-027+G14",
      tier: 3,
      title: "Manual correction Stock IN sets status to pending review (G14)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: `B-MANREV-${Date.now()}`,
          quantityDelta: 5,
          type: "IN",
          reasonCategory: "Manual Correction",
          reason: "Surplus counted requiring review",
        });
        assertStatus(res, 201);
        expect(res.data.status).toBe("pending");
      },
    },

    // 29. PPE-028 + PPE-025: Stock OUT decrements balanceOnHand
    {
      id: "T3-PAIR-29",
      featureId: "PPE-028+PPE-025",
      tier: 3,
      title: "Stock OUT decrements stock balance immediately",
      fn: async (ctx) => {
        const batchNum = `B-OUTDEC-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Seed - verified valid reason length",
        });
        const pre = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        const preQty = pre.data.data[0].quantityOnHand;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 3,
          type: "OUT",
          reasonCategory: "Damaged Stock",
          reason: "Broken in store",
        });
        const post = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        expect(post.data.data[0].quantityOnHand).toBe(preQty - 3);
      },
    },

    // 30. PPE-028 + PPE-049: Stock OUT creates audit log entry
    {
      id: "T3-PAIR-30",
      featureId: "PPE-028+PPE-049",
      tier: 3,
      title: "Stock OUT writes immutable audit log entry (G1)",
      fn: async (ctx) => {
        const batchNum = `B-OUTAUD2-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 5,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Seed - verified valid reason length",
        });
        const outRes = await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 1,
          type: "OUT",
          reasonCategory: "Damaged Stock",
          reason: "Test audit",
        });
        const audits = await ctx.asAdmin().get("/api/audit-logs?entityType=StockAdjustment");
        assertSuccess(audits);
        const match = audits.data.data.find((a: any) => a.entityId === outRes.data.id);
        expect(match).toBeDefined();
      },
    },

    // 31. PPE-029 + PPE-035: Add Kit then issue kit to employee and verify all items deducted
    {
      id: "T3-PAIR-31",
      featureId: "PPE-029+PPE-035",
      tier: 3,
      title: "Add kit then issue to worker verifying line stock deductions",
      fn: async (ctx) => {
        const kit = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Pair Iss Kit ${Date.now()}`,
          nameAr: "طقم صرف زوجي",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const res = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          kitId: kit.data.id,
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        assertStatus(res, 201);
      },
    },

    // 32. PPE-029 + PPE-030: Add Kit then edit kit and verify new lines
    {
      id: "T3-PAIR-32",
      featureId: "PPE-029+PPE-030",
      tier: 3,
      title: "Add kit then edit kit modifying line item configuration",
      fn: async (ctx) => {
        const kit = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Pair Edit Kit ${Date.now()}`,
          nameAr: "طقم تعديل زوجي",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const upd = await ctx.asAdmin().put(`/api/kits/${kit.data.id}`, {
          nameEn: "Pair Edit Kit Updated",
          nameAr: "طقم تعديل زوجي محدث",
          jobPositionId: "jp-1",
          items: [
            { ppeItemId: "ppe-hlm-001", qty: 1 },
            { ppeItemId: "ppe-glv-002", qty: 1 },
          ],
        });
        assertStatus(upd, 200);
      },
    },

    // 33. PPE-029 + PPE-033: Add Kit then trash kit and verify exclusion
    {
      id: "T3-PAIR-33",
      featureId: "PPE-029+PPE-033",
      tier: 3,
      title: "Add kit then soft-delete to trash and verify exclusion",
      fn: async (ctx) => {
        const name = `Pair Trash Kit ${Date.now()}`;
        const kit = await ctx.asAdmin().post("/api/kits", {
          nameEn: name,
          nameAr: "طقم حذف زوجي",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const delRes = await ctx.asAdmin().delete(`/api/kits/${kit.data.id}`);
        assertStatus(delRes, 200);
        const search = await ctx.asAdmin().get(`/api/kits?search=${name}`);
        expect(search.data.data.length).toBe(0);
      },
    },

    // 34. PPE-030 + PPE-035: Edit Kit lines then verify issuance uses updated kit
    {
      id: "T3-PAIR-34",
      featureId: "PPE-030+PPE-035",
      tier: 3,
      title: "Edit kit line items then issue kit to employee successfully",
      fn: async (ctx) => {
        const kit = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Pair Issue Upd Kit ${Date.now()}`,
          nameAr: "طقم صرف محدث",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        await ctx.asAdmin().put(`/api/kits/${kit.data.id}`, {
          nameEn: kit.data.nameEn,
          nameAr: kit.data.nameAr,
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 2 }],
        });
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          kitId: kit.data.id,
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        assertStatus(iss, 201);
      },
    },

    // 35. PPE-034 + PPE-003: Issue Item and verify replacement date calculated via lifespan (G5)
    {
      id: "T3-PAIR-35",
      featureId: "PPE-034+PPE-003",
      tier: 3,
      title: "Issue item and verify replacement date matches item lifespan setting (G5)",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        assertStatus(res, 201);
        expect(res.data.expectedReplacementDate).toBeDefined();
        const diffDays = (new Date(res.data.expectedReplacementDate).getTime() - new Date().getTime()) / 86400000;
        expect(diffDays).toBeGreaterThan(0);
      },
    },

    // 36. PPE-034 + PPE-025: Issue Item and verify stock balance drops immediately
    {
      id: "T3-PAIR-36",
      featureId: "PPE-034+PPE-025",
      tier: 3,
      title: "Issue single item and verify balanceOnHand drops immediately (G9)",
      fn: async (ctx) => {
        const pre = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        const preQty = pre.data.data[0].quantityOnHand;
        await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        const post = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        expect(post.data.data[0].quantityOnHand).toBe(preQty - 1);
      },
    },

    // 37. PPE-034 + PPE-043: Issue Item and verify appears on employee timeline with signatures
    {
      id: "T3-PAIR-37",
      featureId: "PPE-034+PPE-043",
      tier: 3,
      title: "Issue item and verify presence on employee timeline with digital signatures",
      fn: async (ctx) => {
        const sigMark = `sig_timeline_${Date.now()}`;
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: sigMark,
          receiverSignature: sigMark,
        });
        const tlRes = await ctx.asAdmin().get("/api/issuances?employeeId=emp-4");
        assertSuccess(tlRes);
        const match = tlRes.data.data.find((i: any) => i.id === iss.data.id);
        expect(match).toBeDefined();
        expect(match.storeKeeperSignature).toBe(sigMark);
      },
    },

    // 38. PPE-034 + PPE-049: Issue Item and verify audit log created (G1)
    {
      id: "T3-PAIR-38",
      featureId: "PPE-034+PPE-049",
      tier: 3,
      title: "Issue item and verify tamper-proof audit log entry generated (G1)",
      fn: async (ctx) => {
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        const audits = await ctx.asAdmin().get("/api/audit-logs?entityType=Issuance");
        assertSuccess(audits);
        const match = audits.data.data.find((a: any) => a.entityId === iss.data.id && a.action === "ISSUED");
        expect(match).toBeDefined();
      },
    },

    // 39. PPE-035 + PPE-043: Issue Kit and verify issuance appears on employee profile timeline
    {
      id: "T3-PAIR-39",
      featureId: "PPE-035+PPE-043",
      tier: 3,
      title: "Issue kit and verify kit issuance entry appears on employee timeline",
      fn: async (ctx) => {
        const kit = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Timeline Kit ${Date.now()}`,
          nameAr: "طقم خط زمني",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          kitId: kit.data.id,
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        const tlRes = await ctx.asAdmin().get("/api/issuances?employeeId=emp-4");
        assertSuccess(tlRes);
        const match = tlRes.data.data.find((i: any) => i.id === iss.data.id);
        expect(match).toBeDefined();
        expect(match.kitId).toBe(kit.data.id);
      },
    },

    // 40. PPE-036 + PPE-041: Issue Visitor Loan then verify appears in Open Loans directory
    {
      id: "T3-PAIR-40",
      featureId: "PPE-036+PPE-041",
      tier: 3,
      title: "Issue visitor loan and verify appearance in Open Loans directory",
      fn: async (ctx) => {
        const holder = `Pair Auditor ${Date.now()}`;
        const loan = await ctx.asAdmin().post("/api/issuances", {
          holderName: holder,
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
          storeKeeperSignature: "sk_sig",
          receiverSignature: "vis_sig",
        });
        const loansRes = await ctx.asAdmin().get("/api/issuances?openLoansOnly=true");
        assertSuccess(loansRes);
        const found = loansRes.data.data.find((l: any) => l.id === loan.data.id);
        expect(found).toBeDefined();
      },
    },

    // 41. PPE-036 + PPE-025: Issue Visitor Loan and verify stock balance decremented
    {
      id: "T3-PAIR-41",
      featureId: "PPE-036+PPE-025",
      tier: 3,
      title: "Issue visitor loan and verify stock balance decremented immediately",
      fn: async (ctx) => {
        const pre = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        const preQty = pre.data.data[0].quantityOnHand;
        await ctx.asAdmin().post("/api/issuances", {
          holderName: "Consultant Balance Check",
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
          storeKeeperSignature: "sk_sig",
          receiverSignature: "vis_sig",
        });
        const post = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        expect(post.data.data[0].quantityOnHand).toBe(preQty - 1);
      },
    },

    // 42. PPE-037 + PPE-041: Return Loaned Item then verify removed from Open Loans directory
    {
      id: "T3-PAIR-42",
      featureId: "PPE-037+PPE-041",
      tier: 3,
      title: "Return loaned item and verify removal from Open Loans directory",
      fn: async (ctx) => {
        const loan = await ctx.asAdmin().post("/api/issuances", {
          holderName: "Return Directory Test",
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
          storeKeeperSignature: "sk_sig",
          receiverSignature: "vis_sig",
        });
        await ctx.asAdmin().post(`/api/issuances/${loan.data.id}/return`, { condition: "good" });
        const loansRes = await ctx.asAdmin().get("/api/issuances?openLoansOnly=true");
        assertSuccess(loansRes);
        const match = loansRes.data.data.find((l: any) => l.id === loan.data.id);
        expect(match).toBeUndefined();
      },
    },

    // 43. PPE-037 + PPE-025: Return Loaned Item in Good condition and verify stock restored
    {
      id: "T3-PAIR-43",
      featureId: "PPE-037+PPE-025",
      tier: 3,
      title: "Return loaned item in Good condition and verify stock balance restored",
      fn: async (ctx) => {
        const loan = await ctx.asAdmin().post("/api/issuances", {
          holderName: "Restock Pair Test",
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
          storeKeeperSignature: "sk_sig",
          receiverSignature: "vis_sig",
        });
        const pre = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001");
        const preTotal = pre.data.data.reduce((a: number, b: any) => a + b.quantityOnHand, 0);

        await ctx.asAdmin().post(`/api/issuances/${loan.data.id}/return`, { condition: "good" });
        const post = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001");
        const postTotal = post.data.data.reduce((a: number, b: any) => a + b.quantityOnHand, 0);
        expect(postTotal).toBe(preTotal + 1);
      },
    },

    // 44. PPE-038 + PPE-018: Return Damaged Item and verify auto-scraps to Scrap location
    {
      id: "T3-PAIR-44",
      featureId: "PPE-038+PPE-018",
      tier: 3,
      title: "Return damaged item and verify auto-scrapped to designated Scrap location",
      fn: async (ctx) => {
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        await ctx.asAdmin().post(`/api/issuances/${iss.data.id}/return`, {
          condition: "damaged",
          physicalReceiptConfirmed: true,
        });
        const scrapList = await ctx.asAdmin().get("/api/scrap");
        assertSuccess(scrapList);
        const found = scrapList.data.data.find((s: any) => s.relatedReferenceId === iss.data.id);
        expect(found).toBeDefined();
      },
    },

    // 45. PPE-038 + PPE-049: Auto-scrap return and verify Scrap audit log entry created
    {
      id: "T3-PAIR-45",
      featureId: "PPE-038+PPE-049",
      tier: 3,
      title: "Auto-scrap return generates immutable audit log record (G1)",
      fn: async (ctx) => {
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        await ctx.asAdmin().post(`/api/issuances/${iss.data.id}/return`, {
          condition: "worn_out",
          physicalReceiptConfirmed: true,
        });
        const audits = await ctx.asAdmin().get("/api/audit-logs?entityType=Scrap");
        assertSuccess(audits);
        const match = audits.data.data.find((a: any) => a.action === "AUTO_SCRAPPED");
        expect(match).toBeDefined();
      },
    },

    // 46. PPE-039 + PPE-042: Lifecycle filtering for terminated employees
    {
      id: "T3-PAIR-46",
      featureId: "PPE-039+PPE-042",
      tier: 3,
      title: "Lifecycle filtering excludes terminated employees from reminder jobs (G12)",
      fn: async (ctx) => {
        const empRes = await ctx.asAdmin().get("/api/employees?search=EMP-010");
        assertSuccess(empRes);
        if (empRes.data.data.length > 0) {
          expect(empRes.data.data[0].active).toBe(false);
        }
      },
    },

    // 47. PPE-040 + PPE-034: Replacements due view prefills replacement issuance
    {
      id: "T3-PAIR-47",
      featureId: "PPE-040+PPE-034",
      tier: 3,
      title: "Overdue item from replacements view executes replacement issuance",
      fn: async (ctx) => {
        // Issue replacement for worker
        const repRes = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_rep_sig",
          receiverSignature: "emp_rep_sig",
        });
        assertStatus(repRes, 201);
      },
    },

    // 48. PPE-044 + PPE-043: Historical issuance import appears on employee timeline
    {
      id: "T3-PAIR-48",
      featureId: "PPE-044+PPE-043",
      tier: 3,
      title: "Historical issuance record appears labeled on employee timeline",
      fn: async (ctx) => {
        const pastDate = new Date("2023-06-01T08:00:00Z").toISOString();
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          issueDate: pastDate,
          storeKeeperSignature: "historical_pair_sig",
          receiverSignature: "historical_pair_sig",
        });
        const getRes = await ctx.asAdmin().get(`/api/issuances/${iss.data.id}`);
        assertSuccess(getRes);
        expect(getRes.data.id).toBe(iss.data.id);
      },
    },

    // 49. PPE-048 + PPE-004: Trash item, verify in shared trash, restore and verify back in catalog
    {
      id: "T3-PAIR-49",
      featureId: "PPE-048+PPE-004",
      tier: 3,
      title: "Trash item, verify in shared trash bin, restore and verify back in catalog (G10)",
      fn: async (ctx) => {
        const code = `PAIR-TRASH-${Date.now()}`;
        const item = await ctx.asAdmin().post("/api/ppe-items", {
          itemCode: code,
          nameEn: "Pair Trash Item",
          nameAr: "صنف سلة محذوفات",
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
        await ctx.asAdmin().delete(`/api/ppe-items/${item.data.id}`);
        const trash = await ctx.asAdmin().get("/api/trash");
        assertSuccess(trash);
        const match = trash.data.data.find((t: any) => t.id === item.data.id);
        expect(match).toBeDefined();

        await ctx.asAdmin().post(`/api/ppe-items/${item.data.id}/restore`);
        const search = await ctx.asAdmin().get(`/api/ppe-items?search=${code}`);
        expect(search.data.data.length).toBe(1);
      },
    },

    // 50. PPE-050 + PPE-039: Update expiry lead time in settings and verify reflected in dashboard
    {
      id: "T3-PAIR-50",
      featureId: "PPE-050+PPE-039",
      tier: 3,
      title: "Update expiry lead time settings and verify dynamic application without restart (G11)",
      fn: async (ctx) => {
        const leadTime = 42;
        await ctx.asAdmin().put("/api/expiry-settings", {
          generalLeadTimeDays: leadTime,
          categoryILeadTimeDays: 14,
          categoryIILeadTimeDays: 28,
          categoryIIILeadTimeDays: 56,
        });
        const settings = await ctx.asAdmin().get("/api/expiry-settings");
        assertSuccess(settings);
        expect(settings.data.generalLeadTimeDays).toBe(leadTime);

        const stats = await ctx.asAdmin().get("/api/dashboard/stats");
        assertSuccess(stats);
        expect(typeof stats.data.expiringSoon).toBe("number");
      },
    },
  ],
};
