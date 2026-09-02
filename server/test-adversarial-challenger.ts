import { createApp } from "./src/app.js";
import { prisma } from "./src/lib/prisma.js";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ STRESS-TEST ASSERTION FAILED: ${msg}`);
    throw new Error(`Stress-test assertion failed: ${msg}`);
  }
}

const app = createApp();
const server = app.listen(0, async () => {
  const addr: any = server.address();
  const base = `http://localhost:${addr.port}`;
  console.log(`Starting adversarial challenger stress test runner on ${base}`);

  async function req(method: string, path: string, body?: any, token?: string) {
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  }

  try {
    // ====================================================
    // 0. AUTHENTICATION
    // ====================================================
    const loginAdmin = await req("POST", "/api/auth/login", { employeeCode: "EMP-001", password: "password123" });
    assert(loginAdmin.status === 200 && !!loginAdmin.json.token, "Admin login must succeed");
    const adminToken = loginAdmin.json.token;

    const loginHse = await req("POST", "/api/auth/login", { employeeCode: "EMP-002", password: "password123" });
    assert(loginHse.status === 200 && !!loginHse.json.token, "HSE Supervisor login must succeed");
    const hseToken = loginHse.json.token;

    const loginKeeper = await req("POST", "/api/auth/login", { employeeCode: "EMP-008", password: "password123" });
    assert(loginKeeper.status === 200 && !!loginKeeper.json.token, "Store Keeper login must succeed");
    const keeperToken = loginKeeper.json.token;

    const loginEmp = await req("POST", "/api/auth/login", { employeeCode: "EMP-004", password: "password123" });
    assert(loginEmp.status === 200 && !!loginEmp.json.token, "Employee login must succeed");
    const empToken = loginEmp.json.token;

    console.log("✔ Phase 0: Authentication established for all challenge roles");

    // ====================================================
    // 1. ZOD SCHEMA MASTER DATA INPUT VALIDATION (PPE-001, PPE-003, PPE-008, PPE-013, PPE-018)
    // ====================================================
    console.log("Testing Zod schema boundaries and input validation...");

    // 1.1 Duplicate item code: HLM-001 already exists
    const dupItem = await req("POST", "/api/ppe-items", {
      itemCode: "HLM-001",
      nameEn: "Duplicate Helmet",
      nameAr: "خوذة مكررة",
      category: "Head",
      itemGroupId: "grp-helmets",
      gender: "Unisex",
      lifespanType: "Years",
      lifespanValue: 2,
      reorderLevel: 10,
      locationIds: ["loc-cai-new"],
      uom: "Piece",
      riskCategory: "II"
    }, adminToken);
    assert(dupItem.status === 409 || dupItem.status === 400, `Duplicate itemCode must be rejected with 409 or 400 (got ${dupItem.status})`);
    console.log("✔ 1.1 Duplicate item code rejected (409/400)");

    // 1.2 Duplicate attribute code: SIZE already exists
    const dupAttr = await req("POST", "/api/attributes", {
      code: "SIZE",
      nameEn: "Duplicate Size",
      nameAr: "مقاس مكرر",
      values: []
    }, adminToken);
    assert(dupAttr.status === 409 || dupAttr.status === 400, `Duplicate attribute code must be rejected with 409/400 (got ${dupAttr.status})`);
    console.log("✔ 1.2 Duplicate attribute code rejected (409/400)");

    // 1.3 Duplicate location code: LOC-CAI-NEW already exists
    const dupLoc = await req("POST", "/api/locations", {
      code: "LOC-CAI-NEW",
      nameEn: "Duplicate Cairo",
      nameAr: "موقع مكرر",
      site: "Cairo Site",
      locationType: "Central Warehouse",
      capacityUnits: 100
    }, adminToken);
    assert(dupLoc.status === 409 || dupLoc.status === 400, `Duplicate location code must be rejected with 409/400 (got ${dupLoc.status})`);
    console.log("✔ 1.3 Duplicate location code rejected (409/400)");

    // 1.4 Duplicate item group code: HELMETS already exists
    const dupGrp = await req("POST", "/api/item-groups", {
      code: "HELMETS",
      nameEn: "Duplicate Group",
      nameAr: "مجموعة مكررة"
    }, adminToken);
    assert(dupGrp.status === 409 || dupGrp.status === 400, `Duplicate itemGroup code must be rejected with 409/400 (got ${dupGrp.status})`);
    console.log("✔ 1.4 Duplicate item group code rejected (409/400)");

    // 1.5 Missing lifespan value
    const missingLifespanVal = await req("POST", "/api/ppe-items", {
      itemCode: "TST-001",
      nameEn: "Test PPE",
      nameAr: "عنصر تجريبي",
      category: "Head",
      itemGroupId: "grp-helmets",
      gender: "Unisex",
      lifespanType: "Years",
      // lifespanValue missing!
      reorderLevel: 10,
      locationIds: ["loc-cai-new"],
      uom: "Piece",
      riskCategory: "II"
    }, adminToken);
    assert(missingLifespanVal.status === 400, `Missing lifespanValue must return 400 (got ${missingLifespanVal.status})`);
    console.log("✔ 1.5 Missing lifespan value rejected (400)");

    // 1.6 Missing lifespan unit
    const missingLifespanUnit = await req("POST", "/api/ppe-items", {
      itemCode: "TST-002",
      nameEn: "Test PPE 2",
      nameAr: "عنصر تجريبي 2",
      category: "Head",
      itemGroupId: "grp-helmets",
      gender: "Unisex",
      // lifespanType missing!
      lifespanValue: 12,
      reorderLevel: 10,
      locationIds: ["loc-cai-new"],
      uom: "Piece",
      riskCategory: "II"
    }, adminToken);
    assert(missingLifespanUnit.status === 400, `Missing lifespanType must return 400 (got ${missingLifespanUnit.status})`);
    console.log("✔ 1.6 Missing lifespan unit rejected (400)");

    // 1.7 Negative lifespan value
    const negLifespan = await req("POST", "/api/ppe-items", {
      itemCode: "TST-003",
      nameEn: "Test PPE Negative Lifespan",
      nameAr: "عنصر تجريبي",
      category: "Head",
      itemGroupId: "grp-helmets",
      gender: "Unisex",
      lifespanType: "Months",
      lifespanValue: -5,
      reorderLevel: 10,
      locationIds: ["loc-cai-new"],
      uom: "Piece",
      riskCategory: "II"
    }, adminToken);
    assert(negLifespan.status === 400, `Negative lifespanValue must return 400 (got ${negLifespan.status})`);
    console.log("✔ 1.7 Negative lifespan value rejected (400)");

    // 1.8 Zero lifespan value
    const zeroLifespan = await req("POST", "/api/ppe-items", {
      itemCode: "TST-004",
      nameEn: "Test PPE Zero Lifespan",
      nameAr: "عنصر تجريبي",
      category: "Head",
      itemGroupId: "grp-helmets",
      gender: "Unisex",
      lifespanType: "Months",
      lifespanValue: 0,
      reorderLevel: 10,
      locationIds: ["loc-cai-new"],
      uom: "Piece",
      riskCategory: "II"
    }, adminToken);
    assert(zeroLifespan.status === 400, `Zero lifespanValue must return 400 (got ${zeroLifespan.status})`);
    console.log("✔ 1.8 Zero lifespan value rejected (400)");

    // 1.9 Negative reorder level
    const negReorder = await req("POST", "/api/ppe-items", {
      itemCode: "TST-005",
      nameEn: "Test PPE Negative Reorder",
      nameAr: "عنصر تجريبي",
      category: "Head",
      itemGroupId: "grp-helmets",
      gender: "Unisex",
      lifespanType: "Months",
      lifespanValue: 6,
      reorderLevel: -10,
      locationIds: ["loc-cai-new"],
      uom: "Piece",
      riskCategory: "II"
    }, adminToken);
    assert(negReorder.status === 400, `Negative reorderLevel must return 400 (got ${negReorder.status})`);
    console.log("✔ 1.9 Negative reorder level rejected (400)");

    // 1.10 Empty locationIds array
    const emptyLocations = await req("POST", "/api/ppe-items", {
      itemCode: "TST-006",
      nameEn: "Test PPE No Locations",
      nameAr: "عنصر تجريبي",
      category: "Head",
      itemGroupId: "grp-helmets",
      gender: "Unisex",
      lifespanType: "Months",
      lifespanValue: 6,
      reorderLevel: 10,
      locationIds: [],
      uom: "Piece",
      riskCategory: "II"
    }, adminToken);
    assert(emptyLocations.status === 400, `Empty locationIds array must return 400 (got ${emptyLocations.status})`);
    console.log("✔ 1.10 Empty locationIds array rejected (400)");

    // 1.11 Invalid lifespan unit / enum
    const invalidUnit = await req("POST", "/api/ppe-items", {
      itemCode: "TST-007",
      nameEn: "Test PPE Invalid Unit",
      nameAr: "عنصر تجريبي",
      category: "Head",
      itemGroupId: "grp-helmets",
      gender: "Unisex",
      lifespanType: "Decades",
      lifespanValue: 1,
      reorderLevel: 10,
      locationIds: ["loc-cai-new"],
      uom: "Piece",
      riskCategory: "II"
    }, adminToken);
    assert(invalidUnit.status === 400, `Invalid lifespanType enum must return 400 (got ${invalidUnit.status})`);
    console.log("✔ 1.11 Invalid lifespanType enum rejected (400)");

    // 1.12 Missing English Name
    const missingEn = await req("POST", "/api/ppe-items", {
      itemCode: "TST-008",
      nameAr: "خوذة بدون اسم إنجليزي",
      category: "Head",
      itemGroupId: "grp-helmets",
      gender: "Unisex",
      lifespanType: "Years",
      lifespanValue: 1,
      reorderLevel: 10,
      locationIds: ["loc-cai-new"],
      uom: "Piece",
      riskCategory: "II"
    }, adminToken);
    assert(missingEn.status === 400, `Missing nameEn must return 400 (got ${missingEn.status})`);
    console.log("✔ 1.12 Missing English name rejected (400)");

    // 1.13 Missing Arabic Name
    const missingAr = await req("POST", "/api/ppe-items", {
      itemCode: "TST-009",
      nameEn: "Helmet Without Arabic Name",
      category: "Head",
      itemGroupId: "grp-helmets",
      gender: "Unisex",
      lifespanType: "Years",
      lifespanValue: 1,
      reorderLevel: 10,
      locationIds: ["loc-cai-new"],
      uom: "Piece",
      riskCategory: "II"
    }, adminToken);
    assert(missingAr.status === 400, `Missing nameAr must return 400 (got ${missingAr.status})`);
    console.log("✔ 1.13 Missing Arabic name rejected (400)");

    // 1.14 Negative location capacity
    const negCap = await req("POST", "/api/locations", {
      code: "LOC-NEG-CAP",
      nameEn: "Negative Capacity Location",
      nameAr: "مستودع سعة سالبة",
      site: "Alexandria Site",
      locationType: "Central Warehouse",
      capacityUnits: -25
    }, adminToken);
    assert(negCap.status === 400, `Negative capacityUnits must return 400 (got ${negCap.status})`);
    console.log("✔ 1.14 Negative location capacity rejected (400)");

    // 1.15 Kit with empty items
    const emptyKit = await req("POST", "/api/kits", {
      nameEn: "Empty Items Kit",
      nameAr: "طقم بدون عناصر",
      jobPositionId: "jp-1",
      items: []
    }, adminToken);
    assert(emptyKit.status === 400, `Kit with empty items must return 400 (got ${emptyKit.status})`);
    console.log("✔ 1.15 Kit with empty items array rejected (400)");

    // 1.16 Kit item with negative quantity
    const negKitItem = await req("POST", "/api/kits", {
      nameEn: "Negative Qty Kit",
      nameAr: "طقم كمية سالبة",
      jobPositionId: "jp-1",
      items: [{ ppeItemId: "ppe-hlm-001", qty: -2 }]
    }, adminToken);
    assert(negKitItem.status === 400, `Kit item with negative qty must return 400 (got ${negKitItem.status})`);
    console.log("✔ 1.16 Kit item with negative qty rejected (400)");

    // ====================================================
    // 2. BILINGUAL SUPPORT & RTL CHARACTER SET (Rule G13)
    // ====================================================
    console.log("Testing bilingual persistence, retrieval, and search...");

    const testItemPayload = {
      itemCode: "VSR-ADV-001",
      nameEn: "Impact Resistant Polycarbonate Face Shield",
      nameAr: "درع واقٍ للوجه من البولي كربونات مقاوم للصدمات العالية",
      descriptionEn: "Meets EN166 high impact protection standards with anti-fog coating.",
      descriptionAr: "مطابق لمعايير الحماية الأوروبية EN166 ومقاوم للضباب والخدش.",
      category: "Eye and Face",
      itemGroupId: "grp-helmets",
      gender: "Unisex",
      lifespanType: "Years",
      lifespanValue: 2,
      reorderLevel: 25,
      locationIds: ["loc-cai-new", "loc-cai-usd"],
      uom: "Piece",
      riskCategory: "II",
      manufacturer: "Uvex Safety",
      model: "Bionic Super-Shield",
      standardCertification: "EN 166:2001 / ANSI Z87.1"
    };

    const createBilingualRes = await req("POST", "/api/ppe-items", testItemPayload, adminToken);
    assert(createBilingualRes.status === 201, `Bilingual PPE Item creation must return 201 (got ${createBilingualRes.status})`);
    const createdItemId = createBilingualRes.json.id;

    // Verify dual names and descriptions persisted verbatim
    const getBilingualRes = await req("GET", `/api/ppe-items/${createdItemId}`, undefined, adminToken);
    assert(getBilingualRes.status === 200, "Get created item must return 200");
    assert(getBilingualRes.json.nameEn === testItemPayload.nameEn, "English name must match verbatim");
    assert(getBilingualRes.json.nameAr === testItemPayload.nameAr, "Arabic name must match verbatim");
    assert(getBilingualRes.json.descriptionEn === testItemPayload.descriptionEn, "English description must match verbatim");
    assert(getBilingualRes.json.descriptionAr === testItemPayload.descriptionAr, "Arabic description must match verbatim");
    console.log("✔ 2.1 Dual names and descriptions persisted and retrieved verbatim without mojibake");

    // Search by Arabic substring
    const searchArabicRes = await req("GET", "/api/ppe-items?search=كربونات", undefined, adminToken);
    assert(searchArabicRes.status === 200, "Search by Arabic keyword must return 200");
    assert(searchArabicRes.json.data.some((i: any) => i.id === createdItemId), "Arabic search must find the created bilingual item");
    console.log("✔ 2.2 Search by Arabic substring verified");

    // Search by English substring
    const searchEnglishRes = await req("GET", "/api/ppe-items?search=Polycarbonate", undefined, adminToken);
    assert(searchEnglishRes.status === 200, "Search by English keyword must return 200");
    assert(searchEnglishRes.json.data.some((i: any) => i.id === createdItemId), "English search must find the created bilingual item");
    console.log("✔ 2.3 Search by English substring verified");

    // Export CSV and verify UTF-8 headers and dual names present
    const exportRes = await fetch(`${base}/api/ppe-items/export`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(exportRes.status === 200, "Export CSV must return 200");
    const csvText = await exportRes.text();
    assert(csvText.includes("VSR-ADV-001"), "CSV export must contain item code");
    assert(csvText.includes("درع واقٍ للوجه"), "CSV export must contain verbatim Arabic name");
    console.log("✔ 2.4 CSV export contains valid UTF-8 Arabic and English records");

    // ====================================================
    // 3. SECURITY & ROLE AUTHORIZATION BOUNDARIES
    // ====================================================
    console.log("Testing security and role permission boundaries...");

    // 3.1 Unauthenticated request
    const unauthRes = await req("POST", "/api/ppe-items", testItemPayload, undefined);
    assert(unauthRes.status === 401, `Unauthenticated request must return 401 (got ${unauthRes.status})`);
    console.log("✔ 3.1 Unauthenticated request rejected (401)");

    // 3.2 Malformed JWT token
    const badTokenRes = await req("GET", "/api/ppe-items", undefined, "fake.invalid.jwt.token");
    assert(badTokenRes.status === 401, `Malformed JWT token must return 401 (got ${badTokenRes.status})`);
    console.log("✔ 3.2 Malformed JWT token rejected (401)");

    // 3.3 Employee attempting to create PPE item
    const empCreateItem = await req("POST", "/api/ppe-items", { ...testItemPayload, itemCode: "EMP-HACK-01" }, empToken);
    assert(empCreateItem.status === 403, `Employee creating PPE Item must return 403 (got ${empCreateItem.status})`);
    console.log("✔ 3.3 Employee role unauthorized for master data creation (403)");

    // 3.4 Store Keeper attempting to create Item Group
    const keeperCreateGroup = await req("POST", "/api/item-groups", { code: "KEEPER-GRP", nameEn: "Keeper Grp", nameAr: "مجموعة" }, keeperToken);
    assert(keeperCreateGroup.status === 403, `Store Keeper creating Item Group must return 403 (got ${keeperCreateGroup.status})`);
    console.log("✔ 3.4 Store Keeper unauthorized for Item Group creation (403)");

    // 3.5 Store Keeper attempting to delete Location
    const keeperDeleteLoc = await req("DELETE", "/api/locations/loc-cai-new", undefined, keeperToken);
    assert(keeperDeleteLoc.status === 403, `Store Keeper deleting Location must return 403 (got ${keeperDeleteLoc.status})`);
    console.log("✔ 3.5 Store Keeper unauthorized for Location deletion (403)");

    // 3.6 In-use bypass with whitespace-only override reason
    const blankOverrideRes = await req("PATCH", "/api/ppe-items/ppe-hlm-001/active", {
      active: false,
      adminOverrideReason: "      "
    }, adminToken);
    assert(blankOverrideRes.status === 400, `Whitespace-only adminOverrideReason must return 400 (got ${blankOverrideRes.status})`);
    console.log("✔ 3.6 Whitespace-only admin override reason rejected (400)");

    // ====================================================
    // 4. SQL INJECTION & PATHOLOGICAL INPUT RESILIENCE
    // ====================================================
    console.log("Testing SQL injection and special character resilience...");

    const sqlInjSearch = await req("GET", "/api/ppe-items?search=" + encodeURIComponent("' OR '1'='1' --"), undefined, adminToken);
    assert(sqlInjSearch.status === 200, "SQL injection search parameter must be safely handled without crash");
    assert(Array.isArray(sqlInjSearch.json.data), "Search response must be array");

    const emojiSearch = await req("GET", "/api/ppe-items?search=" + encodeURIComponent("🦺🔥⛑️"), undefined, adminToken);
    assert(emojiSearch.status === 200 && Array.isArray(emojiSearch.json.data), "Emoji/Unicode search must return empty list safely");

    console.log("✔ 4.1 SQL injection and unicode pathological queries handled safely");

    // ====================================================
    // 5. CLEANUP CREATED TEST ARTIFACTS
    // ====================================================
    // Clean up created test item
    await prisma.pPEItemLocation.deleteMany({ where: { ppeItemId: createdItemId } });
    await prisma.pPEItem.delete({ where: { id: createdItemId } });
    console.log("✔ 5.1 Test artifacts cleaned up successfully");

    console.log("\n=======================================================");
    console.log("🎉 ALL ADVERSARIAL CHALLENGER STRESS TESTS PASSED (100%)");
    console.log("=======================================================\n");

  } catch (err) {
    console.error("Adversarial stress test failed:", err);
    process.exit(1);
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
});
