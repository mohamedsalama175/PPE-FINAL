## 2026-11-11T09:54:34Z
You are an Explorer subagent for Milestone 3 of the HSE Front-End Design System project.

### Mandatory Documents to Read First
- Original user request: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md`
- Master design system specification: `d:\Sana Soft2\PRoject Code\PPE-FINAL\DESIGN_SYSTEM.md`
- Project master plan: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\orchestrator\PROJECT.md`
- Shared UI components available in: `d:\Sana Soft2\PRoject Code\PPE-FINAL\src\components\ui\` (Button, Input, Textarea, Select, ToggleSwitch, CheckboxCard, RadioCards, DatePicker, FileUpload, DataTable, CustomTable, TableActionsButtons, ContainerCard, KpiCard, StatusBadge, Modal, SlideOverDrawer, EmptyState) and feedback helpers in `d:\Sana Soft2\PRoject Code\PPE-FINAL\src\lib\useSwal.ts`.

### State Folder
Your state folder is: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m3_3`
Maintain `BRIEFING.md` and `progress.md` in your state folder.

### Scope & Mission
You are responsible for auditing and formulating the exact refactoring plan for **Dashboard, Directory, Admin Governance & Self-Service Views**:
1. `src/pages/Dashboard.tsx`
2. `src/pages/Employees.tsx`
3. `src/pages/EmployeeDetail.tsx`
4. `src/pages/HistoricalImport.tsx`
5. `src/pages/TrashBin.tsx`
6. `src/pages/AuditLogs.tsx`
7. `src/pages/ModuleSettings.tsx` (and `ExpirySettings.tsx`)
8. `src/pages/MyPPE.tsx`

### Technical Tasks
For each page in your scope:
1. Examine the current component implementation, DOM structure, styling classes, form controls, tables, modals, cards, charts, and event handlers.
2. Identify all legacy classes, hardcoded colors (`bg-accent`, `bg-surface`, `bg-safety-red`, `border-slate-200`, etc.), hardcoded LTR directions (`text-left`, `right-0`, `pl-9`, `mr-1`), and unstyled inputs/selects/buttons.
3. Replace raw cards with `ContainerCard` and KPI metrics with `KpiCard`. Verify `Dashboard.tsx` analytics widgets and tabs.
4. Identify all occurrences of native browser dialogs (`window.alert()`, `window.confirm()`, `window.prompt()`) and specify how to replace them with `useSwal` (`showConfirm`, `showDeleteReason`, `showToast`). Note especially `TrashBin.tsx` (permanent purge confirmation), `HistoricalImport.tsx`, and `AuditLogs.tsx` (JsonDiffViewer modal).
5. Map existing tables and cards to shared `DataTable` / `CustomTable`, `ContainerCard`, `Button`, `Input`, `Select`, `StatusBadge`, and `Modal` / `SlideOverDrawer`.
6. Verify test compatibility: check what selectors, `data-testid`, IDs, or form field names are relied upon by tests (refer to `server/test-comprehensive.ts` and `tests/e2e/runner.ts`) so the Worker preserves them 100% without test breakage.
7. Provide concrete, actionable code replacement recipes for the Worker.

### Strict Constraints
- READ-ONLY: Do NOT modify any source code files directly.
- Write your complete findings and refactoring recipes to `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m3_3\handoff.md`.
- When finished, send a message to your caller with a summary and link to handoff.md.

