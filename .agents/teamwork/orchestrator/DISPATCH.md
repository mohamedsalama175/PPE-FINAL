# Dispatch

## 2026-11-09T09:40:24Z

Implement the full production-ready PPE (Personal Protective Equipment) Module for the HSE system in the existing codebase according to the rebuilt 50 user stories (PPE-001 through PPE-050) and Global Rules G1 through G14.

Working directory: d:\Sana Soft2\PRoject Code\PPE-FINAL
Integrity mode: development

## Requirements

### R1. System Foundation and Master Data Management (Epics 1–4)
Implement catalog management (PPE-001 to PPE-007), dynamic attribute management (PPE-008 to PPE-012), item groups management (PPE-013 to PPE-017), and warehouse/location management (PPE-018 to PPE-023). Enforce Global Rules G2 (in-use protection with logged Admin override; hard block on deleting locations holding stock), G3 (variants via item group attributes), G5 (time-based lifespan tracking), G6 (stock conditions: New, Used, Scrap with restricted transfers), and G13 (bilingual English and Arabic support with RTL layout).

### R2. Stock and Kit Management (Epics 5–6)
Implement stock operations (PPE-024 to PPE-028) and kit management (PPE-029 to PPE-033). Calculate available stock as on-hand minus quarantined (G9), require HSE Supervisor approval for Risk Category III stock adjustments (G14), enforce location capacity tracking, and support job-specific kit definitions and issuances.

### R3. Issuance, Loans, Returns, and Employee Tracking (Epics 7–8)
Implement single item issuance, job-specific kit issuance, visitor/contractor loans, and returns with auto-scrap routing (PPE-034 to PPE-041), alongside employee PPE tracking and replacements due views (PPE-042 to PPE-044). Capture Store Keeper and recipient signatures for all transactions (G7), enforce gender-matching rules where configured (G4), highlight overdue items, exclude terminated/transferred employees from reminders (G12), and scope data views by platform role (Direct Supervisors view own team only; Store Keepers view assigned locations).

### R4. Dashboards, Audit Logging, and System Administration (Epics 9–10)
Implement PPE analytics dashboards (PPE-045 to PPE-047), the shared 90-day trash bin preserving historical records (PPE-048, G10), an immutable audit log viewer (PPE-049, G1), and configurable module settings (PPE-050, G11).

## Acceptance Criteria

### Functional & Business Rule Verification
- [ ] In-use protection prevents deleting active entities unless overridden by Admin with a recorded reason, while locations holding stock cannot be deleted under any circumstance (G2).
- [ ] Stock adjustments on Risk Category III items require HSE Supervisor approval before posting to inventory (G14).
- [ ] Transfers from Used to New locations and stock movements out of Scrap locations are blocked (G6).
- [ ] Issuance validates gender compatibility against employee profiles when required by the item group (G4).
- [ ] Dual-signature records are stored and verifiable for every issuance, loan, and return transaction (G7).
- [ ] Terminated and transferred employees are omitted from replacement reminders and active replacement queues (G12).
- [ ] All pages and dialogs render correctly in both English and Arabic with proper RTL styling and complete localization (G13).

### Database & Backend Implementation
- [ ] Prisma schema and migrations model all entities, relations, audit entries, and stock balances required across PPE-001 through PPE-050.
- [ ] Express API routes enforce authentication, role permissions (Admin, HSE Supervisor, Store Keeper, Direct Supervisor), and input validation across all endpoints.
- [ ] Database seed script (`npm run db:seed`) runs cleanly and populates realistic demonstration data covering all roles, master data, kits, stock levels, transactions, and audit records.

### Build and Test Verification
- [ ] Client application build (`npm run build`) completes with zero TypeScript or packaging errors.
- [ ] Server application build (`npm run build:server`) completes with zero TypeScript errors.
- [ ] Automated integration/unit tests pass, validating audit logging, stock balance calculations, approval gates, and transfer restrictions.

---
Orchestrator Context and Instructions:
- Your identity: Project Orchestrator (teamwork_orchestrator)
- Working directory: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\orchestrator\
- Project Root / Workspace directory: d:\Sana Soft2\PRoject Code\PPE-FINAL
- Original User Request path: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md
- Maintain your BRIEFING.md, plan.md, and progress.md in your working directory.
- Decompose and dispatch tasks to specialists according to your workflow protocol.


## 2026-11-09T16:01:24Z

Apply the HSE front-end design system specification in DESIGN_SYSTEM.md across the PPE-FINAL project for production use, updating styling foundations, shared components, and application views.

Working directory: d:\Sana Soft2\PRoject Code\PPE-FINAL
Integrity mode: development
State folder: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\orchestrator
Original request file: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md

## Requirements

### R1. Design System Foundation, Tokens, and Dependencies
Configure styling tokens and themes according to DESIGN_SYSTEM.md, including brand and semantic color palettes (primary `#212B59`, canvas `#F5F6FD`, slate borders `#E2E8F0`, and dark mode tokens), the Almarai typography scale with Google Fonts loading, spacing, border radii, and box shadows. Install and integrate specified UI packages (such as `@mantine/core`, `@mantine/dates`, `@tippyjs/react`, `sweetalert2`, and `react-flatpickr`) required for the design system.

### R2. Shared Components and Application Layout Shell
Implement or adapt shared UI components and application shell layout to match DESIGN_SYSTEM.md specifications. This includes header, responsive sidebar navigation (supporting expanded and collapsed states), standard button variants and states, form controls (inputs, textareas, checkboxes, radio cards, switches, date/time pickers, and file upload dropzones), and data tables with sortable headers, row selection, and action buttons.

### R3. Project-Wide View Conformance and Localization
Align all existing pages, dashboard cards, KPI widgets, and modals with DESIGN_SYSTEM.md design standards. Ensure consistent behavior across light and dark modes as well as full bilingual support for Arabic (RTL) and English (LTR) layouts with proper text direction and font rendering.

## Acceptance Criteria

### Design Tokens & Foundation
- [ ] Tailwind configuration and CSS theme layers define the complete color palette (primary, secondary, status badges, dark mode mappings), spacing, border radii, and shadows specified in DESIGN_SYSTEM.md.
- [ ] Almarai font family is loaded via Google Fonts and applied globally across both LTR and RTL layouts.
- [ ] Required UI packages (@mantine/core, @mantine/dates, @tippyjs/react, sweetalert2, react-flatpickr) are installed and integrated cleanly.

### Component & Layout Conformance
- [ ] Shared button components support solid, outline, text, and icon variants with specified hover, active, focus, and disabled states.
- [ ] Form controls match the visual styling, dimensions, borders, helper text, and error states defined in DESIGN_SYSTEM.md.
- [ ] Data tables and grids adhere to specified header styling, row borders, hover states, selection checkboxes, and action button tooltips.
- [ ] Application layout shell (Header, Sidebar, container padding, responsive breakpoints) conforms to DESIGN_SYSTEM.md layout specifications.
- [ ] All existing project pages, cards, and modal dialogs render consistently using the design system in both light and dark themes.
- [ ] Arabic (RTL) and English (LTR) layouts render correctly with appropriate text alignment, chevron positions, and directional spacing.

### Build & Test Verification
- [ ] Client application build (`npm run build`) completes with zero TypeScript or packaging compilation errors.
- [ ] Server application build (`npm run build:server`) completes with zero errors.
- [ ] Existing automated tests (`npm run test:server` and `npm run test:e2e`) continue to pass without regressions.

## 2026-11-11T15:50:23Z

Server restart recovery: Milestone 4 worker has completed work and written handoff.md in worker_milestone_4. Please resume execution, run Milestone 4 gate verification suite, and proceed to final victory audit.

