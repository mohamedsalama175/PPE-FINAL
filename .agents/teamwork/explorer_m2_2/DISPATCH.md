# DISPATCH — explorer_m2_2 (Opening Balances, Location Scoping, Capacity Tracking)

## Objective
Investigate backend implementation for Opening Balances, Location Scoping on Stock Balances, and Location Capacity tracking in Milestone 2.
Provide exact drop-in code changes to resolve Defect 1 (Store Keeper unassigned location balance leak), Defect 5 (Opening balance re-submission returns 404 instead of 400), 4-Eyes Principle (Rule G14 / PPE-026), and capacity tracking checks (PPE-021/PPE-024).

## Mandatory Inputs to Read
1. `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md` (MUST read first)
2. `d:\Sana Soft2\PRoject Code\PPE-FINAL\PROJECT.md`
3. `d:\Sana Soft2\PRoject Code\PPE-FINAL\TEST_READY.md`
4. `server/src/routes/openingBalances.ts`
5. `server/src/routes/stock.ts` (GET `/balances` endpoint)
6. `server/src/routes/locations.ts`

## Scope
- Focus on opening balance workflows, Store Keeper location scoping, and capacity tracking.
- Do NOT implement changes yourself; write exact code snippets, file paths, line numbers, and rationale to `handoff.md`.

## 2026-11-09T11:42:43Z
[Message] timestamp=2026-11-09T11:42:43Z sender=0705e41a-f51e-424e-9956-6cd880334c08 priority=MESSAGE_PRIORITY_HIGH content=You are explorer_m2_2 (Opening Balances & Location Scoping Explorer).
Your working directory is: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_2
Read d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md FIRST, then read PROJECT.md, TEST_READY.md, and your DISPATCH.md at d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_2\DISPATCH.md.

Your objective:
Investigate backend implementation for Opening Balances, Location Scoping on Stock Balances, and Location Capacity tracking in Milestone 2.
Specifically investigate:
1. Defect 1: Missing RLS / Location Scoping on GET /api/stock/balances in server/src/routes/stock.ts:16-67. When req.user.role === 'Store_Keeper', Store Keepers must only see inventory in locations assigned to them.
2. Defect 5: Opening Balance re-submission returning 404 instead of 400 in server/src/routes/openingBalances.ts. If opening balance is already submitted or in 'Pending_Approval' or 'Closed', return HTTP 400 with message "Opening balance has already been submitted".
3. 4-Eyes Principle (Rule G14 / PPE-026): Store Keeper submits opening balance, HSE Supervisor approves. Ensure proper status transitions and location openingBalanceStatus changes to 'Closed'.
4. Location capacity tracking (PPE-021/PPE-024): Check Location.capacityUnits vs current onHand quantity to prevent exceeding capacity or warn appropriately.

Produce exact, drop-in TypeScript code snippets, exact line references, and a clear implementation guide in d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_2\handoff.md.
When complete, send a message to caller with a brief summary and the handoff path.

## 2026-11-09T11:53:24Z
[Message] timestamp=2026-11-09T11:53:24Z sender=0705e41a-f51e-424e-9956-6cd880334c08 priority=MESSAGE_PRIORITY_HIGH content=**Context**: Milestone 2 Opening Balances & Scoping exploration
**Content**: Status check. Please report your current progress and ETA for handoff.md.
**Action**: Reply with your current findings and status.
