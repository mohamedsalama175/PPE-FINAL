# Project: PPE (Personal Protective Equipment) Module for HSE System

## Architecture
The PPE Module is a multi-tier enterprise web application implementing comprehensive Personal Protective Equipment inventory, issuance, loans, tracking, compliance, and governance.

- **Frontend**: React 19 SPA built with Vite, Tailwind CSS 4, React Router 7, Zustand for client state, Lucide icons, Recharts/ApexCharts for analytics, and HTML5 Canvas for dual digital signature capture. Supports complete bilingual Arabic/English localization and native RTL layout (`dir="rtl"`).
- **Backend**: Node.js Express 4 REST API written in TypeScript, featuring JWT authentication, role-based authorization (Admin, HSE Supervisor, Store Keeper, Direct Supervisor, Employee), Zod input validation schemas, Prisma ORM with SQLite, and an immutable audit logging system.
- **Data Flow**:
  1. Requests hit Express API routes guarded by `authenticate` and `authorize(allowedRoles)`.
  2. Row-level security scopes Store Keepers to their assigned locations (`getScopedLocationIds`) and Direct Supervisors to their subordinates (`supervisorId`).
  3. Service operations execute atomic database mutations via Prisma transactions (`$transaction`), evaluating stock availability (`available = onHand - quarantined`), condition transfer restrictions, and approval gates.
  4. Every mutation automatically logs a tamper-proof audit trail record (`AuditLog`) capturing actor, action, object, before/after JSON diffs, reason, and source.
  5. UI components consume REST API endpoints (`src/lib/api.ts`) synchronized with reactive Zustand store state.

## Feature Inventory
Every feature from the Survey phase appears here with its assigned milestone.

| # | Feature ID | Name | Description | Milestone | Source |
|---|------------|------|-------------|-----------|--------|
| 1 | PPE-001 | Add New PPE Item | Create item with time-based lifespan, UOM, assigned locations, and category. | M1 | BD-I443 |
| 2 | PPE-002 | Edit or Deactivate Item | Edit metadata or deactivate; in-use protection blocks deactivation if active issuances exist unless Admin overrides with reason. Code locked after transactions. | M1 | BD-I444 |
| 3 | PPE-003 | Set Item Lifespan | Define time-based lifespan (Value + Unit: Days/Months/Years) for automatic replacement date calculation. | M1 | BD-I445 |
| 4 | PPE-004 | Move Item to Trash / Restore | Soft-delete catalog item to 90-day trash bin with in-use protection and restore capabilities. | M1 | BD-I446 |
| 5 | PPE-005 | View & Filter Catalog | Filter by category, group, risk, status with inline active toggle and low-stock indicators. | M1 | BD-I475 |
| 6 | PPE-006 | View Item Details | Read-only details screen showing item specifications, variants, and stock distribution. | M1 | BD-I476 |
| 7 | PPE-007 | Export / Import Catalog | Export catalog to Excel; import new/updated items with template validation and error reporting. | M1 | BD-I486 |
| 8 | PPE-008 | Add New Attribute | Create global dynamic attribute (Size, Color, Gender) with sortable bilingual values. | M1 | BD-I447 |
| 9 | PPE-009 | Edit Attribute | Modify attribute names, add/remove values; in-use protection blocks removing values used by active items unless Admin overrides with reason. | M1 | BD-I448 |
| 10 | PPE-010 | View & Filter Attributes | Search and filter attributes list with direct active toggle switch. | M1 | BD-I449 |
| 11 | PPE-011 | View Attribute Details | Read-only view showing attribute details, values, and linked item groups. | M1 | BD-I450 |
| 12 | PPE-012 | Move Attribute to Trash / Restore | Trash attribute with in-use protection; restore with all values intact. | M1 | BD-I451 |
| 13 | PPE-013 | Add New Item Group | Create item group, assign attributes, and configure 'Requires gender match' flag. | M1 | BD-I452 |
| 14 | PPE-014 | Edit Item Group | Edit group details; unticking in-use attributes requires documented reason and logs cleared values. | M1 | BD-I453 |
| 15 | PPE-015 | View & Filter Item Groups | Filter item groups list with active toggle switch. | M1 | BD-I454 |
| 16 | PPE-016 | View Item Group Details | Read-only view showing metadata, assigned attributes, and active catalog items. | M1 | BD-I455 |
| 17 | PPE-017 | Move Item Group to Trash / Restore | Trash group with in-use protection; restore preserves assigned attributes. | M1 | BD-I456 |
| 18 | PPE-018 | Add New Location | Create location with required Stock Condition (New, Used, Scrap), Capacity Units, and Store Keepers. | M1 | BD-I457 |
| 19 | PPE-019 | Edit Location | Edit location metadata, capacity, or assigned Store Keepers; Stock Condition and Code locked once stock exists. | M1 | BD-I458 |
| 20 | PPE-020 | View & Filter Locations | Search and filter locations; hard block on deactivating locations holding stock (scrap exempt) or sole item location. | M1 | BD-I459 |
| 21 | PPE-021 | View Location Details | Read-only view of location, stock condition, capacity units, capacity used (%), and assigned keepers. | M1 | BD-I460 |
| 22 | PPE-022 | Move Location to Trash / Restore | Trash empty location; hard block on trashing location holding stock. | M1 | BD-I461 |
| 23 | PPE-023 | Restrict Store Keeper Access | Assign Store Keepers to locations via matrix table; enforce row-level scoping across all inventory and transactions. | M1 | BD-I462 |
| 24 | PPE-024 | Transfer Stock | Move stock batches between locations; enforce condition rules (Used->New blocked, Scrap outbound blocked). | M2 | BD-I464 |
| 25 | PPE-025 | View Stock Levels & Low Stock | View On Hand, Quarantined, and Available stock with per-location reorder level alert badges. | M2 | BD-I466 |
| 26 | PPE-026 | Post Opening Balance | Initialize inventory at go-live (`ADJ-OB-YYYY-NNNNN`) with HSE Supervisor approval for Category III. | M2 | NEW-01 |
| 27 | PPE-027 | Record Stock IN | Record stock receipts and count corrections (`ADJ-IN-YYYY-NNNNN`); Category III corrections require HSE approval. | M2 | NEW-02 |
| 28 | PPE-028 | Record Stock OUT | Non-issuance deductions and quarantine placement (`ADJ-OUT-YYYY-NNNNN`); Category III write-offs require HSE approval. | M2 | NEW-03 |
| 29 | PPE-029 | Add New Job-Specific Kit | Define bundle of PPE items for a Job Position with default quantities and suggested variants. | M2 | BD-I469 |
| 30 | PPE-030 | Edit Kit | Modify kit details; changing position of sole active kit with issuances < 90 days requires Admin override. | M2 | BD-I477 |
| 31 | PPE-031 | View & Filter Kits List | Filter kits list by Job Position or Status with direct active toggle switch. | M2 | BD-I478 |
| 32 | PPE-032 | View Kit Details | Read-only view showing kit metadata, line items, and recent issuance counts. | M2 | BD-I479 |
| 33 | PPE-033 | Move Kit to Trash / Restore | Trash kit with sole-active protection; restore brings back line items. | M2 | BD-I480 |
| 34 | PPE-034 | Issue Single Item to Employee | Issue PPE to employee (`ISS-YYYY-NNNNN`) with dual signatures, gender validation, and replacement clock start. | M3 | BD-I467 |
| 35 | PPE-035 | Auto-Suggest & Issue Kit | Auto-suggest kit by employee position, confirm variants, single signature pair covers transaction. | M3 | BD-I468 |
| 36 | PPE-036 | Issue Loan to Visitor/Contractor | Multi-line PPE loan (`LN-YYYY-NNNNN`) with expected return date, Used-location default, and dual signatures. | M3 | BD-I470 |
| 37 | PPE-037 | Return Loaned Item | Close loaned lines with return date, condition inspection, dual signatures, and auto-scrap routing. | M3 | BD-I471 |
| 38 | PPE-038 | Return Item & Auto-Scrap | Process employee return: Good -> Used location, Damaged/Worn Out -> auto-scrap to Scrap location, Lost -> closed. Dual signatures mandatory. | M3 | BD-I472 |
| 39 | PPE-039 | Send Replacement Reminders | Automated nightly job alerting Store Keepers and Employees before Expected Replacement Date; excludes Terminated/Transferred. | M3 | BD-I473 |
| 40 | PPE-040 | Replacements Due Screen | Centralized view of Upcoming (yellow) and Overdue (red) items with one-click 'Issue Replacement' action. | M3 | NEW-07 |
| 41 | PPE-041 | Open Loans List | Master loan directory tracking Open, Overdue (red), Partially Returned, and Closed loans with late counter. | M3 | NEW-08 |
| 42 | PPE-042 | View & Filter Employee List | Read-only directory connected to Employee Master; flags Terminated/Transferred staff as 'No reminders'. | M3 | BD-I488 |
| 43 | PPE-043 | View Employee Details & Timeline | Employee profile with complete reverse-chronological PPE issuance timeline, signatures, and PDF export. | M3 | BD-I489 |
| 44 | PPE-044 | Import Historical Issuances | Bulk import legacy paper issuances from Excel; marked 'Imported' with zero stock deduction and no signatures. | M3 | NEW-09 |
| 45 | PPE-045 | Interactive Stock Movement Trend | Stacked area chart showing Issued, Returned, and Scrapped movements with zoom and series toggles. | M4 | BD-I490 |
| 46 | PPE-046 | Location Capacity Stacked Bar | Horizontal stacked bar chart showing Available, Quarantined, and Empty Space per location. | M4 | BD-I491 |
| 47 | PPE-047 | Top Job Kits Chart | Horizontal bar chart of top 5 issued kits with one-click instant issuance launcher. | M4 | BD-I492 |
| 48 | PPE-048 | Shared Trash Bin | Unified 90-day trash bin across all entities with parent dependency checks, code collision remapping, and permanent retention for transacted items. | M4 | NEW-04 |
| 49 | PPE-049 | Immutable Audit Log Viewer | Centralized audit log capturing all mutations with before/after JSON diffs, 7-year retention flag, and Excel export. | M4 | NEW-05 |
| 50 | PPE-050 | Module Settings | System configuration: reminder lead times per site (1-90 days), kit recent window (90 days), trash retention (>= 30 days). | M4 | NEW-06 |

## Global Rules Inventory
- **G1**: Immutable Audit Trail (retained for 7 years; tamper-proof, capturing actor, action, object, before/after diffs, reason, and source).
- **G2**: In-Use Protection & Admin Override; Hard Block on deleting/deactivating locations holding stock (`onHand > 0`), open loans, or sole item assignment.
- **G3**: Dynamic Variants derived from Item Group Attributes (no hardcoded gender/size on items).
- **G4**: Gender-Matching Validation when Item Group has `requiresGenderMatch = true`.
- **G5**: Time-Based Lifespan Tracking (`expectedReplacementDate = issueDate + lifespanValue * unit`).
- **G6**: Stock Conditions (`New`, `Used`, `Scrap`) and Transfer Restrictions (`Used -> New` BLOCKED, `Scrap -> Any` BLOCKED, `Any -> Scrap` via transfer BLOCKED).
- **G7**: Dual-Signature Capture (Store Keeper + Recipient) mandatory on all single issuances, kit issuances, visitor loans, and returns.
- **G8**: Visitor / Contractor Multi-Line Loans (`LN-YYYY-NNNNN`) with expected return dates, overdue alerts, and partial returns.
- **G9**: Available Stock Formula (`Available = On Hand - Quarantined`) and per-location reorder level alerts.
- **G10**: Shared 90-Day Trash Bin preserving historical records permanently and validating parent references upon restore.
- **G11**: Configurable Module Settings applied dynamically without server restart.
- **G12**: Lifecycle Filtering: Terminated and Transferred employees marked "No reminders" and omitted from replacement queues and notifications.
- **G13**: Complete Bilingual Arabic & English Support with native RTL layout and dual-name modeling.
- **G14**: HSE Supervisor Approval Gate for Risk Category III stock adjustments and Opening Balances.

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Master Data & System Foundation | Epics 1–4 (PPE-001..PPE-023), Prisma schema extensions (`Employee`, `Location`, `ItemGroup`, `AuditLog`, `ModuleSettings`), `npm run db:seed` fix, In-use protection (G2), Dynamic attributes & variants (G3), Lifespan (G5), Stock conditions (G6), Bilingual & RTL setup (G13). | none | DONE |
| M2 | Stock & Kit Management | Epics 5–6 (PPE-024..PPE-033), Stock balance calculations (`Available = On Hand - Quarantined`, G9), Opening Balances, Stock IN, Stock OUT, Stock Transfers, Location capacity tracking, Job-specific kit definitions, Risk Cat III HSE approval gate (G14), Transfer restrictions (G6). | M1 | IN_PROGRESS |
| M3 | Issuance, Loans, Returns & Tracking | Epics 7–8 (PPE-034..PPE-044), Single item issuance, Job-specific kit issuance, Visitor/contractor loans (`LN-YYYY-NNNNN`), Returns with auto-scrap routing (G6), Dual signatures (G7), Gender matching (G4), Terminated employee omission (G12), Employee timeline, Historical import (`NEW-09`). | M2 | PLANNED |
| M4 | Dashboards, Audit & Administration | Epics 9–10 (PPE-045..PPE-050), Analytics dashboards (Trend, Capacity, Top Kits), 90-day Trash Bin (G10), Immutable Audit Log viewer (G1), Module Settings (G11), Route guards in `App.tsx`, RTL logical CSS and Arabic font polish. | M3 | PLANNED |
| M5 | Final E2E Test Pass & Adversarial Hardening | Phase 1: 100% pass of E2E Test Suite (Tiers 1–4). Phase 2: Adversarial coverage hardening (Tier 5) with Challenger -> Worker -> Reviewer loop. | M4, E2E-TEST | PLANNED |

## Parallel Testing Track

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E-TEST | E2E Testing Suite Track | Design and build comprehensive opaque-box test runner, harness, and test cases covering Tier 1 (250 tests), Tier 2 (250 tests), Tier 3 (50 pairwise tests), Tier 4 (25 application workflows). Publishes `TEST_READY.md`. | none | DONE |

## Interface Contracts

### Master Data (M1) ↔ Stock & Operations (M2, M3)
- `Location`: `{ id: string, code: string, nameEn: string, nameAr: string, site: string, locationType: LocationType, stockCondition: 'New' | 'Used' | 'Scrap', capacityUnits: number, openingBalanceStatus: 'Open' | 'Closed', active: boolean }`
- `PPEItem`: `{ id: string, itemCode: string, nameEn: string, nameAr: string, category: string, itemGroupId: string, riskCategory: 'Category I' | 'Category II' | 'Category III', lifespanValue: number, lifespanUnit: 'Days' | 'Months' | 'Years', uom: string, active: boolean }`
- `Employee`: `{ id: string, employeeCode: string, name: string, gender: 'Male' | 'Female', jobPositionId: string, supervisorId?: string, department: string, site: string, status: 'Active' | 'Terminated' | 'Transferred', role: Role }`
- In-use check contract: `GET /api/ppe-items/:id/in-use -> { inUse: boolean, activeIssuanceCount: number, activeStockCount: number }`

### Stock Balance & Adjustments (M2) ↔ Issuance & Returns (M3)
- `StockBalance`: `{ id: string, locationId: string, itemId: string, variantKey: string, quantityOnHand: number, quarantinedQuantity: number, availableQuantity: number }`
  - Formula: `availableQuantity = quantityOnHand - quarantinedQuantity`
- `StockAdjustment`: `{ id: string, adjustmentNumber: string, type: 'IN' | 'OUT' | 'OPENING_BALANCE' | 'TRANSFER', locationId: string, toLocationId?: string, itemId: string, variantKey: string, quantity: number, riskCategory: string, reasonCategory: string, reasonDetail: string, status: 'pending' | 'approved' | 'rejected' | 'applied', approvedBy?: string }`
  - G14 rule: if `riskCategory === 'Category III'`, status MUST be `'pending'` until HSE Supervisor approves.
- Transfer verification:
  - If `fromLocation.stockCondition === 'Used'` and `toLocation.stockCondition === 'New'` -> HTTP 400 "Used stock cannot be transferred to New locations".
  - If `fromLocation.stockCondition === 'Scrap'` -> HTTP 400 "Stock in Scrap location cannot be transferred".
  - If `toLocation.stockCondition === 'Scrap'` via transfer endpoint -> HTTP 400 "Stock can only enter Scrap via return or stock out".

### Issuance & Loans (M3) ↔ Audit & Governance (M4)
- `Issuance`: `{ id: string, issuanceNumber: string, employeeId?: string, holderName?: string, holderType: 'Employee' | 'Visitor' | 'Contractor', itemId: string, variantKey: string, quantity: number, issueDate: string, expectedReplacementDate: string, storeKeeperSignature: string, receiverSignature: string, status: 'Active' | 'Returned' | 'Scrapped' | 'Lost' | 'Replaced' }`
- `IssuanceReturn`: `{ id: string, issuanceId: string, quantityReturned: number, condition: 'Good' | 'Damaged' | 'Worn Out' | 'Lost', returnedToLocationId: string, returnDate: string, storeKeeperSignature: string, returnerSignature: string, status: 'Processed' }`
- `AuditLog`: `{ id: string, timestamp: string, userId: string, userRole: string, objectType: string, objectReference: string, action: string, beforeValues?: string, afterValues?: string, reason?: string, source: 'Screen' | 'Import' | 'System Job', retentionFlag: '7_YEARS' }`

## Code Layout

### Backend (`server/`)
- `server/src/index.ts`: Server entry point.
- `server/src/app.ts`: Express application setup and router mounts.
- `server/src/routes/`: Route definitions with role guards and Zod validators (`auth.ts`, `locations.ts`, `attributes.ts`, `itemGroups.ts`, `ppeItems.ts`, `kits.ts`, `employees.ts`, `stock.ts`, `issuances.ts`, `auditLogs.ts`, `trash.ts`, `settings.ts`, `dashboard.ts`).
- `server/src/services/`: Core domain business logic and atomic transactions (`stockService.ts`, `issuanceService.ts`, `auditService.ts`).
- `server/src/middleware/`: Auth, role guarding, location scoping, input validation, error handling (`auth.ts`, `roleGuard.ts`, `validate.ts`, `errorHandler.ts`).
- `prisma/schema.prisma`: SQLite database schema definition.
- `prisma/seed.ts`: Seed script populating master data, kits, stock, issuances, and settings.
- `server/test-comprehensive.ts`: Automated backend API and business rule integration test suite.

### Frontend (`src/`)
- `src/App.tsx`: Main route definitions, role guards, layout wrapping.
- `src/components/layout/`: App layout, sidebar, navigation, persona toolbar (`Layout.tsx`).
- `src/components/ui/`: Reusable primitives (`SignaturePad.tsx`, `StatusBadge.tsx`, `JsonDiffViewer.tsx`, `SlideOverDrawer.tsx`, `AdminOverrideModal.tsx`).
- `src/components/dashboard/`: Interactive charts (`StockTrendChart.tsx`, `LocationCapacityChart.tsx`, `TopJobKitsChart.tsx`).
- `src/pages/`: Feature pages corresponding to Epics 1–10 (`Catalog.tsx`, `Attributes.tsx`, `ItemGroups.tsx`, `Locations.tsx`, `Kits.tsx`, `Stock.tsx`, `StockAdjustments.tsx`, `Transfers.tsx`, `Issuances.tsx`, `IssuanceForm.tsx`, `IssueKitForm.tsx`, `IssueLoanForm.tsx`, `OpenLoans.tsx`, `ReplacementsDue.tsx`, `Employees.tsx`, `EmployeeDetail.tsx`, `HistoricalImport.tsx`, `Dashboard.tsx`, `TrashBin.tsx`, `AuditLogs.tsx`, `ModuleSettings.tsx`).
- `src/store/`: Zustand state stores (`useStore.ts`, `mockData.ts`).
- `src/lib/`: API HTTP client (`api.ts`).
- `src/i18n/`: Bilingual translation dictionary and RTL direction store (`translations.ts`, `useTranslation.ts`).
