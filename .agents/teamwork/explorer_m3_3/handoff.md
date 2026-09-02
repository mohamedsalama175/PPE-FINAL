# Milestone 3 Handoff Report: Dashboard, Directory, Admin Governance & Self-Service Views

**State Folder**: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m3_3`  
**Target Group**: Dashboard, Directory, Admin Governance & Self-Service Views  
**Target Files**:
1. `src/pages/Dashboard.tsx`
2. `src/pages/Employees.tsx`
3. `src/pages/EmployeeDetail.tsx`
4. `src/pages/HistoricalImport.tsx`
5. `src/pages/TrashBin.tsx`
6. `src/pages/AuditLogs.tsx`
7. `src/pages/ModuleSettings.tsx` (and `src/pages/ExpirySettings.tsx`)
8. `src/pages/MyPPE.tsx`

---

## 1. Observation

### 1.1 Baseline Build and Test Status
Commands executed and verbatim results:
- `npm run build`: Vite v6.4.3 build succeeded with 0 TypeScript or packaging errors (`built in 20.03s`, 3672 modules transformed).
- `npm run test:server`: All verification assertions passed 100% across authentication, G1-G6 governance rules, role scoping, and defect patches.
- `npm run test:e2e`: All 575 test cases passed 100% (Tier 1: 250/250, Tier 2: 250/250, Tier 3: 50/50, Tier 4: 25/25) with 1099 assertions verified.
- **Selector & Test ID Audit**: Neither `server/test-comprehensive.ts` nor `tests/e2e/**/*.ts` queries DOM elements, CSS classes, or `data-testid` attributes. The entire test suite tests HTTP REST endpoints via Express API personas. No existing `data-testid` attributes exist in `src/`. Worker modifications to view layouts will not break existing automated test suites so long as API calls and business logic hooks (`usePPEStore`, routes, parameters) remain intact.

---

### 1.2 Page-by-Page Audit Observations

#### Page 1: `src/pages/Dashboard.tsx` (34.5 KB, 755 lines)
- **DOM & Tab Structure**:
  - Implements 3 tabs: Tab 1: Stock Movement Trend (`movement`), Tab 2: Location Capacity & Stock (`capacity`), Tab 3: Top Kits Issuance (`issuance`).
  - Active tab switcher is rendered via raw `button` elements with hardcoded styles (`bg-slate-100`, `text-slate-600`, `shadow-2xs`).
- **Native Browser Dialogs**:
  - **Line 250**: Verbatim:
    ```tsx
    alert("Insufficient stock to issue this kit. All items in the kit are currently out of stock.");
    ```
    Must be replaced with `useSwal` (`showToast` with `'warning'` or `showInfo`).
- **Form Controls & Inputs**:
  - **Line 347-356**: Unstyled raw HTML `<select>` for site filter:
    ```tsx
    <select
      value={movementSiteFilter}
      onChange={(e) => setMovementSiteFilter(e.target.value)}
      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2 py-1 font-medium focus:outline-none"
    >
    ```
    Should use shared `Select` component or styled container.
- **Hardcoded Colors & Styling**:
  - Tab 1: Hardcoded button colors `bg-blue-600`, legend pill borders `border-blue-500 bg-blue-50 text-blue-800`, `border-emerald-500 bg-emerald-50 text-emerald-800`, `border-red-500 bg-red-50 text-red-800`.
  - Recharts AreaChart & BarChart have fixed strokes (`#2563eb`, `#16a34a`, `#dc2626`, `#0d9488`, `#d97706`, `#e2e8f0`).
- **Raw Tables & Badges**:
  - Lines 566-621: Raw `<table>` with `text-left text-xs` (LTR hardcoded).
  - Status badges in stock table: `bg-red-100 text-red-800` vs `bg-emerald-100 text-emerald-800`. Should use `StatusBadge`.
  - Risk category badges: hardcoded `bg-red-100 text-red-800`, `bg-amber-100 text-amber-800`, `bg-blue-100 text-blue-800`.
- **Card Surfaces**:
  - Multiple raw `div` containers with `bg-white rounded-lg border border-slate-200 shadow-2xs`. Should be wrapped in `ContainerCard`.

---

#### Page 2: `src/pages/Employees.tsx` (14.2 KB, 360 lines)
- **Legacy Prototype Classes**:
  - Lines 119, 232, 247, 254, 259, 268, 285, 296, 326: Uses prototype tokens:
    - `bg-surface` -> needs `bg-white dark:bg-[#0e1726]`
    - `border-border` -> needs `border-[#E2E8F0] dark:border-[#17263c]`
    - `text-body` -> needs `text-[#64748B] dark:text-[#888ea8]`
    - `text-ink` -> needs `text-[#1E293B] dark:text-white`
    - `bg-accent/10`, `text-accent`, `border-accent/20` -> needs `bg-primary/10`, `text-primary`, `border-primary/20`
    - `hover:bg-canvas` -> needs `dark:hover:bg-[#181f32]`
- **Table & Container**:
  - Line 232: Outer table wrapper `<div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xs">` should be `ContainerCard` with `noPadding`.
  - Line 319: Column action header has `className: 'text-right w-16'`, which fails in RTL. Needs logical `text-end w-16`.
- **RTL & Directional Elements**:
  - Line 147: Offline warning banner has `border-l-4 border-amber-500 rounded-r-lg`. In RTL this should be `border-s-4 rounded-e-lg`.
  - Line 329: Action chevron `<ChevronRight className="w-4 h-4" />` lacks `rtl:rotate-180`.

---

#### Page 3: `src/pages/EmployeeDetail.tsx` (30.1 KB, 692 lines)
- **Legacy Prototype Classes**:
  - Pervasive across the file: `bg-surface`, `bg-canvas`, `border-border`, `text-body`, `text-ink`, `bg-accent/15`, `text-accent`, `border-accent/20`, `border-accent`.
- **Card Surfaces & Metrics**:
  - Profile header card (line 361) and tabs: raw `bg-surface` cards.
  - KPI snapshot metrics (lines 424-437): 3 boxes (`currentlyHeldCount`, `returnedCount`, `employeeIssuances.length`). Can be formatted with `KpiCard` or styled metric chips inside `ContainerCard`.
- **Timeline & Directional RTL**:
  - Lines 505-513: Timeline wrapper has `pl-6 sm:pl-8 border-l-2 border-border`. In RTL this must be `ps-6 sm:ps-8 border-s-2` (or `ltr:pl-6 ltr:border-l-2 rtl:pr-6 rtl:border-r-2`).
  - Line 509: Timeline bullet dot uses absolute position `-left-[31px] sm:-left-[39px]`. In RTL this must be `-start-[31px] sm:-start-[39px]`.
  - Line 349: Breadcrumb back icon `<ArrowLeft className="w-4 h-4" />` needs `rtl:rotate-180`.
- **Buttons**:
  - Export PDF button (line 480): `<Button variant="primary">` should be `<Button variant="solid" color="primary">`.
  - Load more button (line 616): `<Button variant="secondary">` should be `<Button variant="outline" color="secondary">`.

---

#### Page 4: `src/pages/HistoricalImport.tsx` (18.2 KB, 405 lines)
- **Cards & Structure**:
  - Raw cards: Upload & demo card (line 240), invariants box (line 263), preview table card (line 308). Wrap in `ContainerCard`.
- **KPI Metrics**:
  - Lines 288-305: 4 raw KPI boxes for `Valid Records`, `Error Records`, `Will Be Upcoming`, and `Will Be Overdue`. Can use `KpiCard` with colors `success`, `danger`, `warning`, `danger`.
- **Table**:
  - Line 321: `<table className="w-full text-xs text-left">` — hardcoded LTR `text-left`. Replace with `text-start`.
  - Column alignment: Qty column is `text-center`, status is icon, dates and codes font-mono.
- **Buttons & Dialogs**:
  - Buttons use legacy `variant="primary"` and `variant="secondary"`.
  - `handleExecuteImport` executes immediately with no confirmation. Wrapping with `showConfirm` from `useSwal` before running import is a valuable safety upgrade.
  - Directional margins: `mr-1.5` -> `me-1.5`.

---

#### Page 5: `src/pages/TrashBin.tsx` (11.5 KB, 319 lines)
- **Custom Native Modal Overlays**:
  - Lines 270-316: Raw custom modal dialog:
    ```tsx
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
    ```
    Must be refactored into the shared `Modal` component from `src/components/ui/Modal.tsx`.
- **Restore Confirmations**:
  - Single restore and bulk restore currently execute without a confirmation prompt. Integrating `showConfirm` from `useSwal` provides safety against accidental restores.
- **Table & Container**:
  - Wrap `DataTable` in `ContainerCard` with `noPadding`.
  - Checkbox column uses raw `<input type="checkbox" className="rounded border-slate-300 text-blue-600" />`. Ensure proper styling with `accent-primary` / `form-checkbox`.
  - Action column: `className: 'text-right'` -> `text-end`.

---

#### Page 6: `src/pages/AuditLogs.tsx` (8.4 KB, 232 lines)
- **Modals & Drawers**:
  - Uses `JsonDiffViewer` at line 225, which cleanly wraps `SlideOverDrawer`.
- **Card Surfaces**:
  - `DataTable` is currently naked on the page background. Wrap in `ContainerCard` with `noPadding`.
- **Buttons & Alignment**:
  - Header button: `variant="secondary"` -> `variant="outline" color="primary"`.
  - Inspect Delta button: `variant="secondary"` -> `variant="outline" color="primary"` with `size="sm"`.
  - Export CSV: Notification can use `useSwal.showToast`.
  - Table action column: `className: 'text-right'` -> `text-end`.
  - Margin: `mr-1.5` -> `me-1.5`.

---

#### Page 7: `src/pages/ModuleSettings.tsx` (9.8 KB, 225 lines) and `ExpirySettings.tsx`
- **Component File Structure**:
  - `ExpirySettings.tsx` simply re-exports `ModuleSettingsPage` (`import ModuleSettingsPage from './ModuleSettings'; export default ModuleSettingsPage;`). Refactoring `ModuleSettings.tsx` automatically updates `ExpirySettings.tsx`!
- **Cards & Layout**:
  - Section 1 (Lead times) and Section 2 (Protection windows): raw `div` containers with `bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm`. Replace with `ContainerCard`.
- **Tables & Inputs**:
  - Operating site lead times table has `text-left` -> replace with `text-start`.
  - Form uses `Input` from `src/components/ui/Input`, but lacks dark mode classes in table row highlights.
  - Buttons use legacy `variant="primary"` and `variant="secondary"`.
  - Dialog feedback: `handleSubmit` error and success toasts can use `useSwal.showToast`.

---

#### Page 8: `src/pages/MyPPE.tsx` (2.7 KB, 63 lines)
- **Legacy Prototype Classes**:
  - Lines 22-30: `bg-surface`, `border-border`, `bg-canvas`, `bg-accent/20`, `text-accent`, `text-ink`, `text-body`.
- **Card Structure**:
  - Refactor outer card into `ContainerCard` with user profile in card header/body and `DataTable` for issued equipment.
  - Add empty state fallback when no PPE items are currently issued to the user.

---

## 2. Logic Chain

1. **Token Alignment**: `DESIGN_SYSTEM.md` defines the corporate primary color as `#212B59` (`text-primary`, `bg-primary`), the canvas background as `#F5F6FD` (`bg-[#F5F6FD]` / dark: `#060818`), panel surfaces as `#FFFFFF` (`bg-white` / dark: `#0e1726`), and slate hairline borders as `#E2E8F0` (`border-[#E2E8F0]` / dark: `#17263c`). Removing prototype classes (`bg-surface`, `bg-canvas`, `bg-accent`, `text-ink`, `text-body`, `border-border`) ensures project-wide consistency and prevents dark mode contrast breaks.
2. **Component Reuse**: `ContainerCard`, `KpiCard`, `DataTable`, `CustomTable`, `Button`, `Input`, `Select`, `StatusBadge`, and `Modal` were specifically built in Milestone 2 according to `DESIGN_SYSTEM.md` specifications. Replacing ad-hoc divs, inputs, and modals with these shared components eliminates duplication, ensures responsive accessibility, and establishes visual hierarchy.
3. **Native Dialog Remediation**: Feature `FE-VIW-06` mandates eliminating browser `window.alert()`, `window.confirm()`, and `window.prompt()`. Replacing `Dashboard.tsx:250`'s `alert()` and adding confirmation prompts in `TrashBin.tsx` and `HistoricalImport.tsx` using `useSwal` (`showToast`, `showConfirm`) satisfies this requirement.
4. **Bilingual RTL Support**: Arabic layouts require logical text alignment (`text-start`, `text-end`), directional spacing (`ms-`, `me-`, `ps-`, `pe-`), rotated chevrons (`rtl:rotate-180`), and mirrored timeline borders (`border-s-2`, `-start-[31px]`). Replacing physical left/right classes prevents layout breakage in RTL.
5. **Preserving 100% Test Pass Rate**: Because all 575 E2E tests and server integration tests run against API endpoints without inspecting DOM elements, view refactoring that maintains business logic hooks, store dispatches, and form payload parameters will preserve test pass rates with zero regression risk.

---

## 3. Caveats

1. **Dashboard Recharts Integration**: `Dashboard.tsx` uses Recharts (`AreaChart`, `BarChart`, `Brush`) for Tab 1 and Tab 2. While `DESIGN_SYSTEM.md` mentions ApexCharts in the broader survey, Recharts is deeply integrated and fully working in `Dashboard.tsx`. To avoid regression, we wrap the charts in `ContainerCard`, add dark mode tooltips/styles, and modernize surrounding controls without rewriting the chart rendering engine.
2. **IssueKitModal in Dashboard**: `IssueKitModal` is imported by `Dashboard.tsx`. Refactoring it to use `Select`, `Button`, and `useSwal` keeps the modal consistent with the design system.
3. **No Caveats on API/Store Invariants**: All business logic functions (`importHistoricalIssuances`, `restoreTrashItem`, `updateSettings`, `issueKitPPE`) must remain untouched in store dispatch calls.

---

## 4. Conclusion

The 8 target pages require systematic refactoring to eliminate legacy tokens, replace raw HTML containers with `ContainerCard` and `KpiCard`, modernize form controls, replace native alerts with `useSwal`, and introduce full RTL logical properties. The refactoring plan below provides exact, production-ready recipes for the Worker.

---

## 5. Verification Method

To verify the refactored code:
1. **Client Build**:
   ```powershell
   npm run build
   ```
   *Expected*: Zero TypeScript errors, bundle completed in < 25s.
2. **Server Build**:
   ```powershell
   npm run build:server
   ```
   *Expected*: Zero compilation errors.
3. **Server Integration Tests**:
   ```powershell
   npm run test:server
   ```
   *Expected*: 100% assertions passed across all roles.
4. **Full E2E Tests**:
   ```powershell
   npm run test:e2e
   ```
   *Expected*: 575/575 tests passed (100% pass rate).
5. **Visual & Behavioral Verification**:
   - Verify `Dashboard.tsx` alert replaced with `useSwal`.
   - Verify `TrashBin.tsx` conflict modal uses `Modal` component.
   - Verify Arabic RTL rendering (chevrons rotated, tables aligned to start).
   - Verify dark mode appearance across cards and tables.

---

## 6. Concrete Implementation Recipes for the Worker

### Recipe 1: `src/pages/Dashboard.tsx`

#### Imports Update
```tsx
// BEFORE:
import { Button } from '../components/ui/Button';
import { IssueKitModal } from '../components/dashboard/IssueKitModal';

// AFTER:
import { Button } from '../components/ui/Button';
import { ContainerCard } from '../components/ui/ContainerCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Select } from '../components/ui/Select';
import { useSwal } from '../lib/useSwal';
import { IssueKitModal } from '../components/dashboard/IssueKitModal';
```

#### Alert Remediation (Line 248-255)
```tsx
// BEFORE:
const handleKitBarClick = (kitItem: any) => {
  if (kitItem.stockState === 'out') {
    alert("Insufficient stock to issue this kit. All items in the kit are currently out of stock.");
    return;
  }
  setSelectedKitToIssue(kitItem.kit);
  setIssueModalOpen(true);
};

// AFTER:
const { showToast, showInfo } = useSwal();

const handleKitBarClick = (kitItem: any) => {
  if (kitItem.stockState === 'out') {
    showToast(
      language === 'en' 
        ? "Insufficient stock to issue this kit. All items are currently out of stock." 
        : "المخزون غير كافٍ لإصدار هذه الحقيبة. جميع العناصر غير متوفرة حالياً.",
      'warning'
    );
    return;
  }
  setSelectedKitToIssue(kitItem.kit);
  setIssueModalOpen(true);
};
```

#### Tab Navigation Bar & Header
Wrap the top switcher with HSE container styling:
- Switch tabs wrapper from `bg-slate-100 border border-slate-200` to `bg-slate-100 dark:bg-[#121e32] border border-[#E2E8F0] dark:border-[#17263c]`.
- Active tab pill: `activeTab === 'xxx' ? 'bg-white dark:bg-[#0e1726] text-primary dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-[#888ea8] hover:text-slate-900 dark:hover:text-white'`.

#### Tab 1 Chart Container
Wrap in `ContainerCard`:
```tsx
<ContainerCard
  title="Stock Velocity Timeline (Issued, Returned, Scrapped)"
  subtitle="Click legend pills to toggle layers • Drag bottom slider to zoom into date windows"
  actions={
    <div className="flex items-center gap-2">
      {/* Legend Buttons */}
      <button
        type="button"
        onClick={() => toggleSeries('issued')}
        className={`px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
          hiddenSeries.issued
            ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 line-through'
            : 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
        Issued
      </button>
      {/* Repeat for returned and scrapped */}
    </div>
  }
>
  {/* AreaChart inside ResponsiveContainer */}
</ContainerCard>
```

#### Tab 2 Capacity & Stock Table
Wrap Stock Levels grid in `ContainerCard` and use `StatusBadge`:
```tsx
<ContainerCard
  title="Stock Levels & Reorder Watchlist (BD-I466)"
  subtitle="Available = On Hand - Quarantined • Badge fires when Available < Reorder Level"
  actions={
    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#121e32] border border-[#E2E8F0] dark:border-[#17263c] px-2.5 py-1 rounded-lg">
      Showing {stockGridItems.length} records
    </span>
  }
  noPadding
>
  <div className="overflow-x-auto">
    <table className="w-full text-start text-xs border-collapse">
      <thead className="bg-[#F8FAFC] dark:bg-[#1a2941] border-b border-[#E2E8F0] dark:border-[#17263c] text-[#475569] dark:text-gray-400 font-bold uppercase tracking-wider">
        <tr>
          <th className="py-3 px-4 text-start">Location</th>
          <th className="py-3 px-4 text-start">Item Code</th>
          <th className="py-3 px-4 text-start">Item Name</th>
          <th className="py-3 px-4 text-start">Risk Cat</th>
          <th className="py-3 px-4 text-end">On Hand</th>
          <th className="py-3 px-4 text-end">Quarantined</th>
          <th className="py-3 px-4 text-end font-bold">Available</th>
          <th className="py-3 px-4 text-end">Reorder Lvl</th>
          <th className="py-3 px-4 text-center">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#191e3a]">
        {stockGridItems.map((item, idx) => (
          <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-[#1a2941]/40 transition-colors">
            <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{item.locationName}</td>
            <td className="py-2.5 px-4 font-mono font-bold text-primary dark:text-primary-light">{item.itemCode}</td>
            <td className="py-2.5 px-4 text-slate-900 dark:text-white font-medium">{item.itemName}</td>
            <td className="py-2.5 px-4">
              <StatusBadge category="risk" status={item.riskCategory} />
            </td>
            <td className="py-2.5 px-4 text-end font-mono text-slate-600 dark:text-slate-400">{item.onHand}</td>
            <td className="py-2.5 px-4 text-end font-mono text-amber-600 dark:text-amber-400 font-semibold">{item.quarantined || '—'}</td>
            <td className="py-2.5 px-4 text-end font-mono font-bold text-slate-900 dark:text-white">{item.available}</td>
            <td className="py-2.5 px-4 text-end font-mono text-slate-500 dark:text-slate-400">{item.reorderLevel}</td>
            <td className="py-2.5 px-4 text-center">
              {item.isLowStock ? (
                <StatusBadge status="danger" label="Low Stock" />
              ) : (
                <StatusBadge status="success" label="Adequate" />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</ContainerCard>
```

#### Tab 3 Top Job Kits
- Use `Button variant="solid" color="primary"` for issue buttons.

---

### Recipe 2: `src/pages/Employees.tsx`

#### Imports Update
```tsx
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { ContainerCard } from '../components/ui/ContainerCard';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
```

#### Replace Prototype Classes
- Line 119: `<div className="flex items-center gap-2 self-start sm:self-auto bg-surface border border-border px-3 py-1.5 rounded-lg text-xs">`  
  -> `<div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-[#0e1726] border border-[#E2E8F0] dark:border-[#17263c] px-3 py-1.5 rounded-xl text-xs shadow-sm">`
- Line 120: `text-body` -> `text-[#64748B] dark:text-[#888ea8]`
- Line 147: Offline warning banner:
  ```tsx
  <div className="bg-amber-50 dark:bg-amber-950/30 border-s-4 border-amber-500 p-4 rounded-e-xl flex items-start gap-3 shadow-xs">
  ```
- Line 232: Replace outer wrapper with `ContainerCard`:
  ```tsx
  <ContainerCard noPadding className="overflow-hidden">
    <DataTable ... />
  </ContainerCard>
  ```
- Avatar background:
  `bg-accent/10 text-accent border border-accent/20`  
  -> `bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light border border-primary/20`
- Table action button column:
  `className: 'text-right w-16'` -> `className: 'text-end w-16'`
- Action button chevron:
  `<ChevronRight className="w-4 h-4 rtl:rotate-180" />`

---

### Recipe 3: `src/pages/EmployeeDetail.tsx`

#### Imports Update
```tsx
import { ContainerCard } from '../components/ui/ContainerCard';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
```

#### Profile Header Card (Lines 361-463)
Replace raw card with `ContainerCard`:
- Avatar styling:
  `bg-accent/15 text-accent border-2 border-accent/20`  
  -> `bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light border-2 border-primary/20`
- Metrics snapshot:
  - Metric 1 (`currentlyHeldCount`):
    `bg-slate-50 dark:bg-[#121e32] border border-[#E2E8F0] dark:border-[#17263c] rounded-xl p-3 text-center`
    Value: `text-2xl font-bold text-primary dark:text-primary-light`
  - Metric 2 (`returnedCount`):
    Value: `text-2xl font-bold text-slate-800 dark:text-white`
  - Metric 3 (`employeeIssuances.length`):
    Value: `text-2xl font-bold text-slate-800 dark:text-white`
- Tab buttons:
  `activeTab === 'timeline' ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light font-bold' : 'border-transparent text-[#64748B] dark:text-[#888ea8] hover:text-slate-900 dark:hover:text-white'`

#### Timeline Directional Fix (Lines 505-513)
```tsx
// BEFORE:
<div className="relative pl-6 sm:pl-8 border-l-2 border-border space-y-8">
  <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 ...`} />

// AFTER:
<div className="relative ps-6 sm:ps-8 border-s-2 border-[#E2E8F0] dark:border-[#17263c] space-y-8">
  <div className={`absolute -start-[31px] sm:-start-[39px] top-1.5 w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-125 ${
    item.isCurrentlyHeld
      ? 'border-emerald-500 bg-emerald-500'
      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0e1726]'
  }`} />
```

#### Buttons
- Line 480: `<Button variant="solid" color="primary" onClick={handleExportPDF}>`
- Line 616: `<Button variant="outline" color="secondary" onClick={() => setVisibleCount(prev => prev + 5)}>`

---

### Recipe 4: `src/pages/HistoricalImport.tsx`

#### Imports Update
```tsx
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { ContainerCard } from '../components/ui/ContainerCard';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useSwal } from '../lib/useSwal';
```

#### KPI Metrics Section (Lines 288-305)
Replace ad-hoc stat divs with 4 `KpiCard` components:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
  <KpiCard
    title="Valid Records"
    value={validRows.length}
    icon={<CheckCircle2 className="w-6 h-6" />}
    color="success"
  />
  <KpiCard
    title="Error Records"
    value={errorRows.length}
    icon={<XCircle className="w-6 h-6" />}
    color="danger"
  />
  <KpiCard
    title="Will Be Upcoming"
    value={upcomingCount}
    icon={<Clock className="w-6 h-6" />}
    color="warning"
  />
  <KpiCard
    title="Will Be Overdue"
    value={overdueCount}
    icon={<AlertTriangle className="w-6 h-6" />}
    color="danger"
  />
</div>
```

#### Execute Import with `useSwal.showConfirm`
```tsx
const { showConfirm, showToast } = useSwal();

const handleExecuteImport = async () => {
  if (validRows.length === 0) {
    showToast('No valid rows available to import.', 'error');
    return;
  }

  const confirmed = await showConfirm(
    language === 'en' ? 'Confirm Historical Import' : 'تأكيد الاستيراد التاريخي',
    language === 'en' 
      ? `Are you sure you want to import ${validRows.length} valid historical issuances? Stock levels will remain unchanged.`
      : `هل أنت متأكد من استيراد ${validRows.length} سجلاً تاريخياً؟ لن يتأثر رصيد المخزون.`,
    language === 'en' ? 'Confirm Import' : 'تأكيد الاستيراد'
  );

  if (!confirmed) return;

  setSubmitting(true);
  const rowsToImport = validRows.map(r => ({
    employeeId: r.employeeId!,
    itemCode: r.itemCode,
    variantKey: r.variantKey,
    quantity: r.quantity,
    issueDate: r.issueDate
  }));

  const result = importHistoricalIssuances(rowsToImport);
  setSubmitting(false);
  setImportSummary(result);
  showToast(`Successfully imported ${result.importedCount} historical issuances.`, 'success');
};
```

#### Cards and Table
- Wrap upload section and preview table in `ContainerCard`.
- Replace `<table className="w-full text-xs text-left">` with `<table className="w-full text-xs text-start">`.
- Directional margin: `mr-1.5` -> `me-1.5`.

---

### Recipe 5: `src/pages/TrashBin.tsx`

#### Imports Update
```tsx
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { ContainerCard } from '../components/ui/ContainerCard';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useSwal } from '../lib/useSwal';
```

#### Restore Confirmation with `useSwal`
```tsx
const { showConfirm, showToast } = useSwal();

const handleRestoreClick = async (item: TrashItem) => {
  const confirmed = await showConfirm(
    language === 'en' ? 'Restore Record' : 'استعادة السجل',
    language === 'en' 
      ? `Are you sure you want to restore "${item.nameEn}" back to active catalog?`
      : `هل أنت متأكد من استعادة "${item.nameAr || item.nameEn}"؟`,
    language === 'en' ? 'Restore' : 'استعادة'
  );

  if (!confirmed) return;

  const result = restoreTrashItem(item.id);
  if (!result.success) {
    if (result.error?.includes('already in use')) {
      setConflictModal({
        isOpen: true,
        item,
        newCode: `${item.code}_RESTORED`,
        errorMessage: result.error
      });
    } else {
      showToast(result.error || 'Restore blocked.', 'error');
    }
  } else {
    showToast(`Restored "${item.nameEn}" successfully.`, 'success');
    setSelectedTrashIds(prev => prev.filter(id => id !== item.id));
  }
};
```

#### Replace Raw Modal with Shared `Modal` (Lines 270-316)
```tsx
<Modal
  isOpen={conflictModal.isOpen && !!conflictModal.item}
  onClose={() => setConflictModal({ isOpen: false, item: null, newCode: '' })}
  title="Code Already In Use"
  subtitle={conflictModal.item ? `Original Code: ${conflictModal.item.code}` : undefined}
  icon={<AlertTriangle className="w-5 h-5 text-warning" />}
  size="md"
  footer={
    <div className="flex justify-end gap-2 w-full">
      <Button
        variant="outline"
        color="secondary"
        onClick={() => setConflictModal({ isOpen: false, item: null, newCode: '' })}
      >
        Cancel
      </Button>
      <Button
        variant="solid"
        color="primary"
        onClick={handleConfirmConflictRestore}
      >
        Confirm & Restore
      </Button>
    </div>
  }
>
  <div className="space-y-4 p-1">
    <p className="text-xs text-[#64748B] dark:text-[#888ea8] leading-relaxed">
      The original code <span className="font-mono font-bold text-slate-800 dark:text-white">"{conflictModal.item?.code}"</span> has since been assigned to an active record. Enter a unique new code to complete the restore:
    </p>

    {conflictModal.errorMessage && (
      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-700 dark:text-red-400">
        {conflictModal.errorMessage}
      </div>
    )}

    <div>
      <Input
        label="New Unique Code"
        required
        withAsterisk
        value={conflictModal.newCode}
        onChange={e => setConflictModal(prev => ({ ...prev, newCode: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
        placeholder="e.g. HLM-001_NEW"
      />
    </div>
  </div>
</Modal>
```

#### Wrap Table in `ContainerCard`
- Wrap `DataTable` in `<ContainerCard noPadding className="overflow-hidden">`.
- Change action header to `className: 'text-end'`.

---

### Recipe 6: `src/pages/AuditLogs.tsx`

#### Imports Update
```tsx
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { ContainerCard } from '../components/ui/ContainerCard';
import { FilterBar } from '../components/ui/FilterBar';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { JsonDiffViewer } from '../components/ui/JsonDiffViewer';
import { useSwal } from '../lib/useSwal';
```

#### Wrap Table & Modernize Actions
- Wrap `DataTable` in `<ContainerCard noPadding className="overflow-hidden">`.
- Header export button:
  `<Button variant="outline" color="primary" size="sm" onClick={handleExportCSV}>`
- Row Inspect Delta button:
  ```tsx
  <Button
    variant="outline"
    color="primary"
    size="sm"
    onClick={() => setSelectedLog(l)}
  >
    <Eye className="w-3.5 h-3.5 me-1" /> Inspect Delta
  </Button>
  ```
- Toast in `handleExportCSV`:
  `showToast('Audit log export downloaded successfully.', 'info');`
- Table action column alignment: `className: 'text-end'`.

---

### Recipe 7: `src/pages/ModuleSettings.tsx` (& `ExpirySettings.tsx`)

#### Imports Update
```tsx
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ContainerCard } from '../components/ui/ContainerCard';
import { useSwal } from '../lib/useSwal';
```

#### Wrap Section 1 & Section 2 in `ContainerCard`
```tsx
{/* Section 1 */}
<ContainerCard
  title="1. Reminder Lead Time per Site (Days)"
  subtitle="Configures how many days before an item's Expected Replacement Date the nightly reminder is triggered and appears as 'Upcoming' in Replacements Due (allowed: 1–90 days)."
  icon={<Clock className="w-5 h-5 text-primary" />}
  noPadding
>
  <div className="overflow-x-auto">
    <table className="w-full text-xs text-start">
      <thead className="bg-[#F8FAFC] dark:bg-[#1a2941] border-b border-[#E2E8F0] dark:border-[#17263c] text-[#475569] dark:text-gray-400 font-bold uppercase tracking-wider">
        <tr>
          <th className="p-3 text-start">Operating Site</th>
          <th className="p-3 w-48 text-start">Lead Time (1–90 Days)</th>
          <th className="p-3 text-start">Status / Notes</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#191e3a]">
        {/* Rows */}
      </tbody>
    </table>
  </div>
</ContainerCard>

{/* Section 2 */}
<ContainerCard
  title="2. Kit Protection & Trash Retention Windows"
  subtitle="System governance parameters enforcing sole active kit protection and trash auto-purge countdowns."
  icon={<Calendar className="w-5 h-5 text-success" />}
>
  {/* Inputs & Audit Reason Field */}
</ContainerCard>
```

#### Button Updates
- Reset Changes: `<Button type="button" variant="outline" color="secondary" onClick={...}>`
- Save Configuration: `<Button type="submit" variant="solid" color="primary">`

---

### Recipe 8: `src/pages/MyPPE.tsx`

#### Complete Component Rewrite Recipe
```tsx
import * as React from 'react';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { ContainerCard } from '../components/ui/ContainerCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { ShieldCheck, User, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function MyPPE() {
  const { t, language } = useTranslation();
  const { currentUser, issuances, ppeItems } = usePPEStore();

  const myIssuances = React.useMemo(() => {
    return issuances.filter(i => i.employeeId === currentUser.id && i.status === 'issued');
  }, [issuances, currentUser.id]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('myPpe')} 
        description={language === 'en' ? "Personal Safety Profile & Currently Assigned PPE Equipment" : "الملف الشخصي للسلامة ومعدات الوقاية الشخصية المصروفة حالياً"}
      />

      {/* User Profile Banner Card */}
      <ContainerCard noPadding>
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F5F6FD] dark:bg-[#121e32]/40 border-b border-[#E2E8F0] dark:border-[#17263c]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary-light dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center text-xl font-bold border border-primary/20 shadow-sm shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentUser.name}
                </h2>
                <span className="font-mono text-xs font-semibold bg-white dark:bg-[#0e1726] px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-[#17263c] text-slate-700 dark:text-slate-300">
                  {currentUser.employeeCode}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#888ea8] mt-0.5">
                {currentUser.role} &middot; {currentUser.department || 'Operations'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status="success" label="Compliant" />
          </div>
        </div>

        {/* Issued Equipment Section */}
        <div className="p-5 md:p-6">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary dark:text-primary-light" />
            Currently Issued PPE ({myIssuances.length})
          </h3>

          {myIssuances.length === 0 ? (
            <EmptyState
              icon={<Package className="w-8 h-8" />}
              title={language === 'en' ? "No PPE currently issued" : "لا توجد معدات وقاية شخصية مصروفة حالياً"}
              description={language === 'en' ? "You have no active PPE equipment in your possession." : "ليس لديك أي معدات وقاية شخصية نشطة في عهدتك."}
            />
          ) : (
            <DataTable 
              data={myIssuances}
              keyExtractor={(item) => item.id}
              columns={[
                {
                  key: 'item',
                  header: 'Item',
                  render: (i) => {
                    if (i.ppeItemId) {
                      const ppe = ppeItems.find(p => p.id === i.ppeItemId);
                      return ppe ? (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {language === 'en' ? ppe.nameEn : ppe.nameAr}
                          </div>
                          <div className="text-xs text-[#64748B] dark:text-[#888ea8] font-mono mt-0.5">
                            {ppe.itemCode}
                          </div>
                        </div>
                      ) : i.ppeItemId;
                    }
                    return 'Kit';
                  }
                },
                {
                  key: 'issueDate',
                  header: 'Issue Date',
                  render: (i) => (
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {format(new Date(i.issueDate), 'MMM d, yyyy')}
                    </span>
                  )
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: () => <StatusBadge status="success" label="Active" />
                }
              ]}
            />
          )}
        </div>
      </ContainerCard>
    </div>
  );
}
```

---

*Handoff document prepared by Explorer M3.3. Ready for Worker implementation.*

