import { createApp } from "../server/src/app.js";
import { prisma } from "../server/src/lib/prisma.js";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`\n❌ EMPIRICAL CHALLENGE FAILED: ${msg}\n`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

const app = createApp();
const server = app.listen(0, async () => {
  const addr: any = server.address();
  const base = `http://localhost:${addr.port}`;
  console.log(`\n=======================================================`);
  console.log(`🚀 RUNNING EMPIRICAL ADVERSARIAL STRESS TEST HARNESS`);
  console.log(`Target: ${base}`);
  console.log(`=======================================================\n`);

  async function req(method: string, path: string, body?: any, token?: string) {
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  }

  try {
    // ----------------------------------------------------
    // AUTHENTICATE ALL ROLES
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

    console.log("✔ Authentication verified for Admin, HSE Supervisor, and Direct Supervisor");

    // =========================================================================
    // CHALLENGE 1: CATALOG IMPORT STRESS TEST (PPE-007)
    // =========================================================================
    console.log("\n--- [CHALLENGE 1] Catalog Import Stress Test ---");

    // Clean up test items if previously present
    await prisma.pPEItemLocation.deleteMany({
      where: { ppeItem: { itemCode: { in: ["ADV-IMP-001", "ADV-IMP-002", "ADV-IMP-003", "ADV-IMP-004"] } } },
    });
    await prisma.pPEItem.deleteMany({
      where: { itemCode: { in: ["ADV-IMP-001", "ADV-IMP-002", "ADV-IMP-003", "ADV-IMP-004"] } },
    });

    // 1. Construct adversarial CSV with:
    // - UTF-8 BOM
    // - Quoted fields with commas and Arabic text
    // - Row 1: Valid item ADV-IMP-001
    // - Row 2: Invalid item missing Name EN
    // - Row 3: Invalid item referencing non-existent Item Group
    // - Row 4: Invalid item missing Item Code
    // - Row 5: Valid item ADV-IMP-004
    const adversarialCsv =
      "\uFEFFItem Code,Name EN,Name AR,Category,Item Group,Risk Category,Lifespan,UoM,Locations,Active\n" +
      'ADV-IMP-001,"Heavy Duty Welding Mask, Dual Sensor","قناع لحام ثقيل, بمستشعر مزدوج","Eye Protection","HELMETS","Category III","24 Months","Piece","LOC-CAI-NEW","true"\n' +
      'ADV-IMP-002,,"قناع بلا اسم إنجليزي","Eye Protection","HELMETS","Category II","12 Months","Piece","LOC-CAI-NEW","true"\n' +
      'ADV-IMP-003,"Anti-Radiation Boots","حذاء ضد الإشعاع","Footwear","NON_EXISTENT_GROUP_XYZ","Category I","6 Months","Pair","LOC-CAI-NEW","true"\n' +
      ',"Nameless Code Item","عنصر بدون كود","General","HELMETS","Category I","6 Months","Piece","LOC-CAI-NEW","true"\n' +
      'ADV-IMP-004,"Chemical Splash Apron, Grade 4","مريول حماية كيميائي, درجة 4","Body Protection","GLOVES","Category III","36 Months","Piece","LOC-ALX-NEW","true"\n';

    const blob1 = new Blob([adversarialCsv], { type: "text/csv;charset=utf-8" });
    const fd1 = new FormData();
    fd1.append("file", blob1, "adversarial_catalog.csv");
    fd1.append("mode", "new_only");

    const importRes1 = await fetch(`${base}/api/ppe-items/import?mode=new_only`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: fd1,
    });
    const importJson1: any = await importRes1.json();

    assert(importRes1.status === 200, `CSV Import returned HTTP ${importRes1.status}`);
    assert(
      (importJson1.imported === 2 || importJson1.created === 2),
      `Expected 2 imported items, got imported=${importJson1.imported}, created=${importJson1.created}`
    );
    assert(
      Array.isArray(importJson1.errors) && importJson1.errors.length === 3,
      `Expected exactly 3 row validation errors, got ${importJson1.errors?.length}: ${JSON.stringify(importJson1.errors)}`
    );

    // Verify valid items exist in SQLite
    const imp1 = await prisma.pPEItem.findUnique({
      where: { itemCode: "ADV-IMP-001" },
      include: { locations: true },
    });
    assert(imp1 !== null, "ADV-IMP-001 must exist in SQLite");
    assert(imp1!.nameEn === "Heavy Duty Welding Mask, Dual Sensor", "ADV-IMP-001 nameEn must match CSV");
    assert(imp1!.riskCategory === "III", "ADV-IMP-001 riskCategory must be III");
    assert(imp1!.lifespanValue === 24 && imp1!.lifespanType === "Months", "ADV-IMP-001 lifespan must be 24 Months");
    assert(imp1!.locations.some((l) => l.locationId === "loc-cai-new"), "ADV-IMP-001 must link to loc-cai-new");

    const imp4 = await prisma.pPEItem.findUnique({
      where: { itemCode: "ADV-IMP-004" },
      include: { locations: true },
    });
    assert(imp4 !== null, "ADV-IMP-004 must exist in SQLite");
    assert(imp4!.riskCategory === "III", "ADV-IMP-004 riskCategory must be III");
    assert(imp4!.locations.some((l) => l.locationId === "loc-alx-new"), "ADV-IMP-004 must link to loc-alx-new");

    // Verify invalid items were NOT inserted into SQLite
    const imp2 = await prisma.pPEItem.findUnique({ where: { itemCode: "ADV-IMP-002" } });
    assert(imp2 === null, "ADV-IMP-002 (missing Name EN) must NOT exist in SQLite");
    const imp3 = await prisma.pPEItem.findUnique({ where: { itemCode: "ADV-IMP-003" } });
    assert(imp3 === null, "ADV-IMP-003 (invalid Item Group) must NOT exist in SQLite");

    // Verify AuditLog entries
    const audit1 = await prisma.auditLog.findFirst({
      where: { entityId: imp1!.id, action: "CREATED", source: "Import" },
    });
    assert(audit1 !== null, "AuditLog for ADV-IMP-001 must have action CREATED, source Import");
    assert(audit1!.retentionFlag === "7_YEARS", "AuditLog retentionFlag must be 7_YEARS");

    // 2. Test duplicate handling in new_only mode
    const blobDup = new Blob([adversarialCsv], { type: "text/csv;charset=utf-8" });
    const fdDup = new FormData();
    fdDup.append("file", blobDup, "duplicate_catalog.csv");
    fdDup.append("mode", "new_only");

    const importDupRes = await fetch(`${base}/api/ppe-items/import?mode=new_only`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: fdDup,
    });
    const importDupJson: any = await importDupRes.json();
    assert(importDupRes.status === 200, "Duplicate import in new_only returns 200");
    assert(
      (importDupJson.imported === 0 || importDupJson.created === 0),
      "In new_only mode, 0 items should be imported when all exist"
    );
    assert(
      importDupJson.errors.some((e: string) => e.includes("ADV-IMP-001") && e.includes("already exists")),
      "Duplicate error message must cite ADV-IMP-001 already existing in new_only mode"
    );

    // 3. Test update handling in new_and_update mode
    const updateCsv =
      "Item Code,Name EN,Name AR,Category,Item Group,Risk Category,Lifespan,UoM,Locations,Active\n" +
      'ADV-IMP-001,"Heavy Duty Welding Mask v2.0","قناع لحام ثقيل إصدار 2","Eye Protection","HELMETS","Category III","48 Months","Piece","LOC-ALX-NEW","true"\n';

    const blobUpd = new Blob([updateCsv], { type: "text/csv;charset=utf-8" });
    const fdUpd = new FormData();
    fdUpd.append("file", blobUpd, "update_catalog.csv");
    fdUpd.append("mode", "new_and_update");

    const importUpdRes = await fetch(`${base}/api/ppe-items/import?mode=new_and_update`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: fdUpd,
    });
    const importUpdJson: any = await importUpdRes.json();
    assert(importUpdRes.status === 200, "Update import in new_and_update returns 200");
    assert(importUpdJson.updated === 1, `Expected updated=1, got ${importUpdJson.updated}`);

    // Verify update in SQLite
    const imp1Updated = await prisma.pPEItem.findUnique({
      where: { itemCode: "ADV-IMP-001" },
      include: { locations: true },
    });
    assert(imp1Updated!.nameEn === "Heavy Duty Welding Mask v2.0", "ADV-IMP-001 nameEn must be updated");
    assert(imp1Updated!.lifespanValue === 48, "ADV-IMP-001 lifespanValue must be updated to 48");
    assert(imp1Updated!.locations.some((l) => l.locationId === "loc-alx-new"), "ADV-IMP-001 location must be loc-alx-new");

    // Verify AuditLog for update
    const auditUpd = await prisma.auditLog.findFirst({
      where: { entityId: imp1!.id, action: "UPDATED", source: "Import" },
      orderBy: { timestamp: "desc" },
    });
    assert(auditUpd !== null, "AuditLog for ADV-IMP-001 update must exist with source Import");
    assert(!!auditUpd!.beforeValues && !!auditUpd!.afterValues, "AuditLog must contain beforeValues and afterValues");

    console.log("✔ Challenge 1: Catalog Import RFC 4180 parsing, validation, mode handling, and audit logging PASSED");

    // =========================================================================
    // CHALLENGE 2: ATTRIBUTE VALUE PRESERVATION & SAFE DIFFING (PPE-009)
    // =========================================================================
    console.log("\n--- [CHALLENGE 2] Attribute Value Preservation & Safe Diffing ---");

    const attrColor = await prisma.attribute.findUnique({
      where: { code: "COLOR" },
      include: { values: true },
    });
    assert(attrColor !== null, "Attribute COLOR must exist");
    const whiteVal = attrColor!.values.find((v) => v.value.toLowerCase() === "white");
    assert(whiteVal !== undefined, "Attribute COLOR must have value 'White'");

    // Target PPE item for variant linkage
    const helmet = await prisma.pPEItem.findFirst({
      where: { itemCode: "HLM-001" },
    });
    assert(helmet !== null, "Helmet HLM-001 must exist");

    // Ensure HLM-001 is linked to whiteVal in PPEItemVariantValue
    await prisma.pPEItemVariantValue.upsert({
      where: { ppeItemId_attributeValueId: { ppeItemId: helmet!.id, attributeValueId: whiteVal!.id } },
      create: { ppeItemId: helmet!.id, attributeValueId: whiteVal!.id },
      update: {},
    });

    const initialVariantCount = await prisma.pPEItemVariantValue.count({
      where: { attributeValueId: whiteVal!.id },
    });
    assert(initialVariantCount >= 1, "White attribute value must be linked to at least 1 PPEItemVariantValue");

    // Step A: Update Attribute adding a new value "Titanium Pearl" and re-ordering
    const payloadPreserve = {
      code: attrColor!.code,
      nameEn: attrColor!.nameEn,
      nameAr: attrColor!.nameAr,
      values: [
        { id: whiteVal!.id, value: whiteVal!.value, sortOrder: 10 },
        ...attrColor!.values
          .filter((v) => v.id !== whiteVal!.id && v.value !== "Titanium Pearl")
          .map((v) => ({ id: v.id, value: v.value, sortOrder: v.sortOrder + 20 })),
        { value: "Titanium Pearl", sortOrder: 99 },
      ],
    };

    const putAttrPreserve = await req("PUT", `/api/attributes/${attrColor!.id}`, payloadPreserve, adminToken);
    assert(putAttrPreserve.status === 200, `PUT /api/attributes/:id failed: ${JSON.stringify(putAttrPreserve.json)}`);

    // Verify existing White value was NOT deleted and recreated with a new ID
    const whiteValAfter = await prisma.attributeValue.findUnique({ where: { id: whiteVal!.id } });
    assert(whiteValAfter !== null, "AttributeValue 'White' must preserve its exact ID");
    assert(whiteValAfter!.sortOrder === 10, "AttributeValue 'White' sortOrder must be updated to 10");

    // Verify PPEItemVariantValue link is STILL INTACT
    const variantCountAfter = await prisma.pPEItemVariantValue.count({
      where: { attributeValueId: whiteVal!.id },
    });
    assert(
      variantCountAfter === initialVariantCount,
      `PPEItemVariantValue links severed! Expected ${initialVariantCount}, got ${variantCountAfter}`
    );

    // Step B: Attempt removing in-use value WITHOUT Admin override reason -> MUST BE BLOCKED 400
    const payloadRemoveNoReason = {
      code: attrColor!.code,
      nameEn: attrColor!.nameEn,
      nameAr: attrColor!.nameAr,
      values: attrColor!.values
        .filter((v) => v.id !== whiteVal!.id)
        .map((v) => ({ id: v.id, value: v.value, sortOrder: v.sortOrder })),
    };

    // 1. By HSE Supervisor (Non-Admin) -> 400
    const removeHse = await req("PUT", `/api/attributes/${attrColor!.id}`, payloadRemoveNoReason, hseToken);
    assert(removeHse.status === 400, "Non-admin attempting to remove in-use attribute value must receive HTTP 400");

    // 2. By Admin without reason -> 400
    const removeAdminNoReason = await req("PUT", `/api/attributes/${attrColor!.id}`, payloadRemoveNoReason, adminToken);
    assert(removeAdminNoReason.status === 400, "Admin removing in-use attribute value without override reason must receive HTTP 400");
    assert(
      (removeAdminNoReason.json.error || removeAdminNoReason.json.message || "").includes("Admin override reason is required"),
      "Error message must specify Admin override reason is required"
    );

    // Verify White value still exists
    const whiteStillExists = await prisma.attributeValue.findUnique({ where: { id: whiteVal!.id } });
    assert(whiteStillExists !== null, "In-use value must NOT be deleted when blocked");

    console.log("✔ Challenge 2: Attribute Value Safe Diffing & In-Use Protection PASSED");

    // =========================================================================
    // CHALLENGE 3: LOCATION DEACTIVATION HARD BLOCK ON PUT (RULE G2)
    // =========================================================================
    console.log("\n--- [CHALLENGE 3] Location Deactivation Hard Block on PUT ---");

    const locCaiNew = await prisma.location.findUnique({ where: { id: "loc-cai-new" } });
    assert(locCaiNew !== null, "Location loc-cai-new must exist");

    // Verify stock exists on loc-cai-new
    const stockOnCai = await prisma.stockBalance.aggregate({
      where: { locationId: "loc-cai-new" },
      _sum: { quantityOnHand: true },
    });
    const totalOnHand = stockOnCai._sum.quantityOnHand || 0;
    assert(totalOnHand > 0, `loc-cai-new must hold stock (currently ${totalOnHand})`);

    // 1. Admin sends PUT /api/locations/loc-cai-new with active: false
    const putDeactPayload = {
      code: locCaiNew!.code,
      nameEn: locCaiNew!.nameEn,
      nameAr: locCaiNew!.nameAr,
      site: locCaiNew!.site,
      locationType: locCaiNew!.locationType,
      stockCondition: locCaiNew!.stockCondition,
      capacityUnits: locCaiNew!.capacityUnits,
      active: false,
      adminOverrideReason: "Attempting forced deactivation of stock holding location",
    };

    const putDeactRes = await req("PUT", "/api/locations/loc-cai-new", putDeactPayload, adminToken);
    assert(
      putDeactRes.status === 400,
      `PUT /api/locations/loc-cai-new with active: false must receive HTTP 400, got ${putDeactRes.status}`
    );
    assert(
      (putDeactRes.json.error || putDeactRes.json.message || "").includes("Cannot deactivate or delete location holding stock"),
      `Expected 'Cannot deactivate or delete location holding stock', got: ${JSON.stringify(putDeactRes.json)}`
    );

    // Verify in SQLite that loc-cai-new is still active
    const locAfterPut = await prisma.location.findUnique({ where: { id: "loc-cai-new" } });
    assert(locAfterPut!.active === true, "loc-cai-new active flag must remain true in SQLite");

    // 2. Also verify PATCH /api/locations/loc-cai-new/active is blocked
    const patchDeactRes = await req("PATCH", "/api/locations/loc-cai-new/active", { active: false }, adminToken);
    assert(patchDeactRes.status === 400, "PATCH /api/locations/loc-cai-new/active must also receive HTTP 400");

    // 3. Verify Scrap location exemption (Rule G2: Scrap locations are exempt from hard block)
    const locScr = await prisma.location.findUnique({ where: { id: "loc-cai-scr" } });
    assert(locScr !== null, "Scrap location loc-cai-scr must exist");

    const patchScrDeact = await req("PATCH", "/api/locations/loc-cai-scr/active", { active: false }, adminToken);
    assert(patchScrDeact.status === 200, "Scrap location deactivation must succeed per Rule G2 exemption");
    // Restore scrap location
    await req("PATCH", "/api/locations/loc-cai-scr/active", { active: true }, adminToken);

    console.log("✔ Challenge 3: Location Deactivation Hard Block on PUT (Rule G2) and Scrap exemption PASSED");

    // =========================================================================
    // CHALLENGE 4: ITEM CODE LOCKING AFTER TRANSACTIONS (PPE-002)
    // =========================================================================
    console.log("\n--- [CHALLENGE 4] Item Code Locking After Transactions ---");

    // Find helmet item ppe-hlm-001 (or find any item with transactions)
    const targetItem = await prisma.pPEItem.findFirst({
      where: {
        id: "ppe-hlm-001",
      },
    });
    assert(targetItem !== null, "Item ppe-hlm-001 must exist");

    // Verify ppe-hlm-001 has transactions
    const txCount = await prisma.stockBalance.count({
      where: { ppeItemId: targetItem!.id, quantityOnHand: { gt: 0 } },
    });
    assert(txCount > 0, "Item ppe-hlm-001 must have active stock balances");

    // Admin attempts to change itemCode on ppe-hlm-001
    const putCodeChangePayload = {
      itemCode: "MUTATED-ITEM-CODE-999",
      nameEn: targetItem!.nameEn,
      nameAr: targetItem!.nameAr,
      category: targetItem!.category,
      itemGroupId: targetItem!.itemGroupId,
      gender: targetItem!.gender,
      lifespanType: targetItem!.lifespanType,
      lifespanValue: targetItem!.lifespanValue,
      riskCategory: targetItem!.riskCategory,
      uom: targetItem!.uom,
      reorderLevel: targetItem!.reorderLevel,
      locationIds: ["loc-cai-new"],
    };

    const putCodeChangeRes = await req("PUT", `/api/ppe-items/${targetItem!.id}`, putCodeChangePayload, adminToken);
    assert(
      putCodeChangeRes.status === 400,
      `PUT /api/ppe-items/:id with modified itemCode must receive HTTP 400, got ${putCodeChangeRes.status}`
    );
    assert(
      (putCodeChangeRes.json.error || putCodeChangeRes.json.message || "").includes("Item code is locked and cannot be changed once transactions exist"),
      `Expected 'Item code is locked and cannot be changed once transactions exist', got: ${JSON.stringify(putCodeChangeRes.json)}`
    );

    // Verify SQLite itemCode was NOT changed
    const targetItemAfter = await prisma.pPEItem.findUnique({ where: { id: targetItem!.id } });
    assert(targetItemAfter!.itemCode === targetItem!.itemCode, "Item code must remain original in SQLite");

    // Edge case: Verify that an item with NO transactions CAN change its itemCode
    await prisma.pPEItemLocation.deleteMany({ where: { ppeItem: { itemCode: "UNLOCKED-NEW-01" } } });
    await prisma.pPEItem.deleteMany({ where: { itemCode: "UNLOCKED-NEW-01" } });

    const createUnlocked = await req("POST", "/api/ppe-items", {
      itemCode: "UNLOCKED-NEW-01",
      nameEn: "Fresh PPE Item Without Transactions",
      nameAr: "عنصر سلامة جديد بدون معاملات",
      category: "Eye Protection",
      itemGroupId: targetItem!.itemGroupId,
      gender: "Unisex",
      lifespanType: "Months",
      lifespanValue: 12,
      riskCategory: "I",
      uom: "Piece",
      reorderLevel: 5,
      locationIds: ["loc-cai-new"],
    }, adminToken);
    assert(createUnlocked.status === 201, "Creating item without transactions must succeed");

    const unlockedId = createUnlocked.json.id;
    const updateUnlockedCode = await req("PUT", `/api/ppe-items/${unlockedId}`, {
      ...putCodeChangePayload,
      itemCode: "UNLOCKED-NEW-02",
      nameEn: "Fresh PPE Item Code Altered",
    }, adminToken);
    assert(updateUnlockedCode.status === 200, "Updating itemCode on item with 0 transactions MUST succeed");
    const updatedUnlocked = await prisma.pPEItem.findUnique({ where: { id: unlockedId } });
    assert(updatedUnlocked!.itemCode === "UNLOCKED-NEW-02", "itemCode should be updated to UNLOCKED-NEW-02");

    // Clean up unlocked test item
    await prisma.pPEItemLocation.deleteMany({ where: { ppeItemId: unlockedId } });
    await prisma.pPEItem.deleteMany({ where: { id: unlockedId } });

    console.log("✔ Challenge 4: Item Code Locking After Transactions & 0-tx allowance PASSED");

    // =========================================================================
    // CHALLENGE 5: AUDIT LOG INTEGRITY & SECURITY SANITIZATION (RULE G1)
    // =========================================================================
    console.log("\n--- [CHALLENGE 5] Audit Log Integrity & Security Sanitization ---");

    // 1. Employee update must sanitize passwordHash
    const emp4Before = await prisma.employee.findUnique({ where: { id: "emp-4" } });
    assert(emp4Before !== null, "Employee emp-4 must exist");
    assert(!!emp4Before!.passwordHash, "Employee emp-4 must have a passwordHash");

    const updateEmpRes = await req("PUT", "/api/employees/emp-4", { department: "Environmental Health & Safety" }, adminToken);
    assert(updateEmpRes.status === 200, "Employee update must succeed");

    const empAuditLog = await prisma.auditLog.findFirst({
      where: { entityType: "Employee", entityId: "emp-4", action: "UPDATED" },
      orderBy: { timestamp: "desc" },
    });
    assert(empAuditLog !== null, "AuditLog for employee update must exist");
    assert(empAuditLog!.beforeValues !== null && empAuditLog!.afterValues !== null, "AuditLog must contain before/after values");
    assert(!empAuditLog!.beforeValues!.includes("passwordHash"), "passwordHash MUST NOT leak in beforeValues audit JSON");
    assert(!empAuditLog!.afterValues!.includes("passwordHash"), "passwordHash MUST NOT leak in afterValues audit JSON");

    // 2. Direct Supervisor Team Scoping
    // EMP-003 is Sarah (Direct Supervisor)
    const supTeamRes = await req("GET", "/api/employees", undefined, supervisorToken);
    assert(supTeamRes.status === 200, "GET /api/employees by Direct Supervisor must succeed");
    const teamMembers: any[] = supTeamRes.json.data;

    // Must include Sarah herself (emp-3)
    const hasSelf = teamMembers.some((m) => m.id === "emp-3");
    assert(hasSelf, "Direct Supervisor Sarah (emp-3) must be included in her own team listing");

    // Must include her subordinate emp-4
    const hasSubordinate = teamMembers.some((m) => m.id === "emp-4");
    assert(hasSubordinate, "Subordinate emp-4 must be in Sarah's team listing");

    // Must NOT include non-subordinate emp-8 (Store Keeper in Alexandria)
    const hasUnrelated = teamMembers.some((m) => m.id === "emp-8");
    assert(!hasUnrelated, "Unrelated employee emp-8 must NOT be in Sarah's team listing");

    // Direct access to non-subordinate must be 403 Forbidden
    const directOtherRes = await req("GET", "/api/employees/emp-8", undefined, supervisorToken);
    assert(directOtherRes.status === 403, "Direct access to non-team employee must return HTTP 403 Forbidden");

    console.log("✔ Challenge 5: Audit Log Integrity, passwordHash sanitization, and Supervisor Scoping PASSED");

    // =========================================================================
    // CHALLENGE 6: LOCATION CODE & STOCK CONDITION IMMUTABILITY ON PUT (RULE G6)
    // =========================================================================
    console.log("\n--- [CHALLENGE 6] Location Code & Condition Immutability on PUT ---");

    // Attempt to change code on loc-cai-new (which holds stock)
    const mutateLocCode = await req("PUT", "/api/locations/loc-cai-new", {
      code: "LOC-CAI-MUTATED",
      nameEn: locCaiNew!.nameEn,
      nameAr: locCaiNew!.nameAr,
      site: locCaiNew!.site,
      locationType: locCaiNew!.locationType,
      stockCondition: locCaiNew!.stockCondition,
    }, adminToken);
    assert(mutateLocCode.status === 400, "Mutating location code when stock exists must be blocked with HTTP 400");
    assert(
      (mutateLocCode.json.error || mutateLocCode.json.message || "").includes("Location code is locked and cannot be changed once stock exists"),
      "Error must state location code is locked"
    );

    // Attempt to change stockCondition on loc-cai-new (which holds stock)
    const mutateLocCond = await req("PUT", "/api/locations/loc-cai-new", {
      code: locCaiNew!.code,
      nameEn: locCaiNew!.nameEn,
      nameAr: locCaiNew!.nameAr,
      site: locCaiNew!.site,
      locationType: locCaiNew!.locationType,
      stockCondition: "Used",
    }, adminToken);
    assert(mutateLocCond.status === 400, "Mutating stock condition when stock exists must be blocked with HTTP 400");
    assert(
      (mutateLocCond.json.error || mutateLocCond.json.message || "").includes("Stock condition is locked and cannot be changed once stock exists"),
      "Error must state stock condition is locked"
    );

    console.log("✔ Challenge 6: Location Code & Condition Immutability on PUT PASSED");

    // =========================================================================
    // CHALLENGE 7: ITEM GROUP UNTICKED ATTRIBUTE PROTECTION (PPE-014)
    // =========================================================================
    console.log("\n--- [CHALLENGE 7] Item Group Unticked Attribute In-Use Protection ---");

    const grpHelmets = await prisma.itemGroup.findUnique({
      where: { code: "HELMETS" },
      include: { attributes: true },
    });
    assert(grpHelmets !== null, "HELMETS group must exist");

    // Ensure COLOR is linked to HELMETS and helmet has variant value
    await prisma.itemGroupAttribute.upsert({
      where: { itemGroupId_attributeId: { itemGroupId: grpHelmets!.id, attributeId: attrColor!.id } },
      create: { itemGroupId: grpHelmets!.id, attributeId: attrColor!.id },
      update: {},
    });
    await prisma.pPEItemVariantValue.upsert({
      where: { ppeItemId_attributeValueId: { ppeItemId: helmet!.id, attributeValueId: whiteVal!.id } },
      create: { ppeItemId: helmet!.id, attributeValueId: whiteVal!.id },
      update: {},
    });

    const refreshedGrp = await prisma.itemGroup.findUnique({
      where: { id: grpHelmets!.id },
      include: { attributes: true },
    });

    // Untick without override reason -> BLOCKED (400)
    const remainingAttrIds = refreshedGrp!.attributes
      .filter((a) => a.attributeId !== attrColor!.id)
      .map((a) => a.attributeId);

    const untickBlocked = await req("PUT", `/api/item-groups/${grpHelmets!.id}`, {
      code: grpHelmets!.code,
      nameEn: grpHelmets!.nameEn,
      nameAr: grpHelmets!.nameAr,
      attributeIds: remainingAttrIds,
    }, adminToken);
    assert(untickBlocked.status === 400, "Unticking in-use attribute without override must receive HTTP 400");
    assert(
      (untickBlocked.json.error || untickBlocked.json.message || "").includes("Admin override reason is required"),
      "Error must require Admin override reason"
    );

    // Untick WITH Admin override reason -> ALLOWED (200)
    const untickAllowed = await req("PUT", `/api/item-groups/${grpHelmets!.id}`, {
      code: grpHelmets!.code,
      nameEn: grpHelmets!.nameEn,
      nameAr: grpHelmets!.nameAr,
      attributeIds: remainingAttrIds,
      adminOverrideReason: "Authorized unticking of color attribute for testing",
    }, adminToken);
    assert(untickAllowed.status === 200, "Unticking in-use attribute with Admin override must succeed");

    // Check AuditLog recorded ATTRIBUTE_UNTICKED_VALUES_CLEARED
    const untickAudit = await prisma.auditLog.findFirst({
      where: { entityType: "ItemGroup", entityId: grpHelmets!.id, action: "ATTRIBUTE_UNTICKED_VALUES_CLEARED" },
      orderBy: { timestamp: "desc" },
    });
    assert(untickAudit !== null, "AuditLog must record ATTRIBUTE_UNTICKED_VALUES_CLEARED");

    // Restore attribute link for HELMETS
    await prisma.itemGroupAttribute.upsert({
      where: { itemGroupId_attributeId: { itemGroupId: grpHelmets!.id, attributeId: attrColor!.id } },
      create: { itemGroupId: grpHelmets!.id, attributeId: attrColor!.id },
      update: {},
    });

    console.log("✔ Challenge 7: Item Group Unticked Attribute In-Use Protection PASSED");

    // =========================================================================
    // CHALLENGE 8: ROLE-BASED ACCESS CONTROL ON REMEDIATED ENDPOINTS
    // =========================================================================
    console.log("\n--- [CHALLENGE 8] Role-Based Access Control on Remediated Endpoints ---");

    const loginKeeper = await req("POST", "/api/auth/login", { employeeCode: "EMP-008", password: "password123" });
    assert(loginKeeper.status === 200 && !!loginKeeper.json.token, "Store Keeper login must succeed");
    const keeperToken = loginKeeper.json.token;

    // 1. Store Keeper cannot import catalog
    const emptyBlob = new Blob(["Item Code,Name EN\n"], { type: "text/csv" });
    const fdForbidden = new FormData();
    fdForbidden.append("file", emptyBlob, "test.csv");
    const keeperImport = await fetch(`${base}/api/ppe-items/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${keeperToken}` },
      body: fdForbidden,
    });
    assert(keeperImport.status === 403, `Store Keeper calling catalog import must receive 403, got ${keeperImport.status}`);

    // 2. Store Keeper cannot update attributes
    const keeperAttr = await req("PUT", `/api/attributes/${attrColor!.id}`, {
      code: "COLOR",
      nameEn: "Color",
      nameAr: "اللون",
      values: [],
    }, keeperToken);
    assert(keeperAttr.status === 403, `Store Keeper updating attributes must receive 403, got ${keeperAttr.status}`);

    // 3. Store Keeper cannot update locations
    const keeperLoc = await req("PUT", "/api/locations/loc-cai-new", {
      code: "LOC-CAI-NEW",
      nameEn: "Cairo Main Store",
      nameAr: "مستودع القاهرة الرئيسي",
      site: "Cairo Site",
      locationType: "Central Warehouse",
    }, keeperToken);
    assert(keeperLoc.status === 403, `Store Keeper updating locations must receive 403, got ${keeperLoc.status}`);

    console.log("✔ Challenge 8: Role-Based Access Control on Remediated Endpoints PASSED");

    // =========================================================================
    // CHALLENGE 9: CATALOG IMPORT BOUNDARIES & RESILIENCE
    // =========================================================================
    console.log("\n--- [CHALLENGE 9] Catalog Import Boundaries & Resilience ---");

    // 1. Completely empty CSV (0 rows)
    const zeroByteBlob = new Blob([""], { type: "text/csv" });
    const fdZero = new FormData();
    fdZero.append("file", zeroByteBlob, "empty.csv");
    const emptyImportRes = await fetch(`${base}/api/ppe-items/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: fdZero,
    });
    assert(emptyImportRes.status === 400, "Empty CSV file import must return HTTP 400");
    const emptyJson: any = await emptyImportRes.json();
    assert(
      (emptyJson.error || emptyJson.message || "").includes("contains no data rows"),
      "Error must state file contains no data rows"
    );

    // 2. Header only CSV (no rows)
    const headerOnlyBlob = new Blob(["Item Code,Name EN,Name AR\n"], { type: "text/csv" });
    const fdHeaderOnly = new FormData();
    fdHeaderOnly.append("file", headerOnlyBlob, "header_only.csv");
    const headerOnlyRes = await fetch(`${base}/api/ppe-items/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: fdHeaderOnly,
    });
    assert(headerOnlyRes.status === 400, "Header-only CSV must return HTTP 400");

    // 3. Request without file attachment
    const noFileRes = await fetch(`${base}/api/ppe-items/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: new FormData(),
    });
    assert(noFileRes.status === 400, "Import without file must return HTTP 400");

    console.log("✔ Challenge 9: Catalog Import Boundaries & Resilience PASSED");

    console.log(`\n=======================================================`);
    console.log(`🎉 ALL 9 EMPIRICAL ADVERSARIAL CHALLENGES PASSED (100%)`);
    console.log(`=======================================================\n`);

    server.close();
    await prisma.$disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ ADVERSARIAL CHALLENGE RUNNER TERMINATED WITH ERROR:", err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
});
