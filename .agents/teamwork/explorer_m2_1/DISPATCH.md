# DISPATCH — explorer_m2_1 (Stock Transfers, Adjustments, G6, G9, G14)

## Objective
Investigate backend implementation for Stock Transfers, Stock Adjustments, and Rules G6, G9, and G14 in Milestone 2.
Provide exact drop-in code changes to resolve Defect 2 (Role Guard on adjustments), Defect 3 (Non-zero quantity delta), Rule G6 (Restricted transfers), Rule G9 (Available = On Hand - Quarantined), and Rule G14 (Risk Category III approval gate).

## Mandatory Inputs to Read
1. `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md` (MUST read first)
2. `d:\Sana Soft2\PRoject Code\PPE-FINAL\PROJECT.md`
3. `d:\Sana Soft2\PRoject Code\PPE-FINAL\TEST_READY.md`
4. `server/src/routes/stock.ts`
5. `server/src/schemas/entities.ts`
6. `server/src/services/` (if any)

## Scope
- Focus on `server/src/routes/stock.ts` and adjustment/transfer endpoints.
- Do NOT implement changes yourself; write exact code snippets, file paths, line numbers, and rationale to `handoff.md`.

## 2026-11-09T11:42:36Z
You are explorer_m2_1 (Stock Transfers, Adjustments, G6, G9, G14 Explorer).
Your working directory is: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_1
Read d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md FIRST, then read PROJECT.md, TEST_READY.md, and your DISPATCH.md at d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_1\DISPATCH.md.

Your objective:
Investigate backend implementation for Stock Transfers, Stock Adjustments, and Rules G6, G9, and G14 in Milestone 2.
Specifically investigate:
1. Defect 2: Missing Role Guard on Stock Adjustments in server/src/routes/stock.ts:141. Ensure authorize("Admin", "HSE Supervisor", "Store Keeper") is added.
2. Defect 3: Acceptance of zero quantity in server/src/schemas/entities.ts:107 quantityDelta. Enforce non-zero integer.
3. Rule G6: Restricted Transfers in POST /api/stock/transfers:
   - Used to New transfers blocked (400 "Used stock cannot be transferred to New locations").
   - Transfers out of Scrap locations blocked (400 "Stock in Scrap location cannot be transferred").
   - Transfers into Scrap locations via transfer endpoint blocked (400 "Stock can only enter Scrap via return or stock out").
4. Rule G9: Available Stock Formula across all endpoints: available = onHand - quarantined. Verify how StockBalance and batch calculations expose availableQuantity.
5. Rule G14: High-Risk Category III stock adjustment approval workflow. For any adjustment where item has riskCategory === 'Category III', enforce status = 'pending' requiring HSE Supervisor approval before posting to inventory.

Produce exact, drop-in TypeScript code snippets, exact line references, and a clear implementation guide in d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_1\handoff.md.
When complete, send a message to caller with a brief summary and the handoff path.

## 2026-11-09T11:53:24Z
**Context**: Milestone 2 Stock Transfers & G6/G9/G14 exploration
**Content**: Status check. Please report your current progress and ETA for handoff.md.
**Action**: Reply with your current findings and status.
