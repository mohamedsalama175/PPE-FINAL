# Opaque-Box E2E Testing Infrastructure: PPE Module

## 1. Test Philosophy

The PPE (Personal Protective Equipment) Module test suite is engineered as a pure **Opaque-Box, Requirement-Driven End-to-End (E2E) Test Harness**.

### Core Tenets
1. **Opaque-Box Boundary**: Tests interact strictly through the public HTTP REST API surface (`/api/*`) exactly as an external client, browser application, or external system integration does. Internal implementation details (private methods, intermediate variables, internal helper routines) are never accessed directly by tests.
2. **Authoritative Specification Grounding**: Expected inputs, behaviors, status codes, payload structures, and error responses are derived authoritatively from `ORIGINAL_REQUEST.md`, `PROJECT.md`, and the 50 user story specifications in `PPE_Module_Updated_User_Stories.md`.
3. **No Facade or Trivial Tests**: Every test case exercises real network, HTTP parsing, authentication, role authorization, schema validation, Prisma ORM transactions, SQLite database persistence, and audit log generation.
4. **Self-Contained & Deterministic**: Each test or suite establishes its own test fixtures, unique identifiers (e.g. timestamps/random suffixes), and verifies both state transitions and database side-effects through public query endpoints.
5. **Multi-Persona Security Verification**: Tests authenticate as realistic personas across all 5 system roles:
   - **Admin** (`EMP-001`): Full system privileges, can override in-use restrictions with logged reason.
   - **HSE Supervisor** (`EMP-002`): Master data maintenance, Category III approval authority, opening balance approvals.
   - **Direct Supervisor** (`EMP-003`): Team oversight, issuance and return execution.
   - **Store Keeper** (`EMP-008` Cairo, `EMP-011` Alexandria, `EMP-013` Unassigned): Warehouse operations, scoped strictly to assigned locations.
   - **Employee / Worker** (`EMP-004`): Non-privileged personnel, read-only self issuances, blocked from operational mutations (HTTP 403).

---

## 2. Feature Inventory (PPE-001 to PPE-050) & Global Rules (G1 to G14)

### 2.1 Feature Inventory

| ID | Feature Name | Epic | Primary Endpoint(s) | Key Requirements & Error Rules |
|---|---|---|---|---|
| **PPE-001** | Add New PPE Item | Epic 1: Catalog | `POST /api/ppe-items` | Time-based lifespan, UOM, assigned locations, category. Duplicate code blocked (400/409). |
| **PPE-002** | Edit or Deactivate Item | Epic 1: Catalog | `PUT /api/ppe-items/:id`, `PATCH /api/ppe-items/:id/active` | In-use protection blocks deactivation if active issuances exist unless Admin overrides. |
| **PPE-003** | Set Item Lifespan | Epic 1: Catalog | `POST /api/ppe-items`, `PUT /api/ppe-items/:id` | Positive value + unit (Days/Months/Years). Empty or negative values blocked. |
| **PPE-004** | Move Item to Trash / Restore | Epic 1: Catalog | `DELETE /api/ppe-items/:id`, `POST /api/ppe-items/:id/restore` | Soft delete sets `deletedAt`. Restore clears `deletedAt` and reactivates item. |
| **PPE-005** | View & Filter Catalog | Epic 1: Catalog | `GET /api/ppe-items` | Filtering by search text, category, item group, active status, pagination. |
| **PPE-006** | View Item Details | Epic 1: Catalog | `GET /api/ppe-items/:id` | Read-only details with linked locations and variant attribute values. 404 for unknown ID. |
| **PPE-007** | Export / Import Catalog | Epic 1: Catalog | `GET /api/ppe-items/export`, `POST /api/ppe-items/import` | Export returns CSV stream with headers. Import handles file uploads and parsing. |
| **PPE-008** | Add New Attribute | Epic 2: Attributes | `POST /api/attributes` | Unique code, bilingual names, repeatable sorted values. Duplicate code blocked. |
| **PPE-009** | Edit Attribute | Epic 2: Attributes | `PUT /api/attributes/:id` | Update names, add/remove values. In-use protection on active values. |
| **PPE-010** | View & Filter Attributes | Epic 2: Attributes | `GET /api/attributes` | Search by code/name, filter by active status, pagination metadata. |
| **PPE-011** | View Attribute Details | Epic 2: Attributes | `GET /api/attributes/:id` | Returns attribute with child values and linked item groups. |
| **PPE-012** | Move Attribute to Trash / Restore | Epic 2: Attributes | `DELETE /api/attributes/:id`, `POST /api/attributes/:id/restore` | Soft delete to trash bin; restore recovers values intact. |
| **PPE-013** | Add New Item Group | Epic 3: Item Groups | `POST /api/item-groups` | Code, bilingual names, assigned attribute IDs. Gender match flag requires GENDER attribute. |
| **PPE-014** | Edit Item Group | Epic 3: Item Groups | `PUT /api/item-groups/:id` | Modify metadata, update linked attributes. Logs audit trail. |
| **PPE-015** | View & Filter Item Groups | Epic 3: Item Groups | `GET /api/item-groups` | Search by name/code, active toggle filtering, pagination. |
| **PPE-016** | View Item Group Details | Epic 3: Item Groups | `GET /api/item-groups/:id` | Details view showing assigned attributes and linked items. |
| **PPE-017** | Move Item Group to Trash / Restore | Epic 3: Item Groups | `DELETE /api/item-groups/:id`, `POST /api/item-groups/:id/restore` | Soft delete to trash; restore validates child dependencies. |
| **PPE-018** | Add New Location | Epic 4: Locations | `POST /api/locations` | Code, bilingual names, site, location type, capacity units, assigned store keepers. |
| **PPE-019** | Edit Location | Epic 4: Locations | `PUT /api/locations/:id` | Modify metadata, capacity, sync store keeper assignments. |
| **PPE-020** | View & Filter Locations | Epic 4: Locations | `GET /api/locations`, `PATCH /api/locations/:id/active` | Filter by site/type/active. Hard block on deactivating location with stock on hand. |
| **PPE-021** | View Location Details | Epic 4: Locations | `GET /api/locations/:id` | View capacity units, assigned keepers. 404 on missing location. |
| **PPE-022** | Move Location to Trash / Restore | Epic 4: Locations | `DELETE /api/locations/:id`, `POST /api/locations/:id/restore` | Hard block on deleting location holding stock on hand (`quantityOnHand > 0`). |
| **PPE-023** | Restrict Store Keeper Access | Epic 4: Locations | `GET /api/stock/balances`, `GET /api/stock/adjustments` | Store Keepers restricted to assigned locations only; unassigned keeper gets empty data. |
| **PPE-024** | Transfer Stock | Epic 5: Stock Operations | `POST /api/stock/transfers` | Move batches between locations. Transfer from Scrap/Used to General blocked. |
| **PPE-025** | View Stock Levels & Low Stock | Epic 5: Stock Operations | `GET /api/stock/balances` | Query balances by status (`low_stock`, `out_of_stock`, `in_stock`), scoped by keeper. |
| **PPE-026** | Post Opening Balance | Epic 5: Stock Operations | `POST /api/opening-balances`, `PATCH .../submit`, `PATCH .../approve` | Draft opening balance, submit for approval, HSE Supervisor approval posts batches. |
| **PPE-027** | Record Stock IN | Epic 5: Stock Operations | `POST /api/stock/adjustments` (type: IN) | New Delivery posts immediately; Manual Correction sets status to pending review. |
| **PPE-028** | Record Stock OUT | Epic 5: Stock Operations | `POST /api/stock/adjustments` (type: OUT) | Stock write-off and damage deductions. Negative delta decrements stock and batch. |
| **PPE-029** | Add New Job-Specific Kit | Epic 6: Kit Management | `POST /api/kits` | Kit definition for job position with line items and quantities. Zero items blocked. |
| **PPE-030** | Edit Kit | Epic 6: Kit Management | `PUT /api/kits/:id` | Modify kit name, job position, item lines. In-use protection for active kit. |
| **PPE-031** | View & Filter Kits List | Epic 6: Kit Management | `GET /api/kits`, `PATCH /api/kits/:id/active` | Search by name, filter by job position and active flag. |
| **PPE-032** | View Kit Details | Epic 6: Kit Management | `GET /api/kits/:id` | Details screen showing kit items, quantities, and job position. |
| **PPE-033** | Move Kit to Trash / Restore | Epic 6: Kit Management | `DELETE /api/kits/:id`, `POST /api/kits/:id/restore` | Soft delete kit to trash bin; restore preserves kit items. |
| **PPE-034** | Issue Single Item to Employee | Epic 7: Issuance & Loans | `POST /api/issuances` | Single item issuance, dual signatures mandatory, stock deduction, replacement date calculation. |
| **PPE-035** | Auto-Suggest & Issue Kit | Epic 7: Issuance & Loans | `POST /api/issuances` (kitId) | Bundle issuance covering all kit items in atomic transaction; single signature pair. |
| **PPE-036** | Issue Loan to Visitor/Contractor | Epic 7: Issuance & Loans | `POST /api/issuances` (holderName) | Multi-line loan with `expectedReturnDate`, dual signatures, holder name/type. |
| **PPE-037** | Return Loaned Item | Epic 7: Issuance & Loans | `POST /api/issuances/:id/return` | Return loan with condition (`good`, `damaged`, `lost`); closes loan and updates stock. |
| **PPE-038** | Return Item & Auto-Scrap | Epic 7: Issuance & Loans | `POST /api/issuances/:id/return` | Damaged/worn-out returns with physical receipt auto-route to Scrap location (`ScrapEntry`). |
| **PPE-039** | Send Replacement Reminders | Epic 7: Issuance & Loans | `GET /api/dashboard/stats` | Calculates expiring soon issuances within lead time window; excludes terminated staff. |
| **PPE-040** | Replacements Due Screen | Epic 7: Issuance & Loans | `GET /api/issuances` (replacement query) | Centralized view of issued items needing replacement with computed expiry dates. |
| **PPE-041** | Open Loans List | Epic 7: Issuance & Loans | `GET /api/issuances?openLoansOnly=true` | Master directory of open loans; overdue items identified where `expectedReturnDate < now`. |
| **PPE-042** | View & Filter Employee List | Epic 8: Tracking | `GET /api/employees` | Search employees, filter by role/job position/status; read-only directory. |
| **PPE-043** | View Employee Details & Timeline | Epic 8: Tracking | `GET /api/employees/:id`, `GET /api/issuances?employeeId=:id` | Comprehensive employee profile with reverse-chronological PPE issuance history. |
| **PPE-044** | Import Historical Issuances | Epic 8: Tracking | `POST /api/issuances` (historical flag) | Bulk legacy issuance records with zero stock deduction and historical dates. |
| **PPE-045** | Interactive Stock Movement Trend | Epic 9: Dashboards | `GET /api/stock/movements` | Query historical stock movements (adjustments, transfers, receipts) with timestamps. |
| **PPE-046** | Location Capacity Stacked Bar | Epic 9: Dashboards | `GET /api/locations`, `GET /api/stock/balances` | Location capacity units vs quantity on hand calculation. |
| **PPE-047** | Top Job Kits Chart | Epic 9: Dashboards | `GET /api/kits`, `GET /api/issuances` | Top issued kits metrics and job position distribution. |
| **PPE-048** | Shared Trash Bin | Epic 10: Administration | `GET /api/trash` | Unified view of deleted Items, Attributes, Item Groups, Locations, and Kits. |
| **PPE-049** | Immutable Audit Log Viewer | Epic 10: Administration | `GET /api/audit-logs` | Tamper-proof audit logs recording entity mutations, actor, action, and timestamp. |
| **PPE-050** | Module Settings | Epic 10: Administration | `GET /api/expiry-settings`, `PUT /api/expiry-settings` | Configurable lead times per category; dynamic update without restart. |

### 2.2 Global Rules Inventory (G1 to G14)

- **G1 (Immutable Audit Trail)**: Every state mutation writes an immutable `AuditLog` entry capturing `performedBy`, `entityType`, `entityId`, `action`, and timestamp.
- **G2 (In-Use Protection & Hard Block)**: Entities with active dependencies cannot be deactivated or trashed without override; locations with `quantityOnHand > 0` are hard-blocked from deletion or deactivation.
- **G3 (Dynamic Variants)**: Dynamic variants derive from Item Group attributes (`SIZE`, `COLOR`, `GENDER`), not hardcoded on items.
- **G4 (Gender-Matching Rules)**: Issuances of items in groups requiring gender match enforce compatibility with employee profile.
- **G5 (Time-Based Lifespan)**: Lifespan is strictly time-based (Value + Unit: Days/Months/Years); starts at issuance date.
- **G6 (Stock Conditions & Transfer Restrictions)**: Transfers out of Scrap/Used into New/General/Central locations are strictly blocked (400).
- **G7 (Dual-Signature Capture)**: Store Keeper and recipient signatures are mandatory for issuances, loans, and returns.
- **G8 (Visitor/Contractor Multi-Line Loans)**: Loans tracked via `expectedReturnDate` with overdue alerts and return processing.
- **G9 (Available Stock Formula)**: Available stock equals On-Hand minus Quarantined; low stock detected when available drops below reorder level.
- **G10 (Shared 90-Day Trash Bin)**: Unified trash endpoint preserves deleted records and permits validated restore.
- **G11 (Configurable Module Settings)**: Expiry and reminder lead times are configurable via API and applied immediately.
- **G12 (Lifecycle Filtering)**: Terminated and transferred employees cease receiving active replacement alerts.
- **G13 (Bilingual Arabic/English Support)**: All core entities support dual names (`nameEn`, `nameAr`) and bilingual filtering.
- **G14 (HSE Supervisor Approval Gate)**: High-risk Category III adjustments and Opening Balances require explicit approval by HSE Supervisor (`EMP-002`).

---

## 3. Test Architecture

### 3.1 Invocation & Execution
The test runner is executed directly via npm:
```bash
npm run test:e2e
```
This runs `tsx tests/e2e/runner.ts`, which:
1. Boots an in-memory Express HTTP server instance on an ephemeral random OS port (`app.listen(0)`).
2. Authenticates initial personas (Admin, HSE Supervisor, Store Keeper, Employee) to acquire valid JWT bearer tokens.
3. Automatically executes all test suites across Tiers 1 through 4 in sequence.
4. Collects execution metrics (duration, assertions passed, tests failed, skipped).
5. Emits a clean color-coded hierarchical console report and exits with code 0 on complete pass (or code 1 on failure).

### 3.2 Test Harness Layout
```
tests/e2e/
├── harness/
│   ├── client.ts         # Lightweight typed HTTP client wrapping native fetch with auth headers
│   ├── context.ts        # Server lifecycle manager, ephemeral port binding, token cache
│   └── assertions.ts     # Rich assertion utilities (assertStatus, assertEqual, assertMatch, etc.)
├── tier1_features/       # Tier 1: 50 features * 5 tests = 250 tests
│   ├── epic01_catalog.test.ts      # PPE-001 through PPE-007 (35 tests)
│   ├── epic02_attributes.test.ts   # PPE-008 through PPE-012 (25 tests)
│   ├── epic03_item_groups.test.ts  # PPE-013 through PPE-017 (25 tests)
│   ├── epic04_locations.test.ts    # PPE-018 through PPE-023 (30 tests)
│   ├── epic05_stock.test.ts        # PPE-024 through PPE-028 (25 tests)
│   ├── epic06_kits.test.ts         # PPE-029 through PPE-033 (25 tests)
│   ├── epic07_issuances.test.ts    # PPE-034 through PPE-041 (40 tests)
│   ├── epic08_employees.test.ts    # PPE-042 through PPE-044 (15 tests)
│   ├── epic09_dashboards.test.ts   # PPE-045 through PPE-047 (15 tests)
│   └── epic10_admin.test.ts        # PPE-048 through PPE-050 (15 tests)
├── tier2_boundaries/     # Tier 2: 50 features * 5 boundary/corner tests = 250 tests
│   ├── epic01_boundaries.test.ts   # Catalog boundaries (35 tests)
│   ├── epic02_boundaries.test.ts   # Attribute boundaries (25 tests)
│   ├── epic03_boundaries.test.ts   # Item Group boundaries (25 tests)
│   ├── epic04_boundaries.test.ts   # Location boundaries (30 tests)
│   ├── epic05_boundaries.test.ts   # Stock boundaries (25 tests)
│   ├── epic06_boundaries.test.ts   # Kit boundaries (25 tests)
│   ├── epic07_boundaries.test.ts   # Issuance boundaries (40 tests)
│   ├── epic08_boundaries.test.ts   # Employee boundaries (15 tests)
│   ├── epic09_boundaries.test.ts   # Dashboard boundaries (15 tests)
│   └── epic10_boundaries.test.ts   # Admin boundaries (15 tests)
├── tier3_interactions/   # Tier 3: Cross-Feature Interactions = 50 tests
│   └── interactions.test.ts        # 50 pairwise interaction tests
├── tier4_workloads/      # Tier 4: Real-World Workflows = 25 tests
│   └── workloads.test.ts           # 25 multi-step end-to-end workflows
└── runner.ts             # Main test runner entry point
```

---

## 4. Coverage Goals & Minimum Thresholds

| Test Tier | Description | Minimum Target | Actual Target in Suite |
|---|---|---|---|
| **Tier 1** | Primary Feature Coverage (>=5 tests per feature across 50 features) | 250 | 250 |
| **Tier 2** | Boundary & Corner Cases (>=5 tests per feature across 50 features) | 250 | 250 |
| **Tier 3** | Cross-Feature Pairwise Interactions | 50 | 50 |
| **Tier 4** | Real-World Multi-Step Production Workloads | 25 | 25 |
| **Total** | **Comprehensive Opaque-Box E2E Test Suite** | **575** | **575** |

### Tier 1 Breakdown
- **Epic 1 (Catalog PPE-001..PPE-007)**: 35 tests covering creation, retrieval, metadata updates, active toggles, lifespan setting, soft deletion, restore, and CSV export.
- **Epic 2 (Attributes PPE-008..PPE-012)**: 25 tests covering attribute creation, bilingual names, value sorting, list filtering, detail inspection, trash, and restore.
- **Epic 3 (Item Groups PPE-013..PPE-017)**: 25 tests covering item group creation, attribute assignment, gender flag handling, group editing, list filtering, details, and restore.
- **Epic 4 (Locations PPE-018..PPE-023)**: 30 tests covering location creation, capacity configuration, store keeper assignments, site filtering, details inspection, empty trash, and keeper scoping.
- **Epic 5 (Stock PPE-024..PPE-028)**: 25 tests covering stock transfers, balance queries, low stock alerts, opening balance draft/submit/approve, Stock IN delivery, and Stock OUT deductions.
- **Epic 6 (Kits PPE-029..PPE-033)**: 25 tests covering kit definitions, job position links, line items, metadata updates, status filters, kit details, trash, and restore.
- **Epic 7 (Issuances PPE-034..PPE-041)**: 40 tests covering single item issuances, kit issuances, visitor loans, good returns, auto-scrap damaged returns, replacements due calculations, and open loans list.
- **Epic 8 (Employees PPE-042..PPE-044)**: 15 tests covering employee directory search, role/department filters, employee profile timeline, and historical issuance import.
- **Epic 9 (Dashboards PPE-045..PPE-047)**: 15 tests covering stock movement trends, location capacity stats, top issued kits, and dashboard summary counters.
- **Epic 10 (Admin PPE-048..PPE-050)**: 15 tests covering shared trash bin aggregation, immutable audit log queries, and configurable module expiry settings.

### Tier 2 Breakdown
- 250 boundary and negative tests covering invalid IDs (404), unauthorized role attempts (403), duplicate unique codes (400/409), missing required signatures (400), insufficient stock (400), invalid transfer conditions (400), deactivating locations holding stock (400), and schema validation failures (400).

### Tier 3 Breakdown
- 50 pairwise integration tests validating cross-feature dependencies:
  - Add Item + Opening Balance (PPE-001 + PPE-026)
  - Add Item + Stock Transfer (PPE-001 + PPE-024)
  - Attributes + Item Group (PPE-008 + PPE-013)
  - Item Group + Gender Match Validation (PPE-013 + PPE-034)
  - Location + In-Use Hard Block on Stock (PPE-018 + PPE-020)
  - Location + In-Use Hard Block on Trash (PPE-018 + PPE-022)
  - Location + Transfer Condition Restriction (PPE-018 + PPE-024)
  - Location + Store Keeper Scoping (PPE-018 + PPE-023)
  - Stock IN + Approval Gate (PPE-027 + G14)
  - Stock OUT + Balance Reduction (PPE-028 + PPE-025)
  - Kit Definition + Kit Issuance (PPE-029 + PPE-035)
  - Kit Issuance + Multi-Item Stock Deduction (PPE-035 + PPE-025)
  - Single Issuance + Lifespan Calculation (PPE-034 + PPE-003)
  - Single Issuance + Dual Signatures (PPE-034 + G7)
  - Issuance Return + Good Condition Restock (PPE-038 + PPE-024)
  - Issuance Return + Auto-Scrap Routing (PPE-038 + G6)
  - Visitor Loan + Overdue Alert (PPE-036 + PPE-041)
  - Replacement Reminders + Lifecycle Filtering (PPE-039 + PPE-042)
  - Historical Import + Timeline Display (PPE-044 + PPE-043)
  - Shared Trash Bin + Entity Restore (PPE-048 + PPE-004)
  - All Mutations + Audit Log Recording (All + PPE-049 / G1)
  - Module Settings + Dynamic Expiry Thresholds (PPE-050 + PPE-039)
  - *(plus 28 additional pairwise interaction matrices)*

### Tier 4 Breakdown
- 25 complete, end-to-end multi-step workflow pipelines verifying end-to-end operational integrity under real-world conditions.
