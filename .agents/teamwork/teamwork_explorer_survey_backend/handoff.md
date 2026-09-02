# Backend Architecture Survey Report — PPE Module

## 1. Observation

### 1.1 Project Structure & Build Scripts (`package.json`)
- **File**: `d:\Sana Soft2\PRoject Code\PPE-FINAL\package.json`
- **Scripts observed** (lines 6–22):
  - `"dev:server": "tsx watch server/src/index.ts"`
  - `"build:server": "tsc -p tsconfig.server.json"`
  - `"start": "node dist-server/index.js"`
  - `"db:generate": "prisma generate"`
  - `"db:migrate": "prisma migrate dev"`
  - `"db:seed": "tsx prisma/seed.ts"`
  - `"db:studio": "prisma studio"`
  - `"lint": "tsc --noEmit"`
  - **No test script** is defined in `package.json` (e.g., `"test"` is completely missing).
- **Dependencies observed** (lines 23–71):
  - `@prisma/client`: `^5.22.0`
  - `express`: `^4.21.2`
  - `bcryptjs`: `^3.0.3`
  - `jsonwebtoken`: `^9.0.3`
  - `zod`: `^4.5.4`
  - `cors`: `^2.8.6`, `helmet`: `^8.3.0`, `morgan`: `^1.12.0`, `multer`: `^2.3.0`
  - DevDependencies: `prisma`: `^5.22.0`, `tsx`: `^4.21.0`, `typescript`: `~5.8.2`. No Jest or Vitest packages are installed.
- **Server Build Verification**:
  - Command: `npm run build:server`
  - Output: `tsc -p tsconfig.server.json` executed with exit code 0 and generated valid artifacts in `dist-server/`.
  - Typecheck command: `npm run lint` (`tsc --noEmit`) executed with exit code 0.

### 1.2 Prisma Database Configuration & Seed Failure
- **File**: `d:\Sana Soft2\PRoject Code\PPE-FINAL\prisma\schema.prisma`
  - Provider: SQLite (`provider = "sqlite"`), `DATABASE_URL = "file:./prisma/dev.db"`.
  - Migrations: `prisma/migrations/20260902130023_init/migration.sql` with `migration_lock.toml`.
- **Database Seed Execution Failure**:
  - Command: `npm run db:seed`
  - Verbatim error:
    ```
    D:\Sana Soft2\PRoject Code\PPE-FINAL\prisma\seed.ts:16
      mockExpirySettings,
      ^
    SyntaxError: The requested module '../src/store/mockData.js' does not provide an export named 'mockExpirySettings'
    ```
  - Direct cause: `d:\Sana Soft2\PRoject Code\PPE-FINAL\src\store\mockData.ts` exports `mockModuleSettings` (line 1049) instead of `mockExpirySettings`.

### 1.3 Missing Models, Fields, and Relations in Prisma Schema
Comparing `prisma/schema.prisma` against requirements (PPE-001..PPE-050, G1..G14) and frontend domain definitions (`src/types/index.ts`):

1. **Employee (G4, G12, Direct Supervisor Scoping)**:
   - `prisma/schema.prisma` (lines 187–210) currently has: `id`, `employeeCode`, `name`, `jobPositionId`, `role`, `passwordHash`, `active`, `deletedAt`, relations to issuances/adjustments/audit.
   - **Missing**:
     - `gender`: Required for G4 ("Issuance validates gender compatibility against employee profiles when required by the item group").
     - `status` or `employmentStatus` ('Active' | 'Terminated' | 'Transferred'): Required for G12 ("Terminated and transferred employees are omitted from replacement reminders and active replacement queues").
     - `supervisorId`: Self-relation `supervisor Employee?` / `subordinates Employee[]` required for Direct Supervisor scoping ("Direct Supervisors view own team only").
     - `department` and `site`: Required for site-level lead times and employee profile completeness.
2. **Location (G2, G6, PPE-018..023)**:
   - `prisma/schema.prisma` (lines 24–48):
     - Overloads `locationType` to serve as condition and warehouse type.
   - **Missing**:
     - `stockCondition`: First-class field ('New' | 'Used' | 'Scrap') distinct from `locationType` ('Central Warehouse' | 'Site Store' | 'Department Store' | 'General').
     - `openingBalanceStatus`: ('Open' | 'Closed').
     - Location holding stock in-use protection: Route checks `quantityOnHand > 0` but lacks structured logging of deletion attempts.
3. **ItemGroup (G4, PPE-013..017)**:
   - `prisma/schema.prisma` (lines 85–96):
   - **Missing**:
     - `requiresGenderMatch`: Boolean `@default(false)` to control when G4 enforcement applies.
4. **StockBalance & Batch (G6, G9, G14, PPE-024..028)**:
   - `StockBalance` (lines 212–223) only has `quantityOnHand`.
     - **Missing**: `quarantinedQuantity` (Int `@default(0)`), needed for G9 available stock calculation: `available = onHand - quarantined`.
   - `Batch` (lines 225–243):
     - **Missing**: `quarantinedQty` (Int `@default(0)`), `condition` ('New' | 'Reused' | 'Scrapped'), `manufacturerExpiryDate`, `supplierDeliveryNote`, status expansion ('Active' | 'Expiring Soon' | 'Expired' | 'Quarantined' | 'Depleted').
5. **Issuance & IssuanceReturn (G7, PPE-034..041)**:
   - `Issuance` (lines 317–344) has: `storeKeeperSignature`, `receiverSignature`.
   - `IssuanceReturn` (lines 346–357):
     - **Missing**: `storeKeeperSignature` and `returnerSignature` / `receiverSignature`. (G7 mandates dual signatures for every issuance, loan, and return transaction).
     - **Missing**: `quantityReturned` and `returnedToLocationId`.
6. **Visitor Loans (PPE-037, G7)**:
   - Currently overloaded onto `Issuance` (using `holderName` and `holderType: "Visitor" | "Contractor"`).
   - Domain model `src/types/index.ts` (lines 216–244) specifies `VisitorLoan` and `VisitorLoanItem` with multi-line equipment, recipient details, company, host employee ID, and dual signatures on issue & return.
7. **AuditLog (G1, PPE-049)**:
   - `AuditLog` (lines 388–399) only has `details: String?`.
   - Lacks structured audit fields: `beforeValues: String?` (JSON), `afterValues: String?` (JSON), `reason: String?` (for in-use override reason G2), `source: String?` ('Screen' | 'Import' | 'System Job'), and `retentionFlag: String?` ('7_YEARS').
8. **ModuleSettings (G11, PPE-050)**:
   - Schema only contains `ExpirySettings` (lines 379–386).
   - Missing `ModuleSettings` (or key-value `Setting` model) for `reminderLeadTimePerSite`, `recentIssuanceWindowDays`, `trashRetentionDays`, etc.

### 1.4 Express Server Setup & Middleware
- **Entry point**: `server/src/index.ts` creates app via `createApp()`, binds port 4000, serves `dist/` static files.
- **Route registration** in `server/src/app.ts`:
  - 15 routers mounted under `/api/*`: auth, job-positions, locations, attributes, item-groups, ppe-items, kits, employees, stock, opening-balances, issuances, scrap, audit-logs, expiry-settings, trash, dashboard.
- **Controllers & Services**:
  - Directories `server/src/controllers/` and `server/src/services/` exist but are completely empty. All logic is embedded directly within route files using `asyncHandler`.
- **Middleware**:
  - `auth.ts`: Implements JWT verification via `authenticate` and `optionalAuth`.
  - `roleGuard.ts`: `authorize(...allowed)` normalizes role names (`Admin`, `HSE_Supervisor`, `Store_Keeper`, `Direct_Supervisor`, `Employee`).
    - Helper `getScopedLocationIds` scopes Store Keepers to assigned locations.
    - **Gap**: Direct Supervisor scoping is NOT implemented. Direct Supervisors should be restricted to viewing their own team members.
  - `validate.ts`: Uses Zod schemas for request body/query validation.
  - `errorHandler.ts`: Handles Zod, ApiError, Prisma P2002/P2025, and generic 500.

### 1.5 Business Rule Compliance Gaps in Route Handlers
1. **Rule G2 (In-Use Protection & Admin Override)**:
   - `server/src/routes/locations.ts` (lines 104–106): Correctly prevents deleting locations with stock on hand (`balances.length > 0`).
   - `server/src/routes/ppeItems.ts` (line 128): Soft-deletes without checking if active stock balances, issuances, or kits exist.
   - `server/src/routes/jobPositions.ts` (line 67): Soft-deletes without checking linked employees or kits.
   - `server/src/routes/kits.ts` (line 61): Soft-deletes without checking active issuances.
   - `server/src/routes/itemGroups.ts` (line 65) & `attributes.ts` (line 74): Block deletion if linked, but **do not support** Admin override with a recorded reason as required by G2.
2. **Rule G4 (Gender Compatibility)**:
   - `server/src/routes/issuances.ts` (lines 81–166): Does not inspect employee gender or compare against PPEItem gender.
3. **Rule G6 (Restricted Transfers)**:
   - `server/src/routes/stock.ts` (lines 280–282): Only blocks transfers from `Scrap` or `Used` to `General`, `Central_Warehouse`, or `Site_Store`. Does not strictly block movements out of Scrap to other destinations, nor from Used to New locations.
4. **Rule G14 (Risk Category III Adjustments Approval)**:
   - `server/src/routes/stock.ts` (lines 155–156):
     ```ts
     const isManualCorrection = reasonCategory === "Manual Correction";
     const status = isManualCorrection ? "pending" : "applied";
     ```
     Adjustments for Category III items do not force `status = "pending"` unless `reasonCategory === "Manual Correction"`. Under G14, any adjustment on a Category III item must require HSE Supervisor review.

### 1.6 Backend Test Infrastructure
- Two standalone runner scripts exist:
  - `server/test-api.ts`: Basic smoke tests across login, PPE items, balances, dashboard, unauthenticated access, transfers, issuances.
  - `server/test-comprehensive.ts`: End-to-end multi-role tests covering login, job positions, attributes, item groups, stock adjustments, opening balances, issuances, returns, scrap reversal, expiry settings, audit logs, and StoreKeeper scoping.
- Both scripts run using `npx tsx` and pass synchronously with exit code 0.
- Neither script is tied to `npm test` or an assertion framework like Vitest or Jest.

---

## 2. Logic Chain

1. **Prisma Model Incompleteness → Rule Violations**:
   - Because `Employee` lacks `gender`, `Issuance` endpoints cannot validate gender compatibility, violating Acceptance Criterion G4.
   - Because `Employee` lacks `status` / `employmentStatus`, queries for replacement queues and reminders cannot distinguish active from terminated or transferred employees, violating Acceptance Criterion G12.
   - Because `Employee` lacks `supervisorId`, Direct Supervisor data views cannot scope to "own team only".
   - Because `IssuanceReturn` lacks signature fields, returns cannot record dual signatures, violating Acceptance Criterion G7.
   - Because `StockBalance` lacks `quarantinedQuantity`, available stock cannot be calculated as `onHand - quarantined`, violating Acceptance Criterion G9.
2. **Seed Script Failure → Unmet Requirement**:
   - Acceptance Criteria state: "Database seed script (`npm run db:seed`) runs cleanly and populates realistic demonstration data".
   - In `prisma/seed.ts`, line 16 imports `mockExpirySettings` which does not exist in `src/store/mockData.ts`. As observed, `npm run db:seed` immediately crashes with a module resolution SyntaxError.
3. **Route Logic Shortcuts → In-Use Protection & Approval Bypasses**:
   - In `stock.ts`, checking only `reasonCategory === "Manual Correction"` allows Risk Category III stock adjustments with other reason categories to bypass HSE Supervisor approval, violating Acceptance Criterion G14.
   - In delete routes (`ppeItems.ts`, `jobPositions.ts`, `kits.ts`), entities can be deleted while active without verifying dependencies or requiring an Admin override reason, violating Acceptance Criterion G2.
4. **Test Infrastructure Deficiency**:
   - Acceptance criteria require: "Automated integration/unit tests pass, validating audit logging, stock balance calculations, approval gates, and transfer restrictions."
   - Because no `"test"` script is configured in `package.json`, automated CI/CD and verification commands have no standardized target. Integrating `test-comprehensive.ts` or a Vitest test suite with explicit assertions for G1–G14 is mandatory.

---

## 3. Caveats

1. **Database Engine**: The database is SQLite (`prisma/dev.db`). SQLite does not support native enums, so string fields with application-level validation (Zod + TypeScript) are used.
2. **Architecture Pattern**: Handlers are currently written inline in `server/src/routes/*.ts` rather than separated into `server/src/controllers/` and `server/src/services/`. While functioning, consolidating business logic into dedicated services (e.g., `stockService`, `issuanceService`, `auditService`) would improve testability and maintainability.
3. **Visitor Loans**: The system supports visitor/contractor loans either via polymorphic `Issuance` (fields `holderName`, `holderType`) or via dedicated `VisitorLoan` and `VisitorLoanItem` models. Aligning backend schema with `src/types/index.ts` will ensure frontend and backend compatibility.

---

## 4. Conclusion

The existing Express backend provides a strong functional baseline with authentication, role guarding, Zod validation, and comprehensive route scaffolding that builds cleanly with TypeScript (`npm run build:server` succeeds).

However, the backend requires surgical enhancements across three main layers:
1. **Prisma Schema & Migrations**:
   - Add `gender`, `employmentStatus`, `supervisorId`, `department`, `site` to `Employee`.
   - Add `requiresGenderMatch` to `ItemGroup`.
   - Add `stockCondition` and `openingBalanceStatus` to `Location`.
   - Add `quarantinedQuantity` to `StockBalance`, and `quarantinedQty`, `condition`, `manufacturerExpiryDate` to `Batch`.
   - Add dual signatures (`storeKeeperSignature`, `returnerSignature`) to `IssuanceReturn`.
   - Add structured audit fields (`beforeValues`, `afterValues`, `reason`, `source`, `retentionFlag`) to `AuditLog`.
   - Add `ModuleSettings` (or general `Setting`) model.
2. **Route Handler & Business Logic Hardening**:
   - Enforce Rule G2: In-use verification on all soft-deletions with mandatory Admin override reason recorded in `AuditLog`. Hard block on locations with stock.
   - Enforce Rule G4: Gender compatibility check between Employee and PPEItem when `ItemGroup.requiresGenderMatch` is true.
   - Enforce Rule G6: Strict block on transfers from Used to New locations and any stock transfer out of Scrap locations.
   - Enforce Rule G7: Mandate dual signatures on issuances and returns.
   - Enforce Rule G9: Available stock computed as `onHand - quarantined`.
   - Enforce Rule G12: Exclude terminated/transferred employees from replacements and notifications.
   - Enforce Rule G14: Force `status = "pending"` for any stock adjustment on Risk Category III items.
   - Enforce Direct Supervisor scoping in employee and issuance queries.
3. **Database Seed & Test Automation**:
   - Fix `prisma/seed.ts` import mismatch (`mockModuleSettings`) so `npm run db:seed` executes cleanly.
   - Add `"test:server": "tsx server/test-comprehensive.ts"` to `package.json`, extending assertions to explicitly validate all G1–G14 business rules.

---

## 5. Verification Method

### Commands to Run
1. **Server Build**:
   ```bash
   npm run build:server
   ```
   *Expected result*: Exit code 0, clean TypeScript build.
2. **Database Seed**:
   ```bash
   npm run db:seed
   ```
   *Current state*: Fails on `mockExpirySettings` import.
   *Verification after fix*: Completes with exit code 0 and logs seeded counts for all master data, kits, stock, issuances, and settings.
3. **Comprehensive Backend Test**:
   ```bash
   npx tsx server/test-comprehensive.ts
   ```
   *Expected result*: Runs HTTP requests against test server and prints `COMPREHENSIVE DONE` with exit code 0.
4. **Files to Inspect**:
   - `prisma/schema.prisma`
   - `prisma/seed.ts`
   - `server/src/routes/stock.ts` (lines 155–156 for G14, lines 280–282 for G6)
   - `server/src/routes/issuances.ts` (lines 81–166 for G4 & G7)
   - `server/src/routes/locations.ts` (lines 104–110 for G2)
   - `server/src/middleware/roleGuard.ts` (for Store Keeper & Direct Supervisor scoping)

### Invalidation Conditions
- If `npm run db:seed` fails on unexported symbols or constraint violations.
- If a stock adjustment for a Risk Category III item posts immediately without HSE Supervisor approval (`status !== "pending"`).
- If an issuance of female-only PPE to a male employee succeeds when item group requires gender match.
- If a stock transfer out of a Scrap location succeeds.
- If a location with `quantityOnHand > 0` can be deleted.
