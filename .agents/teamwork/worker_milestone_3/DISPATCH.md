## 2026-11-11T10:05:51Z
You are the Worker subagent for Milestone 3 of the HSE Front-End Design System project.

### MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### Mandatory Documents to Read First
- Original user request: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md`
- Master design system specification: `d:\Sana Soft2\PRoject Code\PPE-FINAL\DESIGN_SYSTEM.md`
- Master project plan: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\orchestrator\PROJECT.md`
- Explorer 1 (Master Data Views) Handoff: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m3_1\handoff.md`
- Explorer 2 (Stock & Issuance Views) Handoff: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m3_2\handoff.md`
- Explorer 3 (Dashboard & Admin Views) Handoff: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m3_3\handoff.md`
- Shared UI components available in: `d:\Sana Soft2\PRoject Code\PPE-FINAL\src\components\ui\` and feedback helpers in `d:\Sana Soft2\PRoject Code\PPE-FINAL\src\lib\useSwal.ts`.

### State Folder
Your state folder is: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\worker_milestone_3`
Maintain `BRIEFING.md` and update `progress.md` after each file or group of files.

### Exclusive File Ownership
You exclusively own and may edit:
- `src/pages/*.tsx` (all application views and forms under `src/pages/`)
Do NOT edit backend files in `server/`, tests in `tests/`, or metadata outside your state folder.

### Mission & Tasks
Apply the HSE design system specification across all application views in `src/pages/` according to the recipes in the 3 Explorer handoff reports:

1. **Native Dialogs Remediation (FE-VIW-06)**:
   - Replace every occurrence of `window.alert()`, `window.confirm()`, and `window.prompt()` across all pages with `useSwal` (`showConfirm`, `showDeleteReason`, `showToast`).
   - Notice especially `Scrap.tsx` which uses `window.prompt` for reversal reasons (replace with `useSwal.showDeleteReason()`).
   - `Catalog.tsx`, `Attributes.tsx`, `ItemGroups.tsx`, `Locations.tsx`, `Kits.tsx`, `StockAdjustments.tsx`, `Dashboard.tsx`, etc.

2. **Shared UI Components Adoption**:
   - Wrap view surfaces in `ContainerCard` (from `src/components/ui/ContainerCard.tsx`).
   - Use `KpiCard` (from `src/components/ui/KpiCard.tsx`) for dashboard & analytics metric cards.
   - Replace raw tables with `DataTable` / `CustomTable` (from `src/components/ui/DataTable.tsx` / `CustomTable.tsx`) with sortable headers, search, and circular pagination.
   - Replace raw `<button>` clusters with `Button` (with modern variants `solid`, `outline`, `text`, `icon`, colors `primary`, `secondary`, etc.) and `TableActionsButtons`.
   - Replace raw form inputs and textareas with `Input` and `Textarea` (from `src/components/ui/`).
   - Replace raw dropdowns with `Select` (from `src/components/ui/Select.tsx`).
   - Replace raw date pickers with `DatePicker` (from `src/components/ui/DatePicker.tsx`).
   - Replace status text/chips with `StatusBadge` (from `src/components/ui/StatusBadge.tsx`).
   - Replace custom overlays/modals with `Modal` or `SlideOverDrawer` (from `src/components/ui/Modal.tsx`, `SlideOverDrawer.tsx`).

3. **Eliminate Obsolete Prototype Tokens**:
   - Remove legacy classes (`bg-surface`, `bg-canvas`, `border-border`, `text-body`, `text-ink`, `bg-accent`, `text-accent`, `bg-safety-red`, `bg-safety-green`, `border-slate-200`) across all views.
   - Apply HSE tokens: primary `#212B59`, canvas `#F5F6FD`, card `#FFFFFF`, hairline borders `#E2E8F0`, muted `#64748B`, ink `#1E293B`, dark surfaces `#0e1726`, dark borders `#17263c`.

4. **Bidirectional RTL & Dark Mode Support**:
   - Replace physical directional classes (`text-left`, `text-right`, `pl-*`, `pr-*`, `ml-*`, `mr-*`, `border-l-*`, `border-r-*`, `left-*`, `right-*`) with logical/bilingual classes (`text-start`, `text-end`, `ps-*`, `pe-*`, `ms-*`, `me-*`, `border-s-*`, `border-e-*`, `start-*`, `end-*`, `rtl:rotate-180`).
   - Add dark mode classes across all cards, tables, inputs, text, and modals.

5. **Strict Preservation of Business Logic & Tests**:
   - DO NOT alter any API routes, endpoint URLs, query keys, Zustand state actions, or form submission payloads.
   - Dual signature pads (`SignaturePad` in `IssuanceForm`, `IssueKitForm`, `IssueLoanForm`, `Issuances`) must remain fully functional.

6. **Verification Gate**:
   Execute the full verification gate in order:
   a. `npm run lint` (`tsc --noEmit`) -> 0 errors.
   b. `npm run build` (`vite build`) -> builds cleanly.
   c. `npm run build:server` -> 0 errors.
   d. `npm run db:seed`
   e. `npm run test:server` -> 100% assertions pass.
   f. `npm run test:e2e` -> 575/575 tests pass (100%).

7. **Handoff Report**:
   Write `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\worker_milestone_3\handoff.md` with:
   - Observation (all modified files, before/after lines, command outputs)
   - Logic Chain (remediation strategy)
   - Caveats (any non-breaking adaptations)
   - Conclusion (verdict and deliverables)
   - Verification (exact commands and test outputs)
   Then send a completion message to caller.
