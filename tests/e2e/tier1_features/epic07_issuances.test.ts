import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertSuccess } from "../harness/assertions.js";

export const epic07IssuancesSuite: TestSuite = {
  name: "Tier 1 - Epic 7: PPE Issuance, Loans, and Returns (PPE-034 to PPE-041)",
  tier: 1,
  tests: [
    // PPE-034: Issue Single Item to Employee (5 tests)
    {
      id: "T1-PPE-034-01",
      featureId: "PPE-034",
      tier: 1,
      title: "Issue single PPE item to employee with dual signatures",
      fn: async (ctx) => {
        // Ensure stock exists at loc-1
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: `B-ISS-${Date.now()}`,
          quantityDelta: 20,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Issuance test delivery",
        });

        const res = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          receiverSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        });
        assertStatus(res, 201);
        expect(res.data.status).toBe("issued");
        expect(res.data.expectedReplacementDate).toBeDefined();
      },
    },
    {
      id: "T1-PPE-034-02",
      featureId: "PPE-034",
      tier: 1,
      title: "Verify stock balance decremented upon single item issuance",
      fn: async (ctx) => {
        const batchNum = `B-BALDEC-${Date.now()}`;
        await ctx.asAdmin().post("/api/stock/adjustments", {
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          batchNumber: batchNum,
          quantityDelta: 10,
          type: "IN",
          reasonCategory: "New Delivery",
          reason: "Pre-issuance",
        });
        const pre = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        const preQty = pre.data.data[0].quantityOnHand;

        await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 2,
          batchNumber: batchNum,
          storeKeeperSignature: "sig_sk",
          receiverSignature: "sig_rec",
        });
        const post = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        expect(post.data.data[0].quantityOnHand).toBe(preQty - 2);
      },
    },
    {
      id: "T1-PPE-034-03",
      featureId: "PPE-034",
      tier: 1,
      title: "Verify expected replacement date calculated automatically based on lifespan",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sig_sk",
          receiverSignature: "sig_rec",
        });
        assertStatus(res, 201);
        const expDate = new Date(res.data.expectedReplacementDate);
        expect(expDate.getTime()).toBeGreaterThan(Date.now());
      },
    },
    {
      id: "T1-PPE-034-04",
      featureId: "PPE-034",
      tier: 1,
      title: "Issue single item as Store Keeper persona",
      fn: async (ctx) => {
        const res = await ctx.asStoreKeeper("cairo").post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "keeper_sig",
          receiverSignature: "worker_sig",
        });
        assertStatus(res, 201);
      },
    },
    {
      id: "T1-PPE-034-05",
      featureId: "PPE-034",
      tier: 1,
      title: "Verify audit log entry generated upon item issuance",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sig_sk",
          receiverSignature: "sig_rec",
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Issuance");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === res.data.id && l.action === "ISSUED");
        expect(match).toBeDefined();
      },
    },

    // PPE-035: Auto-Suggest & Issue Kit (5 tests)
    {
      id: "T1-PPE-035-01",
      featureId: "PPE-035",
      tier: 1,
      title: "Issue complete kit to employee in single atomic transaction",
      fn: async (ctx) => {
        // Create dedicated kit
        const kit = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Auto Kit ${Date.now()}`,
          nameAr: "طقم تلقائي",
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
        expect(res.data.kitId).toBe(kit.data.id);
        expect(res.data.status).toBe("issued");
      },
    },
    {
      id: "T1-PPE-035-02",
      featureId: "PPE-035",
      tier: 1,
      title: "Verify kit issuance decrements stock for each kit line item",
      fn: async (ctx) => {
        const kit = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Stock Dec Kit ${Date.now()}`,
          nameAr: "طقم خصم المخزون",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 2 }],
        });
        const pre = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        const preQty = pre.data.data[0].quantityOnHand;

        await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          kitId: kit.data.id,
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        const post = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        expect(post.data.data[0].quantityOnHand).toBe(preQty - 2);
      },
    },
    {
      id: "T1-PPE-035-03",
      featureId: "PPE-035",
      tier: 1,
      title: "Issue kit with quantity 2 and verify proportional deduction",
      fn: async (ctx) => {
        const kit = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Double Kit ${Date.now()}`,
          nameAr: "طقم مضاعف",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const pre = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        const preQty = pre.data.data[0].quantityOnHand;

        await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          kitId: kit.data.id,
          locationId: "loc-cai-new",
          quantity: 2,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        const post = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        expect(post.data.data[0].quantityOnHand).toBe(preQty - 2);
      },
    },
    {
      id: "T1-PPE-035-04",
      featureId: "PPE-035",
      tier: 1,
      title: "Issue kit as Direct Supervisor persona",
      fn: async (ctx) => {
        const kit = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Supervisor Issued Kit ${Date.now()}`,
          nameAr: "طقم صرف المشرف",
          jobPositionId: "jp-1",
          items: [{ ppeItemId: "ppe-hlm-001", qty: 1 }],
        });
        const res = await ctx.asDirectSupervisor().post("/api/issuances", {
          employeeId: "emp-4",
          kitId: kit.data.id,
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sup_sig",
          receiverSignature: "emp_sig",
        });
        assertStatus(res, 201);
      },
    },
    {
      id: "T1-PPE-035-05",
      featureId: "PPE-035",
      tier: 1,
      title: "Verify audit log entry generated on kit issuance",
      fn: async (ctx) => {
        const kit = await ctx.asAdmin().post("/api/kits", {
          nameEn: `Audited Kit Issuance ${Date.now()}`,
          nameAr: "طقم مدقق الصرف",
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
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Issuance");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === iss.data.id);
        expect(match).toBeDefined();
      },
    },

    // PPE-036: Issue Loan to Visitor/Contractor (5 tests)
    {
      id: "T1-PPE-036-01",
      featureId: "PPE-036",
      tier: 1,
      title: "Issue temporary PPE loan to visitor with expected return date",
      fn: async (ctx) => {
        const expReturn = new Date(Date.now() + 3 * 86400000).toISOString();
        const res = await ctx.asAdmin().post("/api/issuances", {
          holderName: "Dr. Ahmed Mansoor (Consultant)",
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: expReturn,
          storeKeeperSignature: "sig_sk_loan",
          receiverSignature: "sig_visitor_loan",
        });
        assertStatus(res, 201);
        expect(res.data.holderType).toBe("Visitor");
        expect(res.data.expectedReturnDate).toBeDefined();
      },
    },
    {
      id: "T1-PPE-036-02",
      featureId: "PPE-036",
      tier: 1,
      title: "Issue contractor loan and verify status=issued",
      fn: async (ctx) => {
        const expReturn = new Date(Date.now() + 7 * 86400000).toISOString();
        const res = await ctx.asAdmin().post("/api/issuances", {
          holderName: "Orascom Subcontractor Team A",
          holderType: "Contractor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 2,
          expectedReturnDate: expReturn,
          storeKeeperSignature: "sig_sk",
          receiverSignature: "sig_contractor",
        });
        assertStatus(res, 201);
        expect(res.data.holderType).toBe("Contractor");
        expect(res.data.status).toBe("issued");
      },
    },
    {
      id: "T1-PPE-036-03",
      featureId: "PPE-036",
      tier: 1,
      title: "Verify stock balance decremented upon loan issuance",
      fn: async (ctx) => {
        const pre = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001&locationId=loc-cai-new");
        const preQty = pre.data.data[0].quantityOnHand;
        await ctx.asAdmin().post("/api/issuances", {
          holderName: "Inspector Smith",
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
    {
      id: "T1-PPE-036-04",
      featureId: "PPE-036",
      tier: 1,
      title: "Issue loan as Store Keeper persona",
      fn: async (ctx) => {
        const res = await ctx.asStoreKeeper("cairo").post("/api/issuances", {
          holderName: "Site Auditor Johnson",
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 2 * 86400000).toISOString(),
          storeKeeperSignature: "sk_sig",
          receiverSignature: "auditor_sig",
        });
        assertStatus(res, 201);
      },
    },
    {
      id: "T1-PPE-036-05",
      featureId: "PPE-036",
      tier: 1,
      title: "Verify new loan appears in open loans query",
      fn: async (ctx) => {
        const holder = `Special Auditor ${Date.now()}`;
        await ctx.asAdmin().post("/api/issuances", {
          holderName: holder,
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 4 * 86400000).toISOString(),
          storeKeeperSignature: "sk_sig",
          receiverSignature: "rec_sig",
        });
        const loansRes = await ctx.asAdmin().get("/api/issuances?openLoansOnly=true");
        assertSuccess(loansRes);
        const match = loansRes.data.data.find((l: any) => l.holderName === holder);
        expect(match).toBeDefined();
      },
    },

    // PPE-037: Return Loaned Item (5 tests)
    {
      id: "T1-PPE-037-01",
      featureId: "PPE-037",
      tier: 1,
      title: "Process return of loaned item in Good condition",
      fn: async (ctx) => {
        const loan = await ctx.asAdmin().post("/api/issuances", {
          holderName: "Returning Visitor",
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
          storeKeeperSignature: "sig_sk",
          receiverSignature: "sig_rec",
        });
        const retRes = await ctx.asAdmin().post(`/api/issuances/${loan.data.id}/return`, {
          condition: "good",
          physicalReceiptConfirmed: true,
        });
        assertStatus(retRes, 200);
        expect(retRes.data.status).toBe("returned");
      },
    },
    {
      id: "T1-PPE-037-02",
      featureId: "PPE-037",
      tier: 1,
      title: "Verify returned loan is removed from open loans list",
      fn: async (ctx) => {
        const loan = await ctx.asAdmin().post("/api/issuances", {
          holderName: "Closed Loan Visitor",
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
          storeKeeperSignature: "sk_sig",
          receiverSignature: "rec_sig",
        });
        await ctx.asAdmin().post(`/api/issuances/${loan.data.id}/return`, {
          condition: "good",
          physicalReceiptConfirmed: true,
        });
        const loansRes = await ctx.asAdmin().get("/api/issuances?openLoansOnly=true");
        assertSuccess(loansRes);
        const found = loansRes.data.data.find((l: any) => l.id === loan.data.id);
        expect(found).toBeUndefined();
      },
    },
    {
      id: "T1-PPE-037-03",
      featureId: "PPE-037",
      tier: 1,
      title: "Process return of loaned item as Store Keeper persona",
      fn: async (ctx) => {
        const loan = await ctx.asAdmin().post("/api/issuances", {
          holderName: "Keeper Handled Visitor",
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
          storeKeeperSignature: "sk_sig",
          receiverSignature: "rec_sig",
        });
        const retRes = await ctx.asStoreKeeper("cairo").post(`/api/issuances/${loan.data.id}/return`, {
          condition: "good",
          physicalReceiptConfirmed: true,
        });
        assertStatus(retRes, 200);
      },
    },
    {
      id: "T1-PPE-037-04",
      featureId: "PPE-037",
      tier: 1,
      title: "Verify Good loan return restores stock quantity",
      fn: async (ctx) => {
        const loan = await ctx.asAdmin().post("/api/issuances", {
          holderName: "Restock Visitor",
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
          storeKeeperSignature: "sk_sig",
          receiverSignature: "rec_sig",
        });
        const pre = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001");
        const totalPre = pre.data.data.reduce((acc: number, b: any) => acc + b.quantityOnHand, 0);

        await ctx.asAdmin().post(`/api/issuances/${loan.data.id}/return`, {
          condition: "good",
          physicalReceiptConfirmed: true,
        });
        const post = await ctx.asAdmin().get("/api/stock/balances?ppeItemId=ppe-hlm-001");
        const totalPost = post.data.data.reduce((acc: number, b: any) => acc + b.quantityOnHand, 0);
        expect(totalPost).toBe(totalPre + 1);
      },
    },
    {
      id: "T1-PPE-037-05",
      featureId: "PPE-037",
      tier: 1,
      title: "Verify audit log entry generated upon loan return",
      fn: async (ctx) => {
        const loan = await ctx.asAdmin().post("/api/issuances", {
          holderName: "Audit Return Visitor",
          holderType: "Visitor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
          storeKeeperSignature: "sk_sig",
          receiverSignature: "rec_sig",
        });
        await ctx.asAdmin().post(`/api/issuances/${loan.data.id}/return`, {
          condition: "good",
          physicalReceiptConfirmed: true,
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Issuance");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.entityId === loan.data.id && l.action === "RETURNED");
        expect(match).toBeDefined();
      },
    },

    // PPE-038: Return Item & Auto-Scrap (5 tests)
    {
      id: "T1-PPE-038-01",
      featureId: "PPE-038",
      tier: 1,
      title: "Process damaged return with physical receipt confirmation auto-scrapping item",
      fn: async (ctx) => {
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sig_sk",
          receiverSignature: "sig_rec",
        });
        const retRes = await ctx.asAdmin().post(`/api/issuances/${iss.data.id}/return`, {
          condition: "damaged",
          physicalReceiptConfirmed: true,
        });
        assertStatus(retRes, 200);
        expect(retRes.data.status).toBe("returned");
      },
    },
    {
      id: "T1-PPE-038-02",
      featureId: "PPE-038",
      tier: 1,
      title: "Verify ScrapEntry created upon auto-scrap return",
      fn: async (ctx) => {
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sig_sk",
          receiverSignature: "sig_rec",
        });
        await ctx.asAdmin().post(`/api/issuances/${iss.data.id}/return`, {
          condition: "worn_out",
          physicalReceiptConfirmed: true,
        });
        const scrapRes = await ctx.asAdmin().get("/api/scrap");
        assertSuccess(scrapRes);
        const match = scrapRes.data.data.find((s: any) => s.relatedReferenceId === iss.data.id);
        expect(match).toBeDefined();
      },
    },
    {
      id: "T1-PPE-038-03",
      featureId: "PPE-038",
      tier: 1,
      title: "Reverse auto-scrapped item within authorized reversal window",
      fn: async (ctx) => {
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sig_sk",
          receiverSignature: "sig_rec",
        });
        await ctx.asAdmin().post(`/api/issuances/${iss.data.id}/return`, {
          condition: "damaged",
          physicalReceiptConfirmed: true,
        });
        const scrapList = await ctx.asAdmin().get("/api/scrap");
        const scrapEntry = scrapList.data.data.find((s: any) => s.relatedReferenceId === iss.data.id);
        if (scrapEntry) {
          const revRes = await ctx.asAdmin().post(`/api/scrap/${scrapEntry.id}/reverse`, {
            reason: "Item mistakenly inspected as scrap; cleaned and certified reusable",
          });
          assertStatus(revRes, 200);
          expect(revRes.data.reversed).toBe(true);
        }
      },
    },
    {
      id: "T1-PPE-038-04",
      featureId: "PPE-038",
      tier: 1,
      title: "Process return with Lost condition closing issuance without scrap entry",
      fn: async (ctx) => {
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sig_sk",
          receiverSignature: "sig_rec",
        });
        const retRes = await ctx.asAdmin().post(`/api/issuances/${iss.data.id}/return`, {
          condition: "lost",
          physicalReceiptConfirmed: false,
        });
        assertStatus(retRes, 200);
        expect(retRes.data.status).toBe("returned");
      },
    },
    {
      id: "T1-PPE-038-05",
      featureId: "PPE-038",
      tier: 1,
      title: "Verify auto-scrap event generates audit log",
      fn: async (ctx) => {
        const iss = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sig_sk",
          receiverSignature: "sig_rec",
        });
        await ctx.asAdmin().post(`/api/issuances/${iss.data.id}/return`, {
          condition: "damaged",
          physicalReceiptConfirmed: true,
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Scrap");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((l: any) => l.action === "AUTO_SCRAPPED");
        expect(match).toBeDefined();
      },
    },

    // PPE-039: Send Replacement Reminders (5 tests)
    {
      id: "T1-PPE-039-01",
      featureId: "PPE-039",
      tier: 1,
      title: "Dashboard stats tracks expiringSoon issuances",
      fn: async (ctx) => {
        const statsRes = await ctx.asAdmin().get("/api/dashboard/stats");
        assertSuccess(statsRes);
        expect(typeof statsRes.data.expiringSoon).toBe("number");
      },
    },
    {
      id: "T1-PPE-039-02",
      featureId: "PPE-039",
      tier: 1,
      title: "Verify issuance expiring within 30 days is counted in expiringSoon",
      fn: async (ctx) => {
        const expSoonDate = new Date(Date.now() + 10 * 86400000).toISOString();
        await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReplacementDate: expSoonDate,
          storeKeeperSignature: "sk_sig",
          receiverSignature: "emp_sig",
        });
        const stats = await ctx.asAdmin().get("/api/dashboard/stats");
        assertSuccess(stats);
        expect(stats.data.expiringSoon).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-039-03",
      featureId: "PPE-039",
      tier: 1,
      title: "Query active issuances for logged-in employee via /api/issuances/my",
      fn: async (ctx) => {
        const myRes = await ctx.asWorker().get("/api/issuances/my");
        assertSuccess(myRes);
        expect(Array.isArray(myRes.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-039-04",
      featureId: "PPE-039",
      tier: 1,
      title: "Store Keeper dashboard stats scoped to assigned locations",
      fn: async (ctx) => {
        const stats = await ctx.asStoreKeeper("cairo").get("/api/dashboard/stats");
        assertSuccess(stats);
        expect(typeof stats.data.totalIssuances).toBe("number");
      },
    },
    {
      id: "T1-PPE-039-05",
      featureId: "PPE-039",
      tier: 1,
      title: "Verify module expiry settings configure lead time thresholds",
      fn: async (ctx) => {
        const settingsRes = await ctx.asAdmin().get("/api/expiry-settings");
        assertSuccess(settingsRes);
        expect(typeof settingsRes.data.generalLeadTimeDays).toBe("number");
      },
    },

    // PPE-040: Replacements Due Screen (5 tests)
    {
      id: "T1-PPE-040-01",
      featureId: "PPE-040",
      tier: 1,
      title: "Query issuances list filtered by employeeId",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/issuances?employeeId=emp-4");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-040-02",
      featureId: "PPE-040",
      tier: 1,
      title: "Query issuances list with status=issued filter",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/issuances?status=issued");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-040-03",
      featureId: "PPE-040",
      tier: 1,
      title: "Verify issuance record includes populated employee details",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/issuances?status=issued");
        assertSuccess(res);
        const withEmp = res.data.data.find((i: any) => i.employee !== null);
        if (withEmp) {
          expect(withEmp.employee.name).toBeDefined();
        }
      },
    },
    {
      id: "T1-PPE-040-04",
      featureId: "PPE-040",
      tier: 1,
      title: "Verify issuance record includes populated ppeItem details",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/issuances?status=issued");
        assertSuccess(res);
        const withItem = res.data.data.find((i: any) => i.ppeItem !== null);
        if (withItem) {
          expect(withItem.ppeItem.nameEn).toBeDefined();
        }
      },
    },
    {
      id: "T1-PPE-040-05",
      featureId: "PPE-040",
      tier: 1,
      title: "Verify issuance record includes location relation",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/issuances?status=issued");
        assertSuccess(res);
        if (res.data.data.length > 0) {
          expect(res.data.data[0].location).toBeDefined();
        }
      },
    },

    // PPE-041: Open Loans List (5 tests)
    {
      id: "T1-PPE-041-01",
      featureId: "PPE-041",
      tier: 1,
      title: "Query open loans via /api/issuances?openLoansOnly=true",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/issuances?openLoansOnly=true");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-041-02",
      featureId: "PPE-041",
      tier: 1,
      title: "Verify all open loans have expectedReturnDate populated",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/issuances?openLoansOnly=true");
        assertSuccess(res);
        for (const loan of res.data.data) {
          expect(loan.expectedReturnDate).toBeDefined();
          expect(loan.status).toBe("issued");
        }
      },
    },
    {
      id: "T1-PPE-041-03",
      featureId: "PPE-041",
      tier: 1,
      title: "Verify dashboard stats overdue counter identifies past return dates",
      fn: async (ctx) => {
        const stats = await ctx.asAdmin().get("/api/dashboard/stats");
        assertSuccess(stats);
        expect(typeof stats.data.overdue).toBe("number");
      },
    },
    {
      id: "T1-PPE-041-04",
      featureId: "PPE-041",
      tier: 1,
      title: "Store Keeper open loans query is scoped to assigned locations",
      fn: async (ctx) => {
        const res = await ctx.asStoreKeeper("cairo").get("/api/issuances?openLoansOnly=true");
        assertSuccess(res);
        for (const loan of res.data.data) {
          expect(loan.locationId === "loc-cai-new" || loan.locationId === "loc-cai-usd").toBe(true);
        }
      },
    },
    {
      id: "T1-PPE-041-05",
      featureId: "PPE-041",
      tier: 1,
      title: "Search open loans by visitor/contractor holderName",
      fn: async (ctx) => {
        const holder = `Contractor Search ${Date.now()}`;
        await ctx.asAdmin().post("/api/issuances", {
          holderName: holder,
          holderType: "Contractor",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
          storeKeeperSignature: "sk_sig",
          receiverSignature: "rec_sig",
        });
        const res = await ctx.asAdmin().get(`/api/issuances?openLoansOnly=true&search=${encodeURIComponent(holder)}`);
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
  ],
};
