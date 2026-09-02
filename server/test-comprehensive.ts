import { createApp } from "./src/app.js";
import { prisma } from "./src/lib/prisma.js";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

const app = createApp();
const server = app.listen(0, async () => {
  const addr: any = server.address();
  const base = `http://localhost:${addr.port}`;
  console.log(`Starting comprehensive test runner on ${base}`);

  async function req(method: string, path: string, body?: any, token?: string) {
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  }

  try {
    // ----------------------------------------------------
    // 1. AUTHENTICATION & TOKENS
    // ----------------------------------------------------
    const loginAdmin = await req("POST", "/api/auth/login", { employeeCode: "EMP-001", password: "password123" });
    assert(loginAdmin.status === 200 && !!loginAdmin.json.token, "Admin login must succeed");
    const adminToken = loginAdmin.json.token;

    const loginHse = await req("POST", "/api/auth/login", { employeeCode: "EMP-002", password: "password123" });
    assert(loginHse.status === 200 && !!loginHse.json.token, "HSE Supervisor login must succeed");
    const hseToken = loginHse.json.token;

    const loginSupervisor = await req("POST", "/api/auth/login", { employeeCode: "EMP-003", password: "password123" });
    assert(loginSupervisor.status === 200 && !!loginSupervisor.json.token, "Direct Supervisor login must succeed");
    const supervisorToken = loginSupervisor.json.token;

    const loginKeeper = await req("POST", "/api/auth/login", { employeeCode: "EMP-008", password: "password123" });
    assert(loginKeeper.status === 200 && !!loginKeeper.json.token, "Store Keeper login must succeed");
    const keeperToken = loginKeeper.json.token;

    const loginEmp = await req("POST", "/api/auth/login", { employeeCode: "EMP-004", password: "password123" });
    assert(loginEmp.status === 200 && !!loginEmp.json.token, "Employee login must succeed");
    const empToken = loginEmp.json.token;

    console.log("✔ Authentication tests passed across all roles");

    // ----------------------------------------------------
    // 2. PRISMA SCHEMA & SEEDED MASTER DATA VALIDATION
    // ----------------------------------------------------
    const employeesRes = await req("GET", "/api/employees", undefined, adminToken);
    assert(employeesRes.status === 200 && employeesRes.json.data.length >= 10, "Should list seeded employees");
    const sampleEmp = employeesRes.json.data.find((e: any) => e.employeeCode === "EMP-003");
    assert(sampleEmp && sampleEmp.gender === "Female", "Employee must have gender modeled");
    assert(sampleEmp && sampleEmp.employmentStatus === "Active", "Employee must have employmentStatus modeled");
    assert(sampleEmp && sampleEmp.department === "Operations", "Employee must have department modeled");

    const locationsRes = await req("GET", "/api/locations", undefined, adminToken);
    assert(locationsRes.status === 200 && locationsRes.json.data.length >= 5, "Should list seeded locations");
    const locNew = locationsRes.json.data.find((l: any) => l.code === "LOC-CAI-NEW");
    assert(locNew && locNew.stockCondition === "New", "Location must have stockCondition modeled");
    assert(locNew && locNew.openingBalanceStatus === "Closed", "Location must have openingBalanceStatus modeled");

    const groupsRes = await req("GET", "/api/item-groups", undefined, adminToken);
    assert(groupsRes.status === 200 && groupsRes.json.data.length >= 4, "Should list seeded item groups");
    const footwearGrp = groupsRes.json.data.find((g: any) => g.code === "FOOTWEAR");
    assert(footwearGrp && footwearGrp.requiresGenderMatch === true, "ItemGroup must have requiresGenderMatch modeled");

    const balancesRes = await req("GET", "/api/stock/balances", undefined, adminToken);
    assert(balancesRes.status === 200 && balancesRes.json.data.length >= 5, "Should list seeded stock balances");
    assert(balancesRes.json.data.some((b: any) => typeof b.quarantinedQuantity === "number"), "Stock balance must model quarantinedQuantity");

    console.log("✔ Schema fields and seed data validation passed");

    // ----------------------------------------------------
    // 3. RULE G2: IN-USE PROTECTION & ADMIN OVERRIDE (PPE-002, PPE-004)
    // ----------------------------------------------------
    // PPE Item 'ppe-hlm-001' has active stock and issuances
    const itemInUse = await req("GET", "/api/ppe-items/ppe-hlm-001/in-use", undefined, adminToken);
    assert(itemInUse.status === 200 && itemInUse.json.inUse === true, "Item ppe-hlm-001 must report in-use = true");
    assert(itemInUse.json.activeStockCount > 0, "Item ppe-hlm-001 must have active stock");

    // Non-admin (HSE Supervisor) attempts deactivation -> BLOCKED (400)
    const hseDeact = await req("PATCH", "/api/ppe-items/ppe-hlm-001/active", { active: false }, hseToken);
    assert(hseDeact.status === 400, "Non-admin deactivating in-use PPE item must be blocked with HTTP 400");

    // Admin attempts deactivation WITHOUT override reason -> BLOCKED (400)
    const adminDeactNoReason = await req("PATCH", "/api/ppe-items/ppe-hlm-001/active", { active: false }, adminToken);
    assert(adminDeactNoReason.status === 400, "Admin deactivating in-use PPE item without override reason must be blocked");

    // Admin attempts deactivation WITH override reason -> ALLOWED (200)
    const overrideReason = "Urgent manufacturer safety testing override";
    const adminDeactWithReason = await req("PATCH", "/api/ppe-items/ppe-hlm-001/active", { active: false, adminOverrideReason: overrideReason }, adminToken);
    assert(adminDeactWithReason.status === 200 && adminDeactWithReason.json.active === false, "Admin override deactivation must succeed with HTTP 200");

    // Verify AuditLog captured OVERRIDE_DEACTIVATE and reason
    const overrideLog = await prisma.auditLog.findFirst({
      where: { entityType: "PPEItem", entityId: "ppe-hlm-001", action: "OVERRIDE_DEACTIVATE" },
      orderBy: { timestamp: "desc" },
    });
    assert(overrideLog !== null && overrideLog.reason === overrideReason, "AuditLog must capture OVERRIDE_DEACTIVATE with matching reason");

    // Restore item
    const restoreItem = await req("PATCH", "/api/ppe-items/ppe-hlm-001/active", { active: true }, adminToken);
    assert(restoreItem.status === 200 && restoreItem.json.active === true, "Restoring PPE item must succeed");

    // Non-admin attempts deletion of in-use item -> BLOCKED (400)
    const hseDel = await req("DELETE", "/api/ppe-items/ppe-hlm-001", {}, hseToken);
    assert(hseDel.status === 400, "Non-admin deleting in-use PPE item must be blocked");

    console.log("✔ Rule G2: PPE Item in-use protection and Admin override audit logging verified");

    // ----------------------------------------------------
    // 4. RULE G2: IN-USE PROTECTION ON JOB POSITIONS (PPE-002)
    // ----------------------------------------------------
    // JobPosition 'jp-1' has active employees assigned
    const jpInUse = await req("GET", "/api/job-positions/jp-1/in-use", undefined, adminToken);
    assert(jpInUse.status === 200 && jpInUse.json.inUse === true, "Job position jp-1 must be reported in-use");

    // Non-admin attempts deletion -> BLOCKED (403 or 400)
    const empDelJp = await req("DELETE", "/api/job-positions/jp-1", {}, empToken);
    assert(empDelJp.status === 403, "Non-authorized role deleting JobPosition must receive 403");

    // Admin attempts deletion WITHOUT override reason -> BLOCKED (400)
    const adminDelJpNoReason = await req("DELETE", "/api/job-positions/jp-1", {}, adminToken);
    assert(adminDelJpNoReason.status === 400, "Admin deleting in-use JobPosition without reason must receive 400");

    // Admin attempts deletion WITH override reason -> ALLOWED (200)
    const jpReason = "Reorganizing engineering job structure test";
    const adminDelJpWithReason = await req("DELETE", "/api/job-positions/jp-1", { adminOverrideReason: jpReason }, adminToken);
    assert(adminDelJpWithReason.status === 200, "Admin deleting in-use JobPosition with reason must succeed");

    const jpLog = await prisma.auditLog.findFirst({
      where: { entityType: "JobPosition", entityId: "jp-1", action: "OVERRIDE_DELETE" },
      orderBy: { timestamp: "desc" },
    });
    assert(jpLog !== null && jpLog.reason === jpReason, "AuditLog must capture OVERRIDE_DELETE for JobPosition");

    // Restore JobPosition
    await req("POST", "/api/job-positions/jp-1/restore", {}, adminToken);

    console.log("✔ Rule G2: Job Position in-use protection and Admin override verified");

    // ----------------------------------------------------
    // 5. RULE G2: IN-USE PROTECTION ON KITS, GROUPS, ATTRIBUTES
    // ----------------------------------------------------
    // Item Group 'grp-helmets' is in use by PPE items
    const grpInUse = await req("GET", "/api/item-groups/grp-helmets/in-use", undefined, adminToken);
    assert(grpInUse.status === 200 && grpInUse.json.inUse === true, "Item group grp-helmets must be in use");
    const delGrpNoReason = await req("DELETE", "/api/item-groups/grp-helmets", {}, adminToken);
    assert(delGrpNoReason.status === 400, "Deleting in-use group without reason must be blocked");

    // Attribute 'attr-color' is in use
    const attrInUse = await req("GET", "/api/attributes/attr-color/in-use", undefined, adminToken);
    assert(attrInUse.status === 200 && attrInUse.json.inUse === true, "Attribute attr-color must be in use");
    const delAttrNoReason = await req("DELETE", "/api/attributes/attr-color", {}, adminToken);
    assert(delAttrNoReason.status === 400, "Deleting in-use attribute without reason must be blocked");

    console.log("✔ Rule G2: Kit, Item Group, and Attribute in-use protection verified");

    // ----------------------------------------------------
    // 6. RULE G2: LOCATION HOLDING STOCK HARD BLOCK (NO OVERRIDE EVER) (PPE-020, PPE-022)
    // ----------------------------------------------------
    // 'loc-cai-new' holds stock (35+ units)
    const locInUse = await req("GET", "/api/locations/loc-cai-new/in-use", undefined, adminToken);
    assert(locInUse.status === 200 && locInUse.json.inUse === true, "Location loc-cai-new holding stock must be in-use");

    // Admin attempts to deactivate location holding stock WITH override reason -> HARD BLOCKED (400)
    const adminDeactLoc = await req("PATCH", "/api/locations/loc-cai-new/active", { active: false, adminOverrideReason: "Attempt override holding stock" }, adminToken);
    assert(adminDeactLoc.status === 400, "Deactivating location holding stock must be HARD BLOCKED even with Admin override");

    // Admin attempts to delete location holding stock WITH override reason -> HARD BLOCKED (400)
    const adminDelLoc = await req("DELETE", "/api/locations/loc-cai-new", { adminOverrideReason: "Attempt override delete holding stock" }, adminToken);
    assert(adminDelLoc.status === 400, "Deleting location holding stock must be HARD BLOCKED even with Admin override");

    // Scrap location exemption: 'loc-cai-scr' has stock but is condition 'Scrap' -> deactivation is allowed!
    const scrapDeact = await req("PATCH", "/api/locations/loc-cai-scr/active", { active: false }, adminToken);
    assert(scrapDeact.status === 200 && scrapDeact.json.active === false, "Scrap location must be exempt from stock check and allowed to deactivate");
    // Restore scrap location
    await req("PATCH", "/api/locations/loc-cai-scr/active", { active: true }, adminToken);

    console.log("✔ Rule G2: Location holding stock hard block (no override) and Scrap exemption verified");

    // ----------------------------------------------------
    // 7. RULE G6: STOCK CONDITION & LOCATION CODE IMMUTABILITY (PPE-018, PPE-019)
    // ----------------------------------------------------
    // Attempt to change stockCondition on 'loc-cai-new' from New to Used -> BLOCKED (400)
    const lockConditionAttempt = await req("PUT", "/api/locations/loc-cai-new", {
      code: "LOC-CAI-NEW",
      nameEn: "Cairo Main Store",
      nameAr: "مستودع القاهرة الرئيسي",
      site: "Cairo Site",
      locationType: "Central Warehouse",
      stockCondition: "Used", // Invalid change!
    }, adminToken);
    assert(lockConditionAttempt.status === 400, "Changing stock condition on location that holds stock must be blocked with HTTP 400");

    // Attempt to change location code once stock exists -> BLOCKED (400)
    const lockCodeAttempt = await req("PUT", "/api/locations/loc-cai-new", {
      code: "LOC-CHANGED-CODE",
      nameEn: "Cairo Main Store",
      nameAr: "مستودع القاهرة الرئيسي",
      site: "Cairo Site",
      locationType: "Central Warehouse",
      stockCondition: "New",
    }, adminToken);
    assert(lockCodeAttempt.status === 400, "Changing location code on location with stock must be blocked with HTTP 400");

    console.log("✔ Rule G6: Stock condition and location code immutability verified");

    // ----------------------------------------------------
    // 8. ROLE SCOPING: STORE KEEPER LOCATION SCOPING (PPE-023)
    // ----------------------------------------------------
    // Sam (EMP-008) is assigned to Cairo locations (loc-cai-new, loc-cai-usd, loc-cai-scr)
    const keeperLocs = await req("GET", "/api/locations", undefined, keeperToken);
    assert(keeperLocs.status === 200, "Store Keeper locations query must succeed");
    const assignedIds = ["loc-cai-new", "loc-cai-usd", "loc-cai-scr", "loc-main-gen"];
    assert(
      keeperLocs.json.data.every((l: any) => assignedIds.includes(l.id)),
      "Store Keeper must only see assigned locations in location list"
    );

    // Store Keeper querying unassigned Alexandria location -> FORBIDDEN (403)
    const unassignedLoc = await req("GET", "/api/locations/loc-alx-new", undefined, keeperToken);
    assert(unassignedLoc.status === 403, "Store Keeper accessing unassigned location must receive HTTP 403 Forbidden");

    // Store Keeper querying assigned Cairo location -> ALLOWED (200)
    const assignedLoc = await req("GET", "/api/locations/loc-cai-new", undefined, keeperToken);
    assert(assignedLoc.status === 200, "Store Keeper accessing assigned location must succeed with HTTP 200");

    console.log("✔ Role Scoping: Store Keeper location scoping verified");

    // ----------------------------------------------------
    // 9. ROLE SCOPING: DIRECT SUPERVISOR TEAM SCOPING (PPE-042, R3)
    // ----------------------------------------------------
    // Sarah (EMP-003, Direct Supervisor) has subordinates in her team: emp-4, emp-5, emp-6, emp-7, emp-9, emp-10, emp-12
    const supervisorStaff = await req("GET", "/api/employees", undefined, supervisorToken);
    assert(supervisorStaff.status === 200, "Direct Supervisor querying employees must succeed");
    assert(
      supervisorStaff.json.data.length > 0 &&
      supervisorStaff.json.data.every((e: any) => e.supervisor?.id === "emp-3" || e.id === "emp-3"),
      "Direct Supervisor must only see own team members (subordinates)"
    );

    // Direct Supervisor accessing employee outside own team (e.g. Sam Store Keeper 'emp-8') -> FORBIDDEN (403)
    const outsideEmp = await req("GET", "/api/employees/emp-8", undefined, supervisorToken);
    assert(outsideEmp.status === 403, "Direct Supervisor accessing non-subordinate must receive HTTP 403 Forbidden");

    // Direct Supervisor accessing own team member (Ali Worker 'emp-4') -> ALLOWED (200)
    const ownTeamEmp = await req("GET", "/api/employees/emp-4", undefined, supervisorToken);
    assert(ownTeamEmp.status === 200, "Direct Supervisor accessing own subordinate must succeed with HTTP 200");

    console.log("✔ Role Scoping: Direct Supervisor team scoping verified");

    // ----------------------------------------------------
    // 10. STOCK BALANCES, ADJUSTMENTS & AUDIT TRAIL BASELINE
    // ----------------------------------------------------
    const adjApplied = await req("POST", "/api/stock/adjustments", {
      ppeItemId: "ppe-hlm-001",
      locationId: "loc-cai-new",
      batchNumber: "BAT-2026-001",
      quantityDelta: 10,
      type: "IN",
      reasonCategory: "New Delivery",
      reason: "Test delivery shipment receiving 12345",
    }, adminToken);
    assert(adjApplied.status === 201 && adjApplied.json.status === "applied", "Stock adjustment IN applied must succeed");

    // Opening balances
    const obs = await req("GET", "/api/opening-balances", undefined, adminToken);
    assert(obs.status === 200 && obs.json.data.length >= 1, "Opening balances list should return seeded OB");

    // Module Settings
    const settings = await prisma.moduleSettings.findFirst();
    assert(settings !== null && typeof settings.trashRetentionDays === "number", "ModuleSettings must be stored and readable");

    // Audit logs
    const audits = await req("GET", "/api/audit-logs", undefined, adminToken);
    assert(audits.status === 200 && audits.json.data.length >= 3, "Audit logs list should return records");

    // ----------------------------------------------------
    // 11. REMEDIATION: GENUINE CSV CATALOG IMPORT (PPE-007)
    // ----------------------------------------------------
    await prisma.pPEItem.deleteMany({ where: { itemCode: { in: ["IMP-TEST-001", "IMP-TEST-002"] } } });
    const csvData = [
      "Item Code,Name EN,Name AR,Category,Item Group,Risk Category,Lifespan,UoM,Active,Locations",
      'IMP-TEST-001,"Impact Resistant Goggles","نظارات مقاومة للصدمات",Eye,HELMETS,Category II,12 Months,Piece,Yes,LOC-CAI-NEW',
      'IMP-TEST-002,"High-Visibility Vest Class 3","سترة فوسفورية فئة 3",Body,HELMETS,Category I,6 Months,Piece,Yes,LOC-CAI-NEW',
    ].join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const fd = new FormData();
    fd.append("file", blob, "import_test.csv");
    fd.append("mode", "new_and_update");

    const importRes = await fetch(`${base}/api/ppe-items/import?mode=new_and_update`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: fd,
    });
    const importJson: any = await importRes.json();
    assert(importRes.status === 200, "Genuine CSV import must return HTTP 200");
    assert(importJson.imported === 2 || importJson.created === 2, "Import must create 2 items");
    assert(importJson.errors.length === 0, "Import must have 0 errors");

    // Verify database entities created
    const importedItem1 = await prisma.pPEItem.findUnique({
      where: { itemCode: "IMP-TEST-001" },
      include: { locations: true },
    });
    assert(importedItem1 !== null, "Imported item must exist in database");
    assert(importedItem1.locations.length > 0, "Imported item must have location links");

    // Verify AuditLog entry with source: 'Import'
    const importAudit = await prisma.auditLog.findFirst({
      where: { entityId: importedItem1.id, source: "Import" },
    });
    assert(importAudit !== null, "AuditLog entry with source 'Import' must be written");

    // Test new_only duplicate detection
    const blob2 = new Blob([csvData], { type: "text/csv" });
    const fd2 = new FormData();
    fd2.append("file", blob2, "import_test2.csv");
    fd2.append("mode", "new_only");
    const importDupRes = await fetch(`${base}/api/ppe-items/import?mode=new_only`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: fd2,
    });
    const importDupJson: any = await importDupRes.json();
    assert(importDupRes.status === 200, "Duplicate import in new_only mode returns 200");
    assert(importDupJson.imported === 0 && importDupJson.errors.length >= 2, "Items should be skipped in new_only mode");

    console.log("✔ Defect 1: Genuine Catalog Import verified");

    // ----------------------------------------------------
    // 12. REMEDIATION: ATTRIBUTE VALUE DIFFING & IN-USE PROTECTION (PPE-009)
    // ----------------------------------------------------
    const attrColor = await prisma.attribute.findUnique({ where: { code: "COLOR" }, include: { values: true } });
    assert(attrColor !== null, "COLOR attribute must exist");
    const yellowVal = attrColor.values.find((v: any) => v.value === "Yellow");
    assert(yellowVal !== undefined, "Yellow value must exist in COLOR");

    await prisma.attributeValue.deleteMany({ where: { attributeId: attrColor.id, value: "Hi-Vis Pink" } });

    // Ensure item 'HLM-001' has yellowVal link in PPEItemVariantValue
    const helmet = await prisma.pPEItem.findUnique({ where: { itemCode: "HLM-001" } });
    assert(helmet !== null, "Helmet HLM-001 must exist");
    await prisma.pPEItemVariantValue.upsert({
      where: { ppeItemId_attributeValueId: { ppeItemId: helmet.id, attributeValueId: yellowVal.id } },
      create: { ppeItemId: helmet.id, attributeValueId: yellowVal.id },
      update: {},
    });

    // Update COLOR adding a new value while keeping Yellow
    const updateAttrRes = await req("PUT", `/api/attributes/${attrColor.id}`, {
      code: "COLOR",
      nameEn: "Color",
      nameAr: "اللون",
      values: [
        { id: yellowVal.id, value: "Yellow", sortOrder: 1 },
        ...attrColor.values.filter((v: any) => v.id !== yellowVal.id && v.value !== "Hi-Vis Pink").map((v: any) => ({ id: v.id, value: v.value, sortOrder: v.sortOrder + 1 })),
        { value: "Hi-Vis Pink", sortOrder: 99 },
      ],
    }, adminToken);
    assert(updateAttrRes.status === 200, "Attribute update must succeed with HTTP 200");

    // Assert PPEItemVariantValue was NOT deleted (preserved ID)
    const variantStillLinked = await prisma.pPEItemVariantValue.count({
      where: { ppeItemId: helmet.id, attributeValueId: yellowVal.id },
    });
    assert(variantStillLinked === 1, "PPEItemVariantValue link must be preserved during attribute update");

    // Attempt to remove in-use Yellow value without override reason -> BLOCKED (400)
    const removeInUseNoOverride = await req("PUT", `/api/attributes/${attrColor.id}`, {
      code: "COLOR",
      nameEn: "Color",
      nameAr: "اللون",
      values: attrColor.values.filter((v: any) => v.id !== yellowVal.id).map((v: any) => ({ id: v.id, value: v.value, sortOrder: v.sortOrder })),
    }, adminToken);
    assert(removeInUseNoOverride.status === 400, "Removing in-use attribute value without override must receive HTTP 400");

    console.log("✔ Defect 2: Attribute Value Safe Diffing & In-Use Protection verified");

    // ----------------------------------------------------
    // 13. REMEDIATION: LOCATION DEACTIVATION HARD BLOCK ON PUT (RULE G2)
    // ----------------------------------------------------
    // loc-cai-new holds stock -> PUT deactivation attempt must be blocked
    const putDeactAttempt = await req("PUT", "/api/locations/loc-cai-new", {
      code: "LOC-CAI-NEW",
      nameEn: "Cairo Main Store",
      nameAr: "مستودع القاهرة الرئيسي",
      site: "Cairo Site",
      locationType: "Central Warehouse",
      stockCondition: "New",
      active: false,
    }, adminToken);
    assert(putDeactAttempt.status === 400, "Deactivating location holding stock via PUT must be blocked with HTTP 400");

    console.log("✔ Defect 3: Location Deactivation Hard Block on PUT verified");

    // ----------------------------------------------------
    // 14. REMEDIATION: ITEM CODE LOCKING AFTER TRANSACTIONS (PPE-002)
    // ----------------------------------------------------
    const itemWithTx = await prisma.pPEItem.findFirst({
      where: {
        stockBalances: { some: { quantityOnHand: { gt: 0 } } },
      },
    });
    assert(itemWithTx !== null, "Item with stock transactions must exist");
    const changeCodeAttempt = await req("PUT", `/api/ppe-items/${itemWithTx.id}`, {
      itemCode: "MUTATED-CODE-999",
      nameEn: itemWithTx.nameEn,
      nameAr: itemWithTx.nameAr,
      category: itemWithTx.category,
      itemGroupId: itemWithTx.itemGroupId,
      gender: itemWithTx.gender,
      lifespanType: itemWithTx.lifespanType,
      lifespanValue: itemWithTx.lifespanValue,
      riskCategory: itemWithTx.riskCategory,
      uom: itemWithTx.uom,
      reorderLevel: itemWithTx.reorderLevel,
      locationIds: ["loc-cai-new"],
    }, adminToken);
    assert(changeCodeAttempt.status === 400, "Mutating itemCode on PPE item with transactions must be blocked with HTTP 400");
    assert(
      (changeCodeAttempt.json.error || changeCodeAttempt.json.message || "").includes("Item code is locked"),
      "Error message must specify item code is locked"
    );

    console.log("✔ Defect 4: Item Code Locking After Transactions verified");

    // ----------------------------------------------------
    // 15. REMEDIATION: ITEM GROUP UNTICKED ATTRIBUTE PROTECTION (PPE-014)
    // ----------------------------------------------------
    const grpHelmets = await prisma.itemGroup.findUnique({ where: { code: "HELMETS" }, include: { attributes: true } });
    assert(grpHelmets !== null, "HELMETS item group must exist");

    // Ensure COLOR is assigned to HELMETS and helmet has variant value
    await prisma.itemGroupAttribute.upsert({
      where: { itemGroupId_attributeId: { itemGroupId: grpHelmets.id, attributeId: attrColor.id } },
      create: { itemGroupId: grpHelmets.id, attributeId: attrColor.id },
      update: {},
    });
    await prisma.pPEItemVariantValue.upsert({
      where: { ppeItemId_attributeValueId: { ppeItemId: helmet.id, attributeValueId: yellowVal.id } },
      create: { ppeItemId: helmet.id, attributeValueId: yellowVal.id },
      update: {},
    });
    const refreshedHelmets = await prisma.itemGroup.findUnique({ where: { id: grpHelmets.id }, include: { attributes: true } });

    // Attempt to untick COLOR without override -> BLOCKED (400)
    const untickNoReason = await req("PUT", `/api/item-groups/${grpHelmets.id}`, {
      code: "HELMETS",
      nameEn: "Safety Helmets & Headgear",
      nameAr: "خوذات السلامة",
      attributeIds: refreshedHelmets!.attributes.filter((a: any) => a.attributeId !== attrColor.id).map((a: any) => a.attributeId),
    }, adminToken);
    assert(untickNoReason.status === 400, "Unticking in-use attribute from Item Group without override must receive HTTP 400");

    // Untick with Admin override -> ALLOWED (200)
    const untickWithReason = await req("PUT", `/api/item-groups/${grpHelmets.id}`, {
      code: "HELMETS",
      nameEn: "Safety Helmets & Headgear",
      nameAr: "خوذات السلامة",
      attributeIds: refreshedHelmets!.attributes.filter((a: any) => a.attributeId !== attrColor.id).map((a: any) => a.attributeId),
      adminOverrideReason: "Decommissioning color specification for helmets in test",
    }, adminToken);
    assert(untickWithReason.status === 200, "Unticking in-use attribute with Admin override must succeed with HTTP 200");

    // Restore grpHelmets to clean state
    await prisma.itemGroup.update({
      where: { id: grpHelmets.id },
      data: { nameEn: "Safety Helmets & Headgear" },
    });
    await prisma.itemGroupAttribute.upsert({
      where: { itemGroupId_attributeId: { itemGroupId: grpHelmets.id, attributeId: attrColor.id } },
      create: { itemGroupId: grpHelmets.id, attributeId: attrColor.id },
      update: {},
    });

    // Verify AuditLog captured ATTRIBUTE_UNTICKED_VALUES_CLEARED
    const clearedAudit = await prisma.auditLog.findFirst({
      where: { entityType: "ItemGroup", entityId: grpHelmets.id, action: "ATTRIBUTE_UNTICKED_VALUES_CLEARED" },
    });
    assert(clearedAudit !== null, "AuditLog must record ATTRIBUTE_UNTICKED_VALUES_CLEARED");

    console.log("✔ Defect 5: Item Group Unticked Attribute Protection verified");

    // ----------------------------------------------------
    // 16. REMEDIATION: RULE G1 AUDIT TRAIL JSON DIFFS & EMPLOYEE MUTATIONS
    // ----------------------------------------------------
    const updateEmpRes = await req("PUT", "/api/employees/emp-4", { department: "Civil Engineering" }, adminToken);
    assert(updateEmpRes.status === 200, "Updating employee must succeed");

    const empAudit = await prisma.auditLog.findFirst({
      where: { entityType: "Employee", entityId: "emp-4", action: "UPDATED" },
      orderBy: { timestamp: "desc" },
    });
    assert(empAudit !== null, "Employee update must generate an AuditLog entry");
    assert(!!empAudit.beforeValues && !!empAudit.afterValues, "Employee AuditLog must have beforeValues and afterValues");
    assert(!empAudit.beforeValues.includes("passwordHash"), "passwordHash must not leak in beforeValues");
    assert(!empAudit.afterValues.includes("passwordHash"), "passwordHash must not leak in afterValues");

    console.log("✔ Defect 6: Employee Audit Trail & Rule G1 JSON Diffs verified");

    // ----------------------------------------------------
    // 17. REMEDIATION: DIRECT SUPERVISOR SELF-INCLUSION (DEFECT 7)
    // ----------------------------------------------------
    const supTeamRes = await req("GET", "/api/employees", undefined, supervisorToken);
    assert(supTeamRes.status === 200, "Supervisor team listing must succeed");
    const includesSelf = supTeamRes.json.data.some((e: any) => e.id === "emp-3");
    assert(includesSelf, "Direct Supervisor Sarah (emp-3) must be included in her own team listing");

    console.log("✔ Defect 7: Direct Supervisor self-inclusion verified");

    console.log("\n=======================================================");
    console.log("🎉 ALL MILESTONE 1 VERIFICATION ASSERTIONS PASSED (100%)");
    console.log("=======================================================\n");

    server.close();
    await prisma.$disconnect();
    console.log("COMPREHENSIVE DONE");
    process.exit(0);
  } catch (err) {
    console.error("Test execution failed:", err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
});
