## 2026-11-11T16:18:08Z

You are the Implementation Worker for Milestone 4 (Iteration 2) of the HSE Front-End Design System project.

Working directory: d:\Sana Soft2\PRoject Code\PPE-FINAL
State folder: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\worker_milestone_4_it2
Original request file: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md
Project specification: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\orchestrator\PROJECT.md
Forensic Auditor Evidence Report: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\auditor_m4_1\handoff.md

## EXPLORER INVESTIGATION HANDOFFS (READ THESE FIRST)
1. Dark Theme Tokens Blueprint: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m4_it2_1\handoff.md
2. Database Seed Referential Integrity Blueprint: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m4_it2_2\handoff.md
3. RTL Dividers, Directional Insets & Icon Mirroring Blueprint: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m4_it2_3\handoff.md

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## EXCLUSIVE WRITE OWNERSHIP
You own exclusive write permissions to:
1. `src/index.css`
2. `prisma/seed.ts`
3. `src/pages/Dashboard.tsx`
4. `src/pages/KitForm.tsx`
5. `src/pages/TransferForm.tsx`
6. `src/components/dashboard/OverdueLoansHeatmap.tsx`
7. `src/components/dashboard/UpcomingExpiriesChart.tsx`
8. `src/components/ui/NotificationCenter.tsx`
9. `src/components/ui/SignaturePad.tsx`
10. `src/components/ui/Toast.tsx`
11. `src/components/layout/Sidebar.tsx`
12. `src/components/ui/SlideOverDrawer.tsx`
13. `src/components/layout/Header.tsx`

DO NOT modify test files under `tests/` or `server/test-comprehensive.ts`.

## IMPLEMENTATION TASKS

### Task 1: Register Missing Dark Theme Tokens in `src/index.css`
In `src/index.css`, inside `@theme` block immediately after line 55 (`--color-table-header-dark: #1a2941;`), add:
```css
  --color-dark-card: #17263c;
  --color-dark-border: #1b2e4b;
  --color-dark-muted: #888ea8;
  --color-slate-750: #293548;
  --color-slate-650: #3b4b61;
```
Verify with `Select-String -Path src/index.css -Pattern 'dark-card|dark-border|dark-muted'`.

### Task 2: Implement Atomic Deletion in `prisma/seed.ts`
In `prisma/seed.ts`, replace sequential table deletions (lines 27-54) with an atomic `prisma.$transaction([...])` call per `explorer_m4_it2_2/handoff.md`:
```typescript
  // Clean existing
  // Delete in reverse dependency order within an atomic transaction
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.issuanceReturn.deleteMany(),
    prisma.scrapEntry.deleteMany(),
    prisma.issuance.deleteMany(),
    prisma.kitItem.deleteMany(),
    prisma.kit.deleteMany(),
    prisma.pPEItemVariantValue.deleteMany(),
    prisma.pPEItemLocation.deleteMany(),
    prisma.stockMovement.deleteMany(),
    prisma.stockAdjustment.deleteMany(),
    prisma.stockBalance.deleteMany(),
    prisma.batch.deleteMany(),
    prisma.openingBalanceLine.deleteMany(),
    prisma.openingBalance.deleteMany(),
    prisma.locationStoreKeeper.deleteMany(),
    prisma.pPEItem.deleteMany(),
    prisma.itemGroupAttribute.deleteMany(),
    prisma.itemGroup.deleteMany(),
    prisma.attributeValue.deleteMany(),
    prisma.attribute.deleteMany(),
    prisma.employee.updateMany({ data: { supervisorId: null } }),
    prisma.employee.deleteMany(),
    prisma.location.deleteMany(),
    prisma.jobPosition.deleteMany(),
    prisma.expirySettings.deleteMany(),
    prisma.moduleSettings.deleteMany(),
  ]);
```

### Task 3: Remediate RTL Tab Dividers in `src/pages/Dashboard.tsx`
In `src/pages/Dashboard.tsx`, replace `border-l border-slate-200` with `border-s border-slate-200` at lines 340, 656, and 665.

### Task 4: Remediate Unmirrored Navigation Icons
- `src/pages/KitForm.tsx:149`: Add `rtl:rotate-180` to `<ArrowLeft />` back button.
- `src/pages/TransferForm.tsx:129`: Add `rtl:rotate-180` to `<ArrowLeft />` back button.
- `src/components/dashboard/OverdueLoansHeatmap.tsx:357, 368`: Add `rtl:rotate-180` to `<ChevronLeft />` and `<ChevronRight />`.
- `src/components/dashboard/UpcomingExpiriesChart.tsx:467`: Add `rtl:rotate-180` to `<ArrowRight />`.

### Task 5: Convert Component Physical Classes to Logical Insets
- `src/components/layout/Sidebar.tsx:269`: Replace `border-r rtl:border-r-0 rtl:border-l` with `border-e`.
- `src/components/ui/SlideOverDrawer.tsx:62`: Replace `ltr:right-0 rtl:left-0 max-w-full flex ltr:pl-10 rtl:pr-10` with `end-0 max-w-full flex ps-10`.
- `src/components/ui/SlideOverDrawer.tsx:66`: Replace `'ltr:border-l rtl:border-r border-[#E2E8F0]'` with `'border-s border-[#E2E8F0]'`.
- `src/components/ui/NotificationCenter.tsx:33, 40`: Replace `-right-1` with `-end-1`, and `right-0` with `end-0`.
- `src/components/ui/SignaturePad.tsx:184`: Replace `right-2` with `end-2`.
- `src/components/ui/Toast.tsx:10`: Replace `right-4` with `end-4`.
- `src/components/layout/Header.tsx:203, 267, 325`: Replace `ltr:right-0 rtl:left-0` with `end-0`.

### Task 6: Repository Cleanliness
Verify no temporary `.mjs`, `.tsx`, or `.ts` test probe files remain in project root or `src/`.

## VERIFICATION COMMANDS (ALL MANDATORY)
Run each command sequentially and record raw terminal outputs:
1. `npm run lint` (0 TypeScript errors)
2. `npm run build` (confirm `dist/assets/*.css` contains rules for `dark-card`, `dark-border`, `dark-muted`)
3. `npm run build:server` (0 compilation errors)
4. `npm run db:seed` (clean exit 0)
5. `powershell -Command "npm run db:seed; npm run test:server"` (100% assertions passed)
6. `powershell -Command "npm run db:seed; npm run test:e2e"` (all 575 test cases passed)
7. `npm run db:seed` (leave database in clean seed state)

## OUTPUT REQUIREMENT
Write your completion report to `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\worker_milestone_4_it2\handoff.md`.
Include:
- Files modified with diff summaries
- Verification results and raw command outputs
- Confirmation of zero physical directional classes in pages
- Confirmation of CSS variable generation in `dist/assets/*.css`
Then call `send_message` to your parent orchestrator.

