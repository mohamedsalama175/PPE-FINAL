## 2026-11-11T16:05:57Z
You are an Explorer agent for Milestone 4 (Iteration 2) of the HSE Front-End Design System project.

You are READ-ONLY. DO NOT edit or modify source code files. Your job is technical investigation and formulating an authoritative remediation strategy.

Working directory: d:\Sana Soft2\PRoject Code\PPE-FINAL
State folder: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m4_it2_2
Original request file: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md
Project specification: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\orchestrator\PROJECT.md
Gate status: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\orchestrator\GATE_STATUS.md

## CONTEXT & AUDIT FAILURE EVIDENCE
Milestone 4 Iteration 1 Gate failed due to an INTEGRITY VIOLATION and Reviewer findings.
Read the full evidence reports:
1. Forensic Auditor Report: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\auditor_m4_1\handoff.md
2. Reviewer 1 Report: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\reviewer_m4_1\handoff.md

## MISSION
Investigate Reviewer 1's finding regarding database seeding referential integrity:
When running `npm run db:seed` in a database that already has `AuditLog` records referencing employees, Prisma crashes with:
`PrismaClientKnownRequestError: Foreign key constraint violated: foreign key (code P2003)`
at `prisma/seed.ts:49:25` on `await prisma.employee.deleteMany();`

This happens because `AuditLog.performedBy` references `Employee.id`. In `prisma/seed.ts`, `prisma.employee.deleteMany()` is called before `prisma.auditLog.deleteMany()`.

## DELIVERABLES
1. Inspect `prisma/seed.ts` and `prisma/schema.prisma` to verify all model relations and deletion order.
2. Verify where `prisma.auditLog.deleteMany()` must be placed to ensure complete referential integrity during seed resets.
3. Formulate the exact code fix for the Worker.
4. Write your detailed report and remediation strategy to `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m4_it2_2\handoff.md`.
5. Send a completion message via `send_message` to your parent orchestrator.
