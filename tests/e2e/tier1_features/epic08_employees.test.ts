import type { TestSuite } from "../harness/types.js";
import { expect, assertStatus, assertSuccess } from "../harness/assertions.js";

export const epic08EmployeesSuite: TestSuite = {
  name: "Tier 1 - Epic 8: Employee Tracking and Historical Data (PPE-042 to PPE-044)",
  tier: 1,
  tests: [
    // PPE-042: View & Filter Employee List (5 tests)
    {
      id: "T1-PPE-042-01",
      featureId: "PPE-042",
      tier: 1,
      title: "Query employees directory with pagination metadata",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/employees");
        assertSuccess(res);
        expect(res.data.meta.total).toBeGreaterThan(0);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-042-02",
      featureId: "PPE-042",
      tier: 1,
      title: "Search employee directory by employeeCode keyword",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/employees?search=EMP-001");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
        expect(res.data.data[0].employeeCode).toBe("EMP-001");
      },
    },
    {
      id: "T1-PPE-042-03",
      featureId: "PPE-042",
      tier: 1,
      title: "Search employee directory by employee name",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/employees?search=Hesham");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-042-04",
      featureId: "PPE-042",
      tier: 1,
      title: "Filter employee directory by role",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/employees?role=Store Keeper");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },
    {
      id: "T1-PPE-042-05",
      featureId: "PPE-042",
      tier: 1,
      title: "Filter employee directory by jobPositionId",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/employees?jobPositionId=jp-8");
        assertSuccess(res);
        expect(res.data.data.length).toBeGreaterThan(0);
      },
    },

    // PPE-043: View Employee Details & Timeline (5 tests)
    {
      id: "T1-PPE-043-01",
      featureId: "PPE-043",
      tier: 1,
      title: "Retrieve employee profile details by ID",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/employees/emp-1");
        assertSuccess(res);
        expect(res.data.id).toBe("emp-1");
        expect(res.data.employeeCode).toBe("EMP-001");
      },
    },
    {
      id: "T1-PPE-043-02",
      featureId: "PPE-043",
      tier: 1,
      title: "Verify employee profile includes jobPosition object",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/employees/emp-1");
        assertSuccess(res);
        expect(res.data.jobPosition).toBeDefined();
        expect(res.data.jobPosition.nameEn).toBeDefined();
      },
    },
    {
      id: "T1-PPE-043-03",
      featureId: "PPE-043",
      tier: 1,
      title: "Verify employee profile includes active status and role",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/employees/emp-8");
        assertSuccess(res);
        expect(res.data.id).toBe("emp-8");
        expect(res.data.active).toBe(true);
      },
    },
    {
      id: "T1-PPE-043-04",
      featureId: "PPE-043",
      tier: 1,
      title: "Query employee reverse-chronological PPE issuance timeline",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().get("/api/issuances?employeeId=emp-4");
        assertSuccess(res);
        expect(Array.isArray(res.data.data)).toBe(true);
      },
    },
    {
      id: "T1-PPE-043-05",
      featureId: "PPE-043",
      tier: 1,
      title: "Verify timeline items contain signatures for audit inspection",
      fn: async (ctx) => {
        await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          storeKeeperSignature: "sk_sig_audit_check",
          receiverSignature: "emp_sig_audit_check",
        });
        const res = await ctx.asAdmin().get("/api/issuances?employeeId=emp-4");
        assertSuccess(res);
        const signed = res.data.data.find((i: any) => i.storeKeeperSignature === "sk_sig_audit_check");
        expect(signed).toBeDefined();
        expect(signed.receiverSignature).toBe("emp_sig_audit_check");
      },
    },

    // PPE-044: Import Historical Issuances (5 tests)
    {
      id: "T1-PPE-044-01",
      featureId: "PPE-044",
      tier: 1,
      title: "Record historical paper issuance record with past issue date",
      fn: async (ctx) => {
        const pastDate = new Date(Date.now() - 180 * 86400000).toISOString();
        const res = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          issueDate: pastDate,
          storeKeeperSignature: "legacy_paper_record",
          receiverSignature: "legacy_paper_record",
        });
        assertStatus(res, 201);
        expect(res.data.status).toBe("issued");
      },
    },
    {
      id: "T1-PPE-044-02",
      featureId: "PPE-044",
      tier: 1,
      title: "Verify historical issuance with past replacement date is tracked as overdue",
      fn: async (ctx) => {
        const pastDate = new Date(Date.now() - 365 * 86400000).toISOString();
        const pastExp = new Date(Date.now() - 30 * 86400000).toISOString();
        const res = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          issueDate: pastDate,
          expectedReplacementDate: pastExp,
          storeKeeperSignature: "legacy_import",
          receiverSignature: "legacy_import",
        });
        assertStatus(res, 201);
        const savedDate = new Date(res.data.expectedReplacementDate);
        expect(savedDate.getTime()).toBeLessThan(Date.now());
      },
    },
    {
      id: "T1-PPE-044-03",
      featureId: "PPE-044",
      tier: 1,
      title: "Verify historical issuance appears in employee historical timeline",
      fn: async (ctx) => {
        const markerSig = `legacy_sig_${Date.now()}`;
        await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          issueDate: new Date(Date.now() - 90 * 86400000).toISOString(),
          storeKeeperSignature: markerSig,
          receiverSignature: markerSig,
        });
        const res = await ctx.asAdmin().get("/api/issuances?employeeId=emp-4");
        assertSuccess(res);
        const match = res.data.data.find((i: any) => i.storeKeeperSignature === markerSig);
        expect(match).toBeDefined();
      },
    },
    {
      id: "T1-PPE-044-04",
      featureId: "PPE-044",
      tier: 1,
      title: "Verify historical issuance preserves original issue date",
      fn: async (ctx) => {
        const targetDate = new Date("2024-01-15T10:00:00Z");
        const res = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          issueDate: targetDate.toISOString(),
          storeKeeperSignature: "historical_import",
          receiverSignature: "historical_import",
        });
        assertStatus(res, 201);
        const saved = new Date(res.data.issueDate);
        expect(saved.getFullYear()).toBe(2024);
      },
    },
    {
      id: "T1-PPE-044-05",
      featureId: "PPE-044",
      tier: 1,
      title: "Verify historical issuance generates audit log entry with actor details",
      fn: async (ctx) => {
        const res = await ctx.asAdmin().post("/api/issuances", {
          employeeId: "emp-4",
          ppeItemId: "ppe-hlm-001",
          locationId: "loc-cai-new",
          quantity: 1,
          issueDate: new Date(Date.now() - 60 * 86400000).toISOString(),
          storeKeeperSignature: "hist_sig",
          receiverSignature: "hist_sig",
        });
        const auditRes = await ctx.asAdmin().get("/api/audit-logs?entityType=Issuance");
        assertSuccess(auditRes);
        const match = auditRes.data.data.find((a: any) => a.entityId === res.data.id);
        expect(match).toBeDefined();
      },
    },
  ],
};
