## 2026-11-11T11:23:57Z

You are the Milestone 4 Implementation Worker (worker_milestone_4) for the HSE Front-End Design System project.

Working directory: d:\Sana Soft2\PRoject Code\PPE-FINAL
State folder: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\worker_milestone_4
Original request path: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md
Project specification path: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\orchestrator\PROJECT.md
Design system specification: d:\Sana Soft2\PRoject Code\PPE-FINAL\DESIGN_SYSTEM.md
Parent conversation ID: 6528d93b-4eaa-42a1-894e-9658ab2f9b68

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objectives & Work Items:
1. FE-RTL-01: RTL Directional Utilities Remediation
   Audit and replace the lingering 14 physical directional classes with Tailwind CSS logical RTL classes:
   - `src/pages/Catalog.tsx`: line ~605 (`mr-2` -> `me-2`)
   - `src/pages/Dashboard.tsx`: line ~719 (`mr-2` -> `me-2`)
   - `src/pages/EmployeeDetail.tsx`: line ~56 (`mr-2` -> `me-2`)
   - `src/pages/IssueKitForm.tsx`: lines ~290, 297, 356 (`text-left` -> `text-start`, `text-right` -> `text-end`, `mr-1` -> `me-1`)
   - `src/pages/IssueLoanForm.tsx`: lines ~286, 291 (`text-left` -> `text-start`, `text-right` -> `text-end`)
   - `src/pages/OpenLoans.tsx`: line ~436 (`mr-1` -> `me-1`)
   - `src/pages/StockAdjustments.tsx`: lines ~1027, 1030, 1038, 1044, 1158 (`text-left` -> `text-start`, `text-right` -> `text-end`, `mr-1` -> `me-1`, `mr-2` -> `me-2`)
   Scan across `src/pages/*.tsx` to ensure NO remaining `mr-`, `ml-`, `pr-`, `pl-`, `text-left`, `text-right` exist where directional logical equivalents (`me-`, `ms-`, `pe-`, `ps-`, `text-start`, `text-end`) should be used.

2. FE-DRK-01: Dark Theme Token Registration
   In `src/index.css` inside the `@theme` block:
   Ensure:
   `--color-dark-card: #17263c;`
   `--color-dark-border: #1b2e4b;`
   `--color-dark-muted: #888ea8;`
   are registered if not already present, ensuring full dark theme visual parity across `src/pages/*.tsx` per `DESIGN_SYSTEM.md`.

3. FE-VER-01: Repository Cleanliness & Final Test Execution
   - Remove temporary test files `tests/adversarial-milestone2.tsx` and `tests/adversarial-milestone3.tsx` so repository state is clean.
   - Run the 6 core verification commands sequentially:
     1. `npm run lint` (must exit 0 with 0 TypeScript errors)
     2. `npm run build` (must exit 0 with clean Vite bundle)
     3. `npm run build:server` (must exit 0)
     4. `npm run db:seed` (must complete cleanly)
     5. `npm run test:server` (100% assertions passed)
     6. `npm run test:e2e` (all 575 tests passed, 100% pass rate)

4. Documentation & Reporting:
   - Update `progress.md` in your state folder after each step.
   - Write `handoff.md` in your state folder with complete sections: Observation, Logic Chain, Caveats, Conclusion, Verification Method.
   - Send completion message to parent conversation ID `6528d93b-4eaa-42a1-894e-9658ab2f9b68`.
