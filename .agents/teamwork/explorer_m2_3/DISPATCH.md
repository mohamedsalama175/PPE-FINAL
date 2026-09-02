# DISPATCH — explorer_m2_3 (Kits Management & Frontend Epics 5-6 Integration)

## Objective
Investigate Kits Management (`server/src/routes/kits.ts`) and Frontend UI integration for Epics 5 & 6 (PPE-024 through PPE-033).
Provide exact drop-in code changes to resolve Defect 6 (Kits endpoint ignores `jobPositionId` query filter), enforce kit in-use protection (PPE-033), and ensure frontend pages (`Stock.tsx`, `StockAdjustments.tsx`, `Transfers.tsx`, `Kits.tsx`) and API client properly integrate with all backend changes.

## Mandatory Inputs to Read
1. `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md` (MUST read first)
2. `d:\Sana Soft2\PRoject Code\PPE-FINAL\PROJECT.md`
3. `d:\Sana Soft2\PRoject Code\PPE-FINAL\TEST_READY.md`
4. `server/src/routes/kits.ts`
5. `src/pages/Stock.tsx`
6. `src/pages/StockAdjustments.tsx`
7. `src/pages/Transfers.tsx`
8. `src/pages/Kits.tsx`
9. `src/lib/api.ts`

## Scope
- Focus on `kits.ts` backend and frontend pages for Epics 5–6.
- Do NOT implement changes yourself; write exact code snippets, file paths, line numbers, and rationale to `handoff.md`.

## 2026-11-09T11:42:50Z
You are explorer_m2_3 (Kits Management & Frontend Epics 5-6 Explorer).
Your working directory is: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_3
Read d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md FIRST, then read PROJECT.md, TEST_READY.md, and your DISPATCH.md at d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_3\DISPATCH.md.

Your objective:
Investigate Kits Management (server/src/routes/kits.ts) and Frontend UI integration for Epics 5 & 6 (PPE-024 through PPE-033).
Specifically investigate:
1. Defect 6: Kits endpoint ignores jobPositionId query filter in server/src/routes/kits.ts:18. Ensure GET /?jobPositionId=... correctly filters kits by jobPositionId.
2. Kit in-use protection (PPE-033): Prevent deleting or deactivating safety kits that are currently in use or have issuances in the last 90 days unless Admin override reason is provided.
3. Frontend integration for Epics 5 & 6:
   - src/pages/Stock.tsx (real-time balance table, quarantined badge, available quantity calculation).
   - src/pages/StockAdjustments.tsx (Risk Cat III approval alert/badge, non-zero quantity validation).
   - src/pages/Transfers.tsx (source and destination location validation, Rule G6 error messages).
   - src/pages/Kits.tsx (job position filter, kit composition editor).
   - src/lib/api.ts (ensure API endpoints match backend contracts).

Produce exact, drop-in TypeScript code snippets, exact line references, and a clear implementation guide in d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_3\handoff.md.
When complete, send a message to caller with a brief summary and the handoff path.

## 2026-11-09T11:53:24Z
**Context**: Milestone 2 Kits & Frontend exploration
**Content**: Status check. Please report your current progress and ETA for handoff.md.
**Action**: Reply with your current findings and status.
