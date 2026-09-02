import { createApp } from "./src/app.js";
import { prisma } from "./src/lib/prisma.js";
import bcrypt from "bcryptjs";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ CHALLENGER DEEP ASSERTION FAILED: ${msg}`);
    throw new Error(`Challenger deep assertion failed: ${msg}`);
  }
}

const app = createApp();
const server = app.listen(0, async () => {
  const addr: any = server.address();
  const base = `http://localhost:${addr.port}`;
  console.log(`Starting Milestone 1 Deep Adversarial Harness on ${base}`);

  async function req(method: string, path: string, body?: any, token?: string) {
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  }

  try {
    // -------------------------------------------------------------------------
    // 0. AUTHENTICATION SETUP
    // -------------------------------------------------------------------------
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

    console.log("✔ [Phase 0] All 5 role personas successfully authenticated");

    // -------------------------------------------------------------------------
    // 1. RULE G2: PPE ITEM IN-USE PROTECTION & ADMIN OVERRIDE ADVERSARIAL STRESS
    // -------------------------------------------------------------------------
    console.log("\n--- [Phase 1] Rule G2: In-Use PPE Item Protection & Admin Override ---");

    const auditCountInitial = await prisma.auditLog.count({
      where: { entityType: "PPEItem", action: { in: ["OVERRIDE_DELETE", "OVERRIDE_DEACTIVATE"] } },
    });

    // 1.1 Unprivileged roles (Employee, Store Keeper) attempting delete -> 403 Forbidden
    const empDel = await req("DELETE", "/api/ppe-items/ppe-hlm-001", { adminOverrideReason: "Override attempt" }, empToken);
    assert(empDel.status === 403, `Employee deleting PPE item must be 403 (got ${empDel.status})`);

    const skDel = await req("DELETE", "/api/ppe-items/ppe-hlm-001", { adminOverrideReason: "Override attempt" }, keeperToken);
    assert(skDel.status === 403, `Store Keeper deleting PPE item must be 403 (got ${skDel.status})`);

    // 1.2 HSE Supervisor (authorized for master data, but not Admin) attempting delete without override -> 400
    const hseDelNoOverride = await req("DELETE", "/api/ppe-items/ppe-hlm-001", {}, hseToken);
    assert(hseDelNoOverride.status === 400, `HSE Supervisor deleting in-use item without override must be 400 (got ${hseDelNoOverride.status})`);

    // 1.3 HSE Supervisor attempting delete WITH override reason -> MUST BE BLOCKED (400)
    const hseDelWithOverride = await req("DELETE", "/api/ppe-items/ppe-hlm-001", { adminOverrideReason: "Emergency HSE decommissioning" }, hseToken);
    assert(hseDelWithOverride.status === 400, `HSE Supervisor with override reason MUST be rejected (got ${hseDelWithOverride.status})`);
    assert(
      hseDelWithOverride.json.error?.includes("Cannot delete in-use PPE item without Admin override") ||
      hseDelWithOverride.json.message?.includes("Cannot delete in-use PPE item without Admin override"),
      "Error must explicitly specify that only Admin can override in-use deletion"
    );

    // 1.4 Admin attempting delete without override reason -> 400
    const adminDelNoReason = await req("DELETE", "/api/ppe-items/ppe-hlm-001", {}, adminToken);
    assert(adminDelNoReason.status === 400, "Admin deleting in-use item without reason must be 400");

    // 1.5 Admin attempting delete with empty string override reason -> 400
    const adminDelEmpty = await req("DELETE", "/api/ppe-items/ppe-hlm-001", { adminOverrideReason: "" }, adminToken);
    assert(adminDelEmpty.status === 400, "Admin deleting in-use item with empty string reason must be 400");

    // 1.6 Admin attempting delete with whitespace-only override reason -> 400
    const adminDelWhitespace = await req("DELETE", "/api/ppe-items/ppe-hlm-001", { adminOverrideReason: "   \t\n   " }, adminToken);
    assert(adminDelWhitespace.status === 400, "Admin deleting in-use item with whitespace reason must be 400");

    // 1.7 HSE Supervisor attempting deactivation with override -> MUST BE BLOCKED (400)
    const hseDeactWithOverride = await req("PATCH", "/api/ppe-items/ppe-hlm-001/active", { active: false, adminOverrideReason: "HSE deactivation" }, hseToken);
    assert(hseDeactWithOverride.status === 400, "HSE Supervisor deactivating in-use item with override must be 400");

    // 1.8 Admin attempting deactivation with blank reason -> 400
    const adminDeactBlank = await req("PATCH", "/api/ppe-items/ppe-hlm-001/active", { active: false, adminOverrideReason: "    " }, adminToken);
    assert(adminDeactBlank.status === 400, "Admin deactivating in-use item with blank reason must be 400");

    // 1.9 Ensure NO AuditLog was recorded for any of the above rejected attempts
    const auditCountAfterRejections = await prisma.auditLog.count({
      where: { entityType: "PPEItem", action: { in: ["OVERRIDE_DELETE", "OVERRIDE_DEACTIVATE"] } },
    });
    assert(auditCountAfterRejections === auditCountInitial, "No AuditLog entries must be written for failed override attempts");

    // 1.10 Valid Admin override deactivation -> 200 OK & AuditLog written
    const validDeactReason = "Valid test deactivation for safety recall";
    const adminDeactValid = await req("PATCH", "/api/ppe-items/ppe-hlm-001/active", { active: false, adminOverrideReason: validDeactReason }, adminToken);
    assert(adminDeactValid.status === 200 && adminDeactValid.json.active === false, "Admin valid override deactivation must succeed (200)");

    const deactLog = await prisma.auditLog.findFirst({
      where: { entityType: "PPEItem", entityId: "ppe-hlm-001", action: "OVERRIDE_DEACTIVATE" },
      orderBy: { timestamp: "desc" },
    });
    assert(deactLog !== null, "AuditLog for OVERRIDE_DEACTIVATE must exist");
    assert(deactLog?.reason === validDeactReason, "AuditLog reason must match provided reason");
    assert(deactLog?.performedBy === "emp-1", "AuditLog performer must be Admin emp-1");

    // Re-activate item
    await req("PATCH", "/api/ppe-items/ppe-hlm-001/active", { active: true }, adminToken);

    // 1.11 Valid Admin override deletion -> 200 OK & AuditLog written
    const validDelReason = "Valid test decommissioning authorized by Admin";
    const adminDelValid = await req("DELETE", "/api/ppe-items/ppe-hlm-001", { adminOverrideReason: validDelReason }, adminToken);
    assert(adminDelValid.status === 200, "Admin valid override deletion must succeed (200)");

    const delLog = await prisma.auditLog.findFirst({
      where: { entityType: "PPEItem", entityId: "ppe-hlm-001", action: "OVERRIDE_DELETE" },
      orderBy: { timestamp: "desc" },
    });
    assert(delLog !== null, "AuditLog for OVERRIDE_DELETE must exist");
    assert(delLog?.reason === validDelReason, "AuditLog reason must match provided reason");
    assert(delLog?.performedBy === "emp-1", "AuditLog performer must be Admin emp-1");

    // Restore item
    await req("POST", "/api/ppe-items/ppe-hlm-001/restore", undefined, adminToken);

    console.log("✔ [Phase 1] Rule G2 in-use PPE item deletion & deactivation adversarial tests passed");

    // -------------------------------------------------------------------------
    // 2. RULE G2: MASTER DATA ENTITIES (JOB POSITION, ITEM GROUP, ATTRIBUTE, KIT)
    // -------------------------------------------------------------------------
    console.log("\n--- [Phase 2] Rule G2: In-Use Master Entities Override Protection ---");

    // 2.1 Job Position in-use deletion:
    const hseJp = await req("DELETE", "/api/job-positions/jp-1", { adminOverrideReason: "HSE override" }, hseToken);
    assert(hseJp.status === 400, "HSE Supervisor cannot override in-use Job Position delete");
    const adminJpBlank = await req("DELETE", "/api/job-positions/jp-1", { adminOverrideReason: "   " }, adminToken);
    assert(adminJpBlank.status === 400, "Admin cannot delete in-use Job Position with blank reason");

    // 2.2 Item Group in-use deletion:
    const hseGrp = await req("DELETE", "/api/item-groups/grp-helmets", { adminOverrideReason: "HSE override" }, hseToken);
    assert(hseGrp.status === 400, "HSE Supervisor cannot override in-use Item Group delete");
    const adminGrpBlank = await req("DELETE", "/api/item-groups/grp-helmets", { adminOverrideReason: "   " }, adminToken);
    assert(adminGrpBlank.status === 400, "Admin cannot delete in-use Item Group with blank reason");

    // 2.3 Attribute in-use deletion:
    const hseAttr = await req("DELETE", "/api/attributes/attr-color", { adminOverrideReason: "HSE override" }, hseToken);
    assert(hseAttr.status === 400, "HSE Supervisor cannot override in-use Attribute delete");
    const adminAttrBlank = await req("DELETE", "/api/attributes/attr-color", { adminOverrideReason: "   " }, adminToken);
    assert(adminAttrBlank.status === 400, "Admin cannot delete in-use Attribute with blank reason");

    // 2.4 Kit in-use deletion:
    // Create an issuance linked to kit-elec to ensure it is in-use
    const kitIss = await prisma.issuance.create({
      data: {
        id: "iss-kit-deep-test",
        employeeId: "emp-4",
        kitId: "kit-elec",
        locationId: "loc-cai-new",
        quantity: 1,
        issueDate: new Date(),
        status: "issued",
        issuedBy: "emp-1",
      },
    });

    const hseKit = await req("DELETE", "/api/kits/kit-elec", { adminOverrideReason: "HSE override" }, hseToken);
    assert(hseKit.status === 400, "HSE Supervisor cannot override in-use Kit delete (400)");
    const adminKitBlank = await req("DELETE", "/api/kits/kit-elec", { adminOverrideReason: "   " }, adminToken);
    assert(adminKitBlank.status === 400, "Admin cannot delete in-use Kit with blank reason (400)");

    // Cleanup test issuance
    await prisma.issuance.delete({ where: { id: kitIss.id } });

    console.log("✔ [Phase 2] Master data in-use protection and override restrictions verified");

    // -------------------------------------------------------------------------
    // 3. RULE G2: LOCATION HOLDING STOCK HARD BLOCK & SCRAP EXEMPTION
    // -------------------------------------------------------------------------
    console.log("\n--- [Phase 3] Rule G2: Location Holding Stock Hard Block & Scrap Exemption ---");

    // 3.1 Hard block on deleting location holding stock (loc-cai-new, non-scrap):
    // Even Admin providing adminOverrideReason MUST BE HARD BLOCKED!
    const adminDelStockLoc = await req("DELETE", "/api/locations/loc-cai-new", {
      adminOverrideReason: "Executive Board mandate to close Cairo warehouse immediately",
    }, adminToken);
    assert(adminDelStockLoc.status === 400, "Admin delete of location holding stock MUST be hard blocked even with override (400)");
    assert(
      adminDelStockLoc.json.error?.includes("Cannot deactivate or delete location holding stock") ||
      adminDelStockLoc.json.message?.includes("Cannot deactivate or delete location holding stock"),
      "Hard block error message must be returned"
    );

    // Verify DB integrity: location is neither deleted nor deactivated
    const locDb = await prisma.location.findUnique({ where: { id: "loc-cai-new" } });
    assert(locDb !== null && locDb.deletedAt === null && locDb.active === true, "Location holding stock must remain intact in DB");

    // 3.2 Hard block on deactivating location holding stock:
    const adminDeactStockLoc = await req("PATCH", "/api/locations/loc-cai-new/active", {
      active: false,
      adminOverrideReason: "Executive deactivation request",
    }, adminToken);
    assert(adminDeactStockLoc.status === 400, "Admin deactivation of location holding stock MUST be hard blocked even with override (400)");

    // 3.3 Scrap location holding stock exemption:
    // loc-cai-scr holds stock, but has stockCondition = 'Scrap'
    const deactScrap = await req("PATCH", "/api/locations/loc-cai-scr/active", { active: false }, adminToken);
    assert(deactScrap.status === 200 && deactScrap.json.active === false, "Scrap location holding stock MUST be exempt from hard block on deactivation");

    const reactScrap = await req("PATCH", "/api/locations/loc-cai-scr/active", { active: true }, adminToken);
    assert(reactScrap.status === 200 && reactScrap.json.active === true, "Scrap location reactivation must succeed");

    // 3.4 Sole location of active catalog item hard block:
    const uniqueSuffix = Date.now().toString().slice(-6);
    const soleLoc = await req("POST", "/api/locations", {
      code: `LOC-SOLE-${uniqueSuffix}`,
      nameEn: "Sole Location Deep Test",
      nameAr: "موقع اختباري وحيد عميق",
      site: "Cairo Site",
      locationType: "Site Store",
      stockCondition: "New",
      capacityUnits: 100,
    }, adminToken);
    assert(soleLoc.status === 201, "Creating empty test location must succeed");

    const soleItem = await req("POST", "/api/ppe-items", {
      itemCode: `PPE-SOLE-${uniqueSuffix}`,
      nameEn: "Sole Item Deep",
      nameAr: "عنصر وحيد عميق",
      category: "Head Protection",
      itemGroupId: "grp-helmets",
      hasSize: false,
      gender: "Unisex",
      lifespanType: "Years",
      lifespanValue: 2,
      riskCategory: "II",
      reorderLevel: 5,
      uom: "EA",
      locationIds: [soleLoc.json.id],
      variantAttributeValueIds: [],
    }, adminToken);
    assert(soleItem.status === 201, "Creating sole-assigned item must succeed");

    // Attempt deactivation of soleLoc -> MUST BE BLOCKED
    const deactSole = await req("PATCH", `/api/locations/${soleLoc.json.id}/active`, { active: false }, adminToken);
    assert(deactSole.status === 400, "Deactivating sole location of active PPE Item must be blocked (400)");

    // Attempt delete of soleLoc -> MUST BE BLOCKED
    const delSole = await req("DELETE", `/api/locations/${soleLoc.json.id}`, {}, adminToken);
    assert(delSole.status === 400, "Deleting sole location of active PPE Item must be blocked (400)");

    // Cleanup sole test artifacts
    await req("DELETE", `/api/ppe-items/${soleItem.json.id}`, { adminOverrideReason: "Cleanup test item" }, adminToken);
    await prisma.pPEItemLocation.deleteMany({ where: { ppeItemId: soleItem.json.id } });
    await prisma.pPEItem.delete({ where: { id: soleItem.json.id } });
    await req("DELETE", `/api/locations/${soleLoc.json.id}`, {}, adminToken);

    console.log("✔ [Phase 3] Location holding stock hard blocks, scrap exemption, and sole location protections verified");

    // -------------------------------------------------------------------------
    // 4. RULE G6: LOCATION CODE & STOCK CONDITION IMMUTABILITY
    // -------------------------------------------------------------------------
    console.log("\n--- [Phase 4] Rule G6: Location Code & Stock Condition Immutability ---");

    // 4.1 Location holding stock: change code -> 400 BLOCKED
    const changeCodeAttempt = await req("PUT", "/api/locations/loc-cai-new", {
      code: "LOC-CHANGED-ATTEMPT",
      nameEn: "Cairo Main Store",
      nameAr: "مستودع القاهرة الرئيسي",
      site: "Cairo Site",
      locationType: "Central Warehouse",
      stockCondition: "New",
      capacityUnits: 500,
    }, adminToken);
    assert(changeCodeAttempt.status === 400, "Changing code of location holding stock must be blocked with HTTP 400");
    assert(
      changeCodeAttempt.json.error?.includes("Location code is locked") ||
      changeCodeAttempt.json.message?.includes("Location code is locked"),
      "Error message must state code is locked"
    );

    // 4.2 Location holding stock: change stockCondition New -> Used -> 400 BLOCKED
    const changeConditionAttempt = await req("PUT", "/api/locations/loc-cai-new", {
      code: "LOC-CAI-NEW",
      nameEn: "Cairo Main Store",
      nameAr: "مستودع القاهرة الرئيسي",
      site: "Cairo Site",
      locationType: "Central Warehouse",
      stockCondition: "Used",
      capacityUnits: 500,
    }, adminToken);
    assert(changeConditionAttempt.status === 400, "Changing condition of location holding stock must be blocked with HTTP 400");
    assert(
      changeConditionAttempt.json.error?.includes("Stock condition is locked") ||
      changeConditionAttempt.json.message?.includes("Stock condition is locked"),
      "Error message must state condition is locked"
    );

    // 4.3 Location with NO stock: code and condition changes MUST BE PERMITTED
    const emptyLoc = await req("POST", "/api/locations", {
      code: `LOC-MUT-${uniqueSuffix}`,
      nameEn: "Mutation Test Location",
      nameAr: "موقع اختبار التعديل",
      site: "Alexandria Site",
      locationType: "Site Store",
      stockCondition: "New",
      capacityUnits: 80,
    }, adminToken);
    assert(emptyLoc.status === 201, "Creating empty test location must succeed");

    const modifyEmpty = await req("PUT", `/api/locations/${emptyLoc.json.id}`, {
      code: `LOC-MOD-${uniqueSuffix}`,
      nameEn: "Mutation Test Location Modified",
      nameAr: "موقع اختبار التعديل المعدل",
      site: "Alexandria Site",
      locationType: "Site Store",
      stockCondition: "Used",
      capacityUnits: 90,
    }, adminToken);
    assert(modifyEmpty.status === 200, "Modifying code and stockCondition on empty location MUST be allowed before stock exists");
    assert(modifyEmpty.json.code === `LOC-MOD-${uniqueSuffix}`, "Code update persisted");
    assert(modifyEmpty.json.stockCondition === "Used", "Condition update persisted");

    // Cleanup empty test location
    await req("DELETE", `/api/locations/${emptyLoc.json.id}`, {}, adminToken);

    console.log("✔ [Phase 4] Location code and condition immutability verified");

    // -------------------------------------------------------------------------
    // 5. ROLE SCOPING: STORE KEEPER EDGE CASES
    // -------------------------------------------------------------------------
    console.log("\n--- [Phase 5] Store Keeper Scoping & Edge Cases ---");

    // 5.1 Assigned Store Keeper (Sam EMP-008):
    const keeperLocs = await req("GET", "/api/locations", undefined, keeperToken);
    assert(keeperLocs.status === 200, "Store Keeper locations query must succeed");
    const dbLinks = await prisma.locationStoreKeeper.findMany({
      where: { employeeId: "emp-8" },
      select: { locationId: true },
    });
    const assignedIds = dbLinks.map((l: any) => l.locationId);
    assert(
      keeperLocs.json.data.every((l: any) => assignedIds.includes(l.id)),
      "Store Keeper list must contain ONLY locations mapped to emp-8 in LocationStoreKeeper"
    );
    assert(
      !keeperLocs.json.data.some((l: any) => l.id.startsWith("loc-alx")),
      "Alexandria locations must NEVER appear in Sam's location list"
    );

    // Access unassigned location -> 403 Forbidden
    const unassignedDetail = await req("GET", "/api/locations/loc-alx-new", undefined, keeperToken);
    assert(unassignedDetail.status === 403, "Store Keeper accessing unassigned location detail must receive 403 Forbidden");

    // Access assigned location -> 200 OK
    const assignedDetail = await req("GET", "/api/locations/loc-cai-new", undefined, keeperToken);
    assert(assignedDetail.status === 200, "Store Keeper accessing assigned location detail must succeed (200)");

    // 5.2 UNASSIGNED Store Keeper Edge Case:
    const pwHash = await bcrypt.hash("password123", 10);
    const unassignedKeeper = await prisma.employee.create({
      data: {
        id: `emp-sk-unassigned-${uniqueSuffix}`,
        employeeCode: `EMP-SK-${uniqueSuffix}`,
        name: "Unassigned Keeper Deep",
        gender: "Male",
        employmentStatus: "Active",
        department: "Logistics",
        site: "Floating",
        jobPositionId: "jp-5",
        role: "Store_Keeper",
        passwordHash: pwHash,
        active: true,
      },
    });

    const loginUnassignedKeeper = await req("POST", "/api/auth/login", {
      employeeCode: `EMP-SK-${uniqueSuffix}`,
      password: "password123",
    });
    assert(loginUnassignedKeeper.status === 200 && !!loginUnassignedKeeper.json.token, "Unassigned Keeper login must succeed");
    const unassignedKeeperToken = loginUnassignedKeeper.json.token;

    // List query for unassigned keeper MUST return empty array (0 locations)
    const unassignedList = await req("GET", "/api/locations", undefined, unassignedKeeperToken);
    assert(unassignedList.status === 200, "Querying locations as unassigned keeper must return 200");
    assert(unassignedList.json.data.length === 0, "Unassigned Store Keeper MUST receive empty data list (0 locations)");

    // Detail query for any location -> 403 Forbidden
    const unassignedQueryCairo = await req("GET", "/api/locations/loc-cai-new", undefined, unassignedKeeperToken);
    assert(unassignedQueryCairo.status === 403, "Unassigned Store Keeper must receive 403 for Cairo location");

    const unassignedQueryAlex = await req("GET", "/api/locations/loc-alx-new", undefined, unassignedKeeperToken);
    assert(unassignedQueryAlex.status === 403, "Unassigned Store Keeper must receive 403 for Alexandria location");

    // Stock balances query for unassigned keeper MUST return empty array
    const unassignedStock = await req("GET", "/api/stock/balances", undefined, unassignedKeeperToken);
    assert(unassignedStock.status === 200 && unassignedStock.json.data.length === 0, "Unassigned Store Keeper must receive 0 stock balances");

    // Cleanup unassigned keeper
    await prisma.employee.delete({ where: { id: unassignedKeeper.id } });

    console.log("✔ [Phase 5] Store Keeper location scoping and unassigned edge cases verified");

    // -------------------------------------------------------------------------
    // 6. ROLE SCOPING: DIRECT SUPERVISOR EDGE CASES
    // -------------------------------------------------------------------------
    console.log("\n--- [Phase 6] Direct Supervisor Team Scoping & Edge Cases ---");

    // 6.1 Direct Supervisor Sarah (EMP-003):
    const supervisorList = await req("GET", "/api/employees", undefined, supervisorToken);
    assert(supervisorList.status === 200, "Direct Supervisor employee query must succeed");
    assert(
      supervisorList.json.data.length > 0 &&
      supervisorList.json.data.every((e: any) => e.supervisor?.id === "emp-3" || e.id === "emp-3"),
      "Direct Supervisor must ONLY see team members"
    );

    // Direct Supervisor accessing subordinate detail & timeline -> 200 OK
    const subDetail = await req("GET", "/api/employees/emp-4", undefined, supervisorToken);
    assert(subDetail.status === 200 && subDetail.json.id === "emp-4", "Supervisor accessing subordinate detail must succeed");

    const subTimeline = await req("GET", "/api/employees/emp-4/timeline", undefined, supervisorToken);
    assert(subTimeline.status === 200 && Array.isArray(subTimeline.json.data), "Supervisor accessing subordinate timeline must succeed");

    // Direct Supervisor accessing self detail & timeline -> 200 OK
    const selfDetail = await req("GET", "/api/employees/emp-3", undefined, supervisorToken);
    assert(selfDetail.status === 200 && selfDetail.json.id === "emp-3", "Supervisor accessing self detail must succeed");

    const selfTimeline = await req("GET", "/api/employees/emp-3/timeline", undefined, supervisorToken);
    assert(selfTimeline.status === 200 && Array.isArray(selfTimeline.json.data), "Supervisor accessing self timeline must succeed");

    // Direct Supervisor accessing non-subordinate detail & timeline -> 403 Forbidden
    const nonSubDetail = await req("GET", "/api/employees/emp-8", undefined, supervisorToken);
    assert(nonSubDetail.status === 403, "Supervisor accessing non-subordinate detail must receive 403 Forbidden");

    const nonSubTimeline = await req("GET", "/api/employees/emp-8/timeline", undefined, supervisorToken);
    assert(nonSubTimeline.status === 403, "Supervisor accessing non-subordinate timeline must receive 403 Forbidden");

    const adminProfileAccess = await req("GET", "/api/employees/emp-1", undefined, supervisorToken);
    assert(adminProfileAccess.status === 403, "Supervisor accessing Admin profile must receive 403 Forbidden");

    // 6.2 UNASSIGNED Direct Supervisor (0 subordinates) Edge Case:
    const unassignedDs = await prisma.employee.create({
      data: {
        id: `emp-ds-unassigned-${uniqueSuffix}`,
        employeeCode: `EMP-DS-${uniqueSuffix}`,
        name: "Unassigned Supervisor Deep",
        gender: "Female",
        employmentStatus: "Active",
        department: "Safety Inspection",
        site: "Cairo Site",
        jobPositionId: "jp-2",
        role: "Direct_Supervisor",
        passwordHash: pwHash,
        active: true,
      },
    });

    const loginUnassignedDs = await req("POST", "/api/auth/login", {
      employeeCode: `EMP-DS-${uniqueSuffix}`,
      password: "password123",
    });
    assert(loginUnassignedDs.status === 200 && !!loginUnassignedDs.json.token, "Unassigned Supervisor login must succeed");
    const unassignedDsToken = loginUnassignedDs.json.token;

    // List query for unassigned supervisor MUST return empty array
    const unassignedDsList = await req("GET", "/api/employees", undefined, unassignedDsToken);
    assert(unassignedDsList.status === 200, "Unassigned Supervisor listing employees must succeed");
    assert(unassignedDsList.json.data.length === 0, "Unassigned Supervisor must receive empty employee list (0 subordinates)");

    // Accessing any other employee -> 403 Forbidden
    const unassignedDsOther = await req("GET", "/api/employees/emp-4", undefined, unassignedDsToken);
    assert(unassignedDsOther.status === 403, "Unassigned Supervisor accessing other employee must receive 403");

    // Accessing self -> 200 OK
    const unassignedDsSelf = await req("GET", `/api/employees/${unassignedDs.id}`, undefined, unassignedDsToken);
    assert(unassignedDsSelf.status === 200 && unassignedDsSelf.json.id === unassignedDs.id, "Unassigned Supervisor accessing self must succeed");

    // Accessing self timeline -> 200 OK
    const unassignedDsSelfTl = await req("GET", `/api/employees/${unassignedDs.id}/timeline`, undefined, unassignedDsToken);
    assert(unassignedDsSelfTl.status === 200, "Unassigned Supervisor accessing self timeline must succeed");

    // Cleanup unassigned supervisor
    await prisma.employee.delete({ where: { id: unassignedDs.id } });

    // 6.3 Administrative Boundary Checks:
    const dsDelEmp = await req("DELETE", "/api/employees/emp-4", {}, supervisorToken);
    assert(dsDelEmp.status === 403, "Direct Supervisor cannot delete employees (403 Forbidden)");

    const dsAudit = await req("GET", "/api/audit-logs", undefined, supervisorToken);
    assert(dsAudit.status === 403, "Direct Supervisor cannot read audit logs (403 Forbidden)");

    const empAudit = await req("GET", "/api/audit-logs", undefined, empToken);
    assert(empAudit.status === 403, "Employee cannot read audit logs (403 Forbidden)");

    console.log("✔ [Phase 6] Direct Supervisor team scoping and unassigned edge cases verified");

    // -------------------------------------------------------------------------
    // 7. AUDIT TRAIL IMMUTABILITY & RETENTION VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n--- [Phase 7] Audit Trail Invariants & Schema Conformance ---");
    const sampleAudits = await prisma.auditLog.findMany({ take: 10 });
    assert(sampleAudits.length > 0, "Audit logs must exist");
    for (const log of sampleAudits) {
      assert(typeof log.entityType === "string" && log.entityType.length > 0, "AuditLog entityType required");
      assert(typeof log.action === "string" && log.action.length > 0, "AuditLog action required");
      assert(typeof log.performedBy === "string" && log.performedBy.length > 0, "AuditLog performedBy required");
      assert(log.retentionFlag === "7_YEARS", "AuditLog retentionFlag must be 7_YEARS");
      assert(log.source === "Screen" || log.source === "Import" || log.source === "System Job", "AuditLog source must be valid");
    }

    console.log("✔ [Phase 7] Audit log invariants and 7-year retention flag verified");

    console.log("\n=================================================================");
    console.log("🎉 ALL MILESTONE 1 DEEP ADVERSARIAL STRESS TESTS PASSED (100%)");
    console.log("=================================================================\n");

    server.close();
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Adversarial deep stress test failure:", err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
});
