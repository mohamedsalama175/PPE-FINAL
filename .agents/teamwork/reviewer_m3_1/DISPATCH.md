## 2026-11-11T11:06:28Z
You are Reviewer 1 for Milestone 3 of the HSE Front-End Design System project.

### Mandatory Documents to Read First
- Original user request: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md`
- Master design system specification: `d:\Sana Soft2\PRoject Code\PPE-FINAL\DESIGN_SYSTEM.md`
- Master project plan: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\orchestrator\PROJECT.md`
- Milestone 3 Worker Handoff: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\worker_milestone_3\handoff.md`

### State Folder
Your state folder is: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\reviewer_m3_1`
Maintain `BRIEFING.md` and `progress.md` in your state folder.

### Scope & Mission
Perform an independent, rigorous code review and verification of **Master Data, Catalog, and Stock Management Views**:
1. `src/pages/Catalog.tsx` & `CatalogForm.tsx`
2. `src/pages/Attributes.tsx` & `AttributeForm.tsx`
3. `src/pages/ItemGroups.tsx` & `ItemGroupForm.tsx`
4. `src/pages/Locations.tsx` & `LocationForm.tsx`
5. `src/pages/StoreKeeperMatrix.tsx`
6. `src/pages/Scrap.tsx`
7. `src/pages/Stock.tsx`
8. `src/pages/StockAdjustments.tsx`
9. `src/pages/Transfers.tsx` & `TransferForm.tsx`

### Review Criteria
1. **Design System Conformance**: Verify that legacy prototype classes (`bg-surface`, `bg-canvas`, `border-border`, `text-body`, `text-ink`, `bg-accent`, `text-accent`, `bg-safety-red`, `border-slate-200`) have been eliminated and replaced with HSE tokens (`#212B59`, `#F5F6FD`, `#FFFFFF`, `#E2E8F0`, `#0e1726`, etc.).
2. **Shared UI Components**: Verify adoption of `ContainerCard`, `DataTable`/`CustomTable`, `TableActionsButtons`, `Input`, `Select`, `Textarea`, `StatusBadge`, and shared `<Modal>`.
3. **Native Dialog Remediation (FE-VIW-06)**: Verify that zero `window.alert()`, `window.confirm()`, or `window.prompt()` remain in these views, and that all confirmations/reversals use `useSwal` (`showConfirm`, `showDeleteReason`, `showInfo`, `showToast`). Note especially `Scrap.tsx` prompt replacement.
4. **Bidirectional RTL & Dark Mode**: Verify logical directional classes (`ps-*`, `pe-*`, `ms-*`, `me-*`, `border-s-*`, `text-start`, `text-end`, `rtl:rotate-180`) and dark mode classes (`dark:...`).
5. **Business Logic & API Contracts**: Verify that no API endpoints, query keys, data schemas, or business rules were broken.
6. **Independent Command Execution**:
   - Run `npm run lint` (`tsc --noEmit`)
   - Run `npm run build` (`vite build`)
   - Run `npm run build:server`
   - Run `powershell -Command "npm run db:seed; npm run test:server"`
   - Run `powershell -Command "npm run db:seed; npm run test:e2e"`

### Output & Verdict
Write your comprehensive report to `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\reviewer_m3_1\handoff.md`.
Render an explicit verdict: `APPROVE` or `REQUEST_CHANGES`.
Then message caller with your verdict and link to handoff.md.
