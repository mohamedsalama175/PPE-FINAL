# Component & Application Views Exploration Report

## 1. Observation

### 1.1 Application Layout Shell
- **Existing Layout Components**:
  - Found `src/components/layout/Layout.tsx` (382 lines) and `src/components/layout/PageHeader.tsx` (23 lines).
  - No separate `Sidebar.tsx`, `Header.tsx`, `Navbar.tsx`, or `Footer.tsx` exists; the entire layout shell is inlined in `Layout.tsx`.
- **Sidebar Dimensions & Breakpoint Handling**:
  - In `src/components/layout/Layout.tsx:125-130`:
    ```tsx
    <aside 
      className={cn(
        "bg-slate-900 text-slate-100 transition-all duration-300 flex flex-col h-full border-r border-slate-800 z-20 shrink-0",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
    ```
    *Observed discrepancy:* `w-64` (256px) and `w-16` (64px) are used instead of DESIGN_SYSTEM.md's exact vertical mode specifications: `260px` (`w-[260px]`) for expanded, and `70px` (`w-[70px]`) for collapsed.
    *Breakpoint discrepancy:* There is NO responsive mobile drawer (< 1024px `lg`). On mobile/tablet screens, the sidebar remains in the static flex layout without an off-canvas drawer or backdrop overlay (`fixed inset-0 bg-[black]/60 z-50`).
- **Sidebar Styling & Navigation**:
  - In `src/components/layout/Layout.tsx:206-211`:
    ```tsx
    isActive 
      ? "bg-teal-600/20 text-teal-300 font-semibold border-l-2 border-teal-400" 
      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
    ```
    *Observed discrepancy:* Styling uses Tailwind slate/teal palette rather than DESIGN_SYSTEM.md's primary navy (`#212B59`), `#F5F6FD` hover/active background, and `#506690` muted text.
  - Sidebar collapse icon toggle (`Layout.tsx:157`): `<ChevronRight className={cn("w-4 h-4 transition-transform", !sidebarCollapsed ? "rotate-180" : "")} />` lacks RTL mirroring (`rtl:rotate-180`).
- **Header Elements**:
  - In `src/components/layout/Layout.tsx:233`:
    ```tsx
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-10">
    ```
    *Observed discrepancies:*
    - Height is `h-14` (56px) instead of `70px` (or min-h: 60px).
    - Missing search bar: DESIGN_SYSTEM.md specifies a `bg-[#F7F8FC] border-0 rounded-xl` search input.
    - Missing theme mode switcher: Light / Dark / System switcher is completely absent.
    - Language switcher is an unstyled inline toggle (`Layout.tsx:285-296`) instead of a styled dropdown with country flag.
    - User profile is a raw `<select>` element (`Layout.tsx:301-310`) without user avatar, profile card, or popover menu.
- **Container Canvas & Page Header**:
  - Body container uses `max-w-7xl mx-auto h-full flex flex-col p-4 sm:p-6 bg-slate-50` (`Layout.tsx:372-375`) instead of `#F5F6FD` canvas background and 1400px boxed layout.
  - `src/components/layout/PageHeader.tsx:11-16` uses hardcoded `-ml-2` on the back button (`p-2 -ml-2 rounded-full hover:bg-canvas text-body`), which pulls the button away from the margin in RTL Arabic.

---

### 1.2 Shared UI Components Inspection
A comprehensive inspection of all 16 components in `src/components/ui/` was performed:

1. **Button (`src/components/ui/Button.tsx`)**:
   - Code lines 12-30:
     ```tsx
     const isPrimary = variant === 'primary';
     const isSecondary = variant === 'secondary' || variant === 'outline';
     const isDanger = variant === 'danger' || variant === 'destructive';
     const isGhost = variant === 'ghost';
     ...
     'bg-accent text-white hover:bg-accent/90 shadow-sm': isPrimary,
     'bg-surface text-ink border border-border hover:bg-canvas shadow-sm': isSecondary,
     'bg-safety-red text-white hover:bg-safety-red/90 shadow-sm': isDanger,
     'bg-transparent text-body hover:bg-canvas': isGhost,
     ```
   - *Discrepancy:* Uses obsolete color tokens (`bg-accent` #D97F1E orange, `bg-surface`, `bg-safety-red`).
   - *Discrepancy:* Does NOT support DESIGN_SYSTEM.md button variants (`solid`, `outline`, `text`, `icon`) and color palette (`primary` #212B59, `secondary` #805dca, `danger` #e7515a, `success` #00ab55, `warning` #e2a03f, `info` #2196f3, `dark` #3b3f5c, `white`).
   - *Discrepancy:* Border radius is `rounded` (4px) instead of `rounded-lg` (8px).
   - *Discrepancy:* Lacks `loading` boolean prop with animated spinner, lacks active scale (`active:scale-[0.98]`), and lacks Tippy tooltip wrapper for icon buttons.
   - *Discrepancy:* 0 `dark:` classes present.

2. **Form Controls**:
   - `src/components/ui/Input.tsx`: Merely wraps `.input-base` (`h-9`, `rounded-md`, `border-border`). DESIGN_SYSTEM.md requires `h-[40px]`, `rounded-xl` (12px), `border-[#E2E8F0]` (dark: `#17263c`), and placeholder `#B0BEC5`. Lacks label wrapper, asterisk, helperText, and error AlertCircle icon.
   - `src/components/ui/Select.tsx`: Raw `<select>` wrapping `.input-base`. Lacks Mantine Select styling, clearable search, and RTL chevron alignment.
   - `src/components/ui/ToggleSwitch.tsx:27-29`:
     ```tsx
     checked ? 'translate-x-2' : '-translate-x-2'
     ```
     Hardcoded `translate-x` fails RTL Arabic rendering (moves backwards in RTL). Uses `bg-safety-green` instead of Mantine Switch / `#00ab55`.
   - `src/components/ui/SearchInput.tsx:15, 18`:
     ```tsx
     <Search className="absolute left-2.5 top-2 h-4 w-4 text-body" />
     <Input type="search" className={`pl-9 w-64 ${className || ''}`} {...props} />
     ```
     Hardcoded `left-2.5` and `pl-9` cause magnifying glass to overlap Arabic text in RTL.
   - **Missing Form Controls**: No dedicated `Textarea`, `CheckboxCard`, `RadioCards`, `DatePicker` (Flatpickr), or `FileUpload` dropzone components exist in `src/components/ui/`.

3. **Data Tables (`src/components/ui/DataTable.tsx`)**:
   - Line 26: `<table className="w-full text-left text-[13px] border-collapse">`
     *Discrepancy:* Hardcoded `text-left` forces English alignment in RTL Arabic mode.
   - Line 27: `<thead className="bg-[#F1F1EF] sticky top-0">`
     *Discrepancy:* Uses `#F1F1EF` instead of DESIGN_SYSTEM.md's `bg-[#F8FAFC] rounded-xl` (dark: `dark:!bg-[#1a2941]`).
   - Lacks column sort indicators (`<ArrowUp size={14} className="text-primary" />` / `<ArrowDown size={14} className="text-primary" />`).
   - Lacks row selection checkboxes and hover highlight (`hover:!bg-white-light/20 dark:hover:!bg-[#1a2941]/40`).
   - Lacks integrated pagination controls (Mantine Pagination or circular 36x36px buttons).
   - Lacks standard `TableActionsButtons` with Tippy tooltips.

4. **Modals & Drawers**:
   - `src/components/ui/SlideOverDrawer.tsx:51, 54`:
     ```tsx
     <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
     <div className={cn("w-screen bg-white shadow-2xl border-l border-slate-200 ...", widthClasses)}>
     ```
     *Discrepancy:* Pinned to `right-0` with `pl-10` and `border-l`. In RTL mode, drawer must open from the left (`ltr:right-0 rtl:left-0`, `ltr:pl-10 rtl:pr-10`, `ltr:border-l rtl:border-r`).
   - `src/components/ui/AdminOverrideModal.tsx`: Uses custom fixed overlay instead of Mantine Modal standard.
   - `src/components/ui/Toast.tsx:10`:
     ```tsx
     <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
     ```
     Hardcoded to `right-4`, uses dark ink/surface boxes instead of SweetAlert2 glassmorphic toast pills (`!bg-white/95 !backdrop-blur-sm`, `!rounded-xl`, progress bar: `!h-[3px] !bg-primary`).
   - **Native Dialogs**: In `Catalog.tsx`, `Dashboard.tsx`, `Scrap.tsx`, `Attributes.tsx`, `ItemGroups.tsx`, and `Kits.tsx`, native browser dialogs (`window.alert()` and `window.prompt()`) are invoked.

5. **Status Badges (`src/components/ui/StatusBadge.tsx`)**:
   - Lines 14-18:
     ```tsx
     success: { color: 'bg-[#DCFCE7] text-safety-green', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> },
     error: { color: 'bg-[#FEE2E2] text-safety-red', icon: <XCircle className="w-3 h-3 mr-1" /> },
     ...
     ```
   - *Discrepancy:* Uses `mr-1` on all icons (breaks RTL Arabic).
   - *Discrepancy:* Lacks hairline borders (`border border-emerald-200`, `border border-amber-200`, etc.), lacks `rounded-full` pill styling, and lacks dark mode variants.

---

### 1.3 Application Views & Pages Catalog (All 34 Pages)
Every page file in `src/pages/` was cataloged and audited:

| # | Page File | Route in App.tsx | Role / Module | Current Card / Table Styling | Forms / Filter Bars | Modals / Dialogs | Dark Mode | RTL Inconsistencies | Alignment Priority |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `Dashboard.tsx` | `/` | Analytics & Executive Dashboards (BD-I490/491/492) | Raw cards with `bg-white border-slate-200`; uses Recharts rather than ApexCharts | Custom button tabs; raw select inputs | Hand-rolled IssueKit & Overdue modals; native `alert()` | 0% | Chart axes not mirrored (`yaxis.opposite: isRtl` missing); tabs order unmirrored | **HIGH** |
| 2 | `Catalog.tsx` | `/catalog` | Module B: PPE Catalog Management | DataTable in `rounded-lg border-slate-200`; no pagination | FilterBar with SearchInput & 4 raw selects | 3 hand-rolled modals (drawer, lifespan, import); native `alert()` | 0% | Search icon overlaps text; table text forced left | **HIGH** |
| 3 | `CatalogForm.tsx` | `/catalog/new`, `/catalog/:id/edit` | Module B: Create/Edit PPE Item Form | Raw card panels with `border-slate-200 p-6` | Raw HTML inputs & selects (`border-slate-300 rounded px-3 py-2`) | None | 0% | Arabic input has `dir="rtl"`, but English fields lack direction isolation | **HIGH** |
| 4 | `Attributes.tsx` | `/attributes` | Module B: Dynamic Attributes (PPE-008..012) | DataTable with code/name chips; SlideOverDrawer | FilterBar with status filter | Native `alert()` for Admin restriction; SlideOverDrawer | 0% | Drawer pinned right; table forced left | **MEDIUM** |
| 5 | `AttributeForm.tsx` | `/attributes/new`, `/attributes/:id/edit` | Module B: Create/Edit Dynamic Attribute | Custom card with multi-value row inputs | Raw inputs; GripVertical icon | AdminOverrideModal | 0% | Value list indentation unmirrored | **MEDIUM** |
| 6 | `ItemGroups.tsx` | `/item-groups` | Module B: Item Groups (PPE-013..017) | DataTable with attribute chips & gender badges | FilterBar with search & status | Native `alert()` for Admin restriction | 0% | Table text forced left | **MEDIUM** |
| 7 | `ItemGroupForm.tsx`| `/item-groups/new`, `/item-groups/:id/edit` | Module B: Create/Edit Item Group | Card panels with attribute checkbox list | Raw inputs & checkboxes | AdminOverrideModal | 0% | Checkbox margins unmirrored | **MEDIUM** |
| 8 | `Locations.tsx` | `/locations` | Module C: Warehouse Locations (PPE-018..022) | DataTable with capacity progress bars | FilterBar with 4 raw selects | SlideOverDrawer for details | 0% | Drawer pinned right; capacity bars unmirrored | **HIGH** |
| 9 | `LocationForm.tsx` | `/locations/new`, `/locations/:id/edit` | Module C: Create/Edit Location | Card panels with store keeper button toggles | Raw inputs; capacity warning banner | None | 0% | Button toggle list margins | **MEDIUM** |
| 10 | `StoreKeeperMatrix.tsx` | `/settings/store-keeper-assignments` | Module C: Store Keeper Access Matrix (PPE-023) | Raw HTML `<table>` with custom matrix checkboxes | None | None | 0% | Matrix header & cell alignment unmirrored | **HIGH** |
| 11 | `Stock.tsx` | `/stock` | Module C: Stock Levels & Low Stock Alerts (PPE-025) | DataTable with batch rows & reorder warnings | FilterBar with location/status/lowStock toggles | Hand-rolled Quarantine Release modal | 0% | Table forced left | **HIGH** |
| 12 | `StockAdjustments.tsx`| `/stock/adjustments` | Module D: Stock Adjustments (1430 lines!) | Houses Stock IN, OUT, OB, and Review Queue subviews | Heavy use of raw inputs, selects, radio buttons | Review decision modal; hand-rolled dialogs | 0% | Form grids, radio card borders, table forced left | **HIGH** |
| 13 | `StockAdjustmentForm.tsx` | `/stock/adjustments/new` | Module D: Redirect proxy | Redirects to `/stock/adjustments?tab=in` | N/A | N/A | N/A | N/A | **LOW** |
| 14 | `Transfers.tsx` | `/stock/transfers` | Module C: Inter-Warehouse Transfers (PPE-024) | DataTable showing transfer audit records | None (action in header) | None | 0% | Route arrow `→` does not invert in RTL | **MEDIUM** |
| 15 | `TransferForm.tsx` | `/stock/transfers/new` | Module C: Initiate Transfer Form | Card panels with From/To location dropdowns | Raw inputs; condition rule warning banner | None | 0% | ArrowLeft back icon unmirrored | **MEDIUM** |
| 16 | `OpeningBalances.tsx` | `/stock/opening-balances` | Module D: Redirect proxy | Redirects to `/stock/adjustments?tab=ob` | N/A | N/A | N/A | N/A | **LOW** |
| 17 | `OpeningBalanceForm.tsx`| `/stock/opening-balances/new` | Module D: Redirect proxy | Redirects to `/stock/adjustments?tab=ob` | N/A | N/A | N/A | N/A | **LOW** |
| 18 | `Kits.tsx` | `/kits` | Module B: Safety Kits (PPE-029..033) | DataTable with job positions & item counts | FilterBar with search & position | Native `alert()` for Admin restriction; SlideOverDrawer | 0% | Table forced left | **MEDIUM** |
| 19 | `KitForm.tsx` | `/kits/new`, `/kits/:id/edit` | Module B: Create/Edit Safety Kit Form | Card panels with multi-line item table | Raw inputs & selects; add/remove line buttons | AdminOverrideModal | 0% | Table line item alignment | **MEDIUM** |
| 20 | `Issuances.tsx` | `/issuances` | Module E: Employee Issuances (PPE-034) | DataTable with issuance status & condition | FilterBar with search & location | Hand-rolled Return modal with dual SignaturePads | 0% | Table forced left; signature pads | **HIGH** |
| 21 | `IssuanceForm.tsx` | `/issuances/new` | Module E: Issue Single Item Form | Card panels; FIFO batch pills; dual SignaturePads | Raw inputs & selects | None | 0% | Form column ordering | **HIGH** |
| 22 | `IssueKitForm.tsx` | `/issuances/new-kit` | Module E: Issue Safety Kit Form | Auto-suggest kit cards; multi-line batch grid | Raw selects; dual SignaturePads | None | 0% | Card grids & signature layouts | **HIGH** |
| 23 | `IssueLoanForm.tsx`| `/issuances/new-loan` | Module E: Temporary Loan Form (PPE-036) | Multi-line equipment grid; dual SignaturePads | Raw inputs & selects; date picker | None | 0% | Date picker & table line inputs | **HIGH** |
| 24 | `OpenLoans.tsx` | `/issuances/open-loans` | Module E: Active Loans & Overdue (PPE-041) | DataTable with overdue badges & days calculation | FilterBar with active/all toggle | Hand-rolled line item return modal | 0% | Table forced left | **HIGH** |
| 25 | `ReplacementsDue.tsx` | `/issuances/replacements-due` | Module E: Expiry & Replacements Due (PPE-039) | DataTable with days remaining & Quick Issue action | FilterBar with status & site filter | None | 0% | Action button margin & table forced left | **HIGH** |
| 26 | `Employees.tsx` | `/employees` | Module F: Employee Directory (PPE-042) | DataTable with avatar initials & personnel badges | FilterBar with 4 raw selects & search | None | 0% | Table forced left | **HIGH** |
| 27 | `EmployeeDetail.tsx`| `/employees/:id` | Module F: Employee Profile & Timeline (PPE-043) | Hero Profile Card with metrics snapshot; timeline | Custom button tabs; PDF export button | None | 0% | Uses legacy tokens (`bg-surface`, `text-ink`, `bg-accent`); back arrow unmirrored | **HIGH** |
| 28 | `HistoricalImport.tsx`| `/employees/historical-import` | Module F: Historical Paper Records Import (PPE-044) | Preview DataTable with validity check badges | Raw file input; demo load button | None | 0% | Preview table forced left | **MEDIUM** |
| 29 | `TrashBin.tsx` | `/trash` | Module G: Shared Trash Bin (PPE-048) | DataTable with retention days remaining | FilterBar with entity type filter | Code conflict resolution modal | 0% | Table forced left | **MEDIUM** |
| 30 | `AuditLogs.tsx` | `/audit-logs` | Module G: Immutable Audit Log (PPE-049) | DataTable with CSV export | FilterBar with object type & action | Hand-rolled JsonDiffViewer modal | 0% | Table forced left; JSON viewer | **MEDIUM** |
| 31 | `ModuleSettings.tsx`| `/settings` | Module G: Module Governance Settings (PPE-050) | Form card with per-site lead time grid | Raw inputs; read-only warning card | None | 0% | Grid alignment | **MEDIUM** |
| 32 | `ExpirySettings.tsx`| `/settings/expiry` | Module G: Re-exports ModuleSettings | Re-exports `ModuleSettingsPage` | N/A | N/A | N/A | N/A | **LOW** |
| 33 | `MyPPE.tsx` | `/my-ppe` | Self-Service Worker PPE Portal | Profile card; issued equipment DataTable | None | None | 0% | Uses legacy tokens (`bg-surface`, `text-ink`, `bg-accent`); table forced left | **MEDIUM** |
| 34 | `Scrap.tsx` | `/scrap` | Scrap & Damaged Returns Log (PPE-038) | DataTable with reversal status | None | Native `window.prompt()` for reversal reason | 0% | Table forced left | **MEDIUM** |

---

### 1.4 Deep Audit: RTL & Dark Mode Inconsistencies
1. **Dark Mode Execution**:
   - `Select-String -Path src\**\*.tsx -Pattern "dark:"`: Returned **0 matches**.
   - No `.dark` theme provider or toggle mechanism is connected.
   - The entire front-end codebase is locked into light mode.
2. **Typography & Font Loading**:
   - `index.html`: Contains 0 Google Font links for **Almarai**.
   - `src/index.css`: Sets `font-family: "Inter", ui-sans-serif, system-ui, sans-serif;`.
   - `tailwind.config.js`: Not configured; `@tailwindcss/vite` v4 is loaded without font definitions.
3. **Hardcoded Directional Classes in UI**:
   - `DataTable.tsx:26`: `text-left` is hardcoded.
   - `SearchInput.tsx:15, 18`: `left-2.5` and `pl-9` are hardcoded.
   - `SlideOverDrawer.tsx:51, 54`: `right-0 pl-10 border-l` is hardcoded.
   - `StatusBadge.tsx:14-18`: `mr-1` is hardcoded.
   - `Toast.tsx:10`: `bottom-4 right-4` is hardcoded.
   - `ToggleSwitch.tsx:28`: `translate-x-2` / `-translate-x-2` is hardcoded.
   - `PageHeader.tsx:11`: `-ml-2` is hardcoded.
   - Navigation & chevron icons: `ChevronRight`, `ArrowLeft`, `ArrowRight` lack `rtl:rotate-180` or `scale-x-[-1]`.

---

## 2. Logic Chain

1. **Premise 1 (Design System Mandate)**:
   - `ORIGINAL_REQUEST.md` and `DESIGN_SYSTEM.md` mandate that the HSE front-end design system specification must be applied across PPE-FINAL for production use.
   - This includes:
     * Almarai font globally.
     * Primary navy `#212B59`, canvas `#F5F6FD`, border `#E2E8F0`, and dark mode tokens.
     * Standard layout shell (Header with search, theme switch, language switcher, user profile; Sidebar 260px/70px with mobile responsive drawer).
     * Standard shared components (Button variants/states, Mantine Select/Switch/Modal, DataTable with sort/pagination/actions, SweetAlert2 alerts/toasts).
     * Dark/Light mode parity and full Arabic (RTL) mirroring across all 34 views.

2. **Premise 2 (Layout Shell Gap)**:
   - Direct inspection of `src/components/layout/Layout.tsx` revealed:
     * Hardcoded `w-64` / `w-16` instead of `260px` / `70px`.
     * No mobile off-canvas drawer (<1024px); mobile layout collapses or overflows.
     * Hardcoded `h-14` header missing search bar, theme switcher, and user avatar dropdown.
     * Canvas background is `#FAFAF9` / `slate-50` instead of `#F5F6FD` / `#060818`.
   - *Inference*: The layout shell must be decomposed into modular components (`Sidebar.tsx`, `Header.tsx`, `Breadcrumbs.tsx`, `Layout.tsx`) with strict 260px/70px sizing, mobile drawer backdrop, and header toolbar controls.

3. **Premise 3 (Shared Components Gap)**:
   - Direct inspection of `src/components/ui/` revealed:
     * `Button.tsx` uses obsolete orange tokens (`bg-accent` #D97F1E) and lacks `solid`, `outline`, `text`, `icon` variants and loading states.
     * `DataTable.tsx` has hardcoded `text-left`, lacks sort indicators, row selection, pagination, and TableActionsButtons.
     * `Input.tsx` and `Select.tsx` lack `rounded-xl h-[40px] border-[#E2E8F0]` styling, helper text, and error states.
     * Missing critical components: `ContainerCard`, `KpiCard`, `Breadcrumbs`, `Tabs`, `TableActionsButtons`, `SharedAppliedFilters`, `Textarea`, `CheckboxCard`, `RadioCards`, `DatePicker`, `FileUpload`, `useSwal`.
     * 6+ views invoke native `window.alert()` and `window.prompt()`.
   - *Inference*: Existing UI components must be adapted and missing components created to establish a reusable HSE UI component library before updating views.

4. **Premise 4 (Application Views Gap)**:
   - Cataloging all 34 views revealed that each view uses inline, unstandardized cards (`border-slate-200 rounded-lg p-6`), raw HTML form inputs/selects, custom button tabs, and hand-rolled modal overlays.
   - Recharts is used in `Dashboard.tsx` instead of ApexCharts.
   - `EmployeeDetail.tsx` and `MyPPE.tsx` use deprecated tokens (`bg-surface`, `text-ink`, `bg-accent`).
   - *Inference*: Every view requires styling alignment to consume `ContainerCard`, standard form inputs, `DataTable`, `Tabs`, and `useSwal` confirmation dialogs.

5. **Premise 5 (Dark Mode & RTL Inconsistencies)**:
   - Codebase search verified exactly **0 `dark:` classes** in `src/`.
   - RTL search revealed hardcoded physical positioning (`text-left`, `right-0`, `pl-9`, `mr-1`, `translate-x-2`) that directly distorts Arabic layouts.
   - *Inference*: Systematic dark mode tokens and logical directional utility classes (`ltr:` / `rtl:` or `ms-`, `me-`, `text-start`) must be introduced across foundations, components, and views.

---

## 3. Caveats

1. **Backend Integration Preserved**:
   - Investigation focused strictly on front-end components and views. Business logic in `src/store/useStore.ts` (FIFO allocations, dual signatures, Store Keeper location scoping, Rule 3 in-use restrictions) must remain fully intact during styling refactoring.
2. **Package Version Compatibility**:
   - The project runs React 19 (`"react": "^19.0.1"`). When integrating `@mantine/core` v8 or `@mantine/dates`, peer dependency flags (`--legacy-peer-deps`) may be required or styling equivalents must be adapted cleanly.
3. **Recharts vs ApexCharts in Dashboard**:
   - `Dashboard.tsx` currently has functional time-series charts using Recharts. `package.json` also has `react-apexcharts` installed. The refactoring can either style Recharts with HSE design tokens or migrate to ApexCharts per DESIGN_SYSTEM.md.

---

## 4. Conclusion

The PPE-FINAL front-end application contains a complete, working set of 34 views and features, but exhibits a **complete divergence from DESIGN_SYSTEM.md**:
- **Design Tokens & Typography**: Currently using Inter font and obsolete Tailwind v4 / orange accent tokens; Almarai font and HSE color palette are missing.
- **Layout Shell**: Inline `Layout.tsx` lacks mobile off-canvas drawer (<1024px), lacks 260px/70px sizing, and lacks header search, theme toggle, and user avatar dropdown.
- **Shared Components**: 12 critical components are missing (`ContainerCard`, `KpiCard`, `Breadcrumbs`, `Tabs`, `TableActionsButtons`, `SharedAppliedFilters`, `Textarea`, `CheckboxCard`, `RadioCards`, `DatePicker`, `FileUpload`, `useSwal`), and existing components (`Button`, `DataTable`, `Input`, `StatusBadge`, `ToggleSwitch`, `SlideOverDrawer`) deviate in variants, dimensions, and RTL support.
- **Application Views**: All 34 views require alignment with `ContainerCard`, standardized form inputs, `DataTable` with pagination, and SweetAlert2 confirmation dialogs.
- **Dark Mode**: 0% implemented across all `.tsx` files.
- **RTL Support**: Severe visual regressions caused by hardcoded `text-left`, `right-0`, `pl-9`, `mr-1`, and unmirrored chevrons/toggles.

### High-Priority Implementation Roadmap:
1. **Phase 1: Foundation & Layout Shell**:
   - Load Almarai font globally; configure Tailwind color/radius/shadow tokens.
   - Decompose `Layout.tsx` into `Sidebar.tsx` (260px/70px + mobile drawer), `Header.tsx` (70px + search + theme switcher + language dropdown + user avatar), and `Breadcrumbs.tsx`.
2. **Phase 2: Shared UI Components Adaptation & Creation**:
   - Refactor `Button`, `Input`, `Select`, `DataTable`, `StatusBadge`, `ToggleSwitch`, `SlideOverDrawer`.
   - Create `ContainerCard`, `KpiCard`, `Tabs`, `TableActionsButtons`, `SharedAppliedFilters`, `DatePicker`, `FileUpload`, and `useSwal`.
3. **Phase 3: High-Priority Views Alignment (Tier 1 Views)**:
   - `Dashboard.tsx`: KPI stat widgets, chart theme tokens, tab navigation.
   - `Catalog.tsx` & `CatalogForm.tsx`: Table pagination/actions, standard form inputs, Mantine modals.
   - `Stock.tsx` & `StockAdjustments.tsx`: 4 sub-view tabs, radio cards, batch inventory table.
   - `Issuances.tsx`, `IssuanceForm.tsx`, `IssueKitForm.tsx`, `IssueLoanForm.tsx`, `OpenLoans.tsx`: Dual signature pad layouts, return modals.
   - `Employees.tsx` & `EmployeeDetail.tsx`: Profile hero card, timeline table, token updates.
4. **Phase 4: Remaining Views & RTL/Dark Mode Polish**:
   - Align remaining 14 views (Locations, Kits, Transfers, TrashBin, AuditLogs, ModuleSettings, Scrap, etc.).
   - Verify dark mode parity and RTL mirroring across all screens.

---

## 5. Verification Method

### 5.1 Independent Codebase Inspection
1. **Inspect Shell & Sidebar Sizing**:
   ```powershell
   Get-Content src\components\layout\Layout.tsx | Select-String "w-64", "w-16", "h-14", "bg-slate-900"
   ```
2. **Verify Dark Mode Class Count (Currently 0)**:
   ```powershell
   Select-String -Path src\**\*.tsx -Pattern "dark:" | Measure-Object
   ```
3. **Verify Hardcoded Directional Classes**:
   ```powershell
   Select-String -Path src\components\ui\*.tsx -Pattern "text-left", "right-0", "pl-9", "mr-1", "translate-x-2"
   ```
4. **Verify Native Browser Dialog Usage**:
   ```powershell
   Select-String -Path src\pages\*.tsx -Pattern "alert\(", "window\.prompt\("
   ```

### 5.2 Build & Test Verification
1. **Client Build**:
   ```bash
   npm run build
   ```
   *Expected result*: Completes with 0 TypeScript/Vite packaging errors.
2. **Server Build**:
   ```bash
   npm run build:server
   ```
   *Expected result*: Completes with 0 compilation errors.
3. **End-to-End Suite**:
   ```bash
   npm run test:e2e
   ```
   *Expected result*: Passes 565/575 tests (98.3%) without regression.

### 5.3 Invalidation Conditions
This report is invalidated if:
- `src/components/layout/Layout.tsx` already contains an off-canvas drawer with `fixed inset-0 bg-[black]/60 z-50` and 260px/70px sidebar widths.
- `src/components/ui/Button.tsx` already supports `solid`, `outline`, `text`, `icon` variants using `#212B59` primary color.
- Dark mode classes already exist in `src/pages/*.tsx`.
- Almarai font is already linked in `index.html`.
