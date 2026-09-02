# Milestone 3 Refactoring Specification: Master Data & Catalog Views
**State Folder:** `.agents/teamwork/explorer_m3_1/`  
**Target Scope:** 9 Master Data & Catalog pages (`Catalog.tsx`, `CatalogForm.tsx`, `Attributes.tsx`, `AttributeForm.tsx`, `ItemGroups.tsx`, `ItemGroupForm.tsx`, `Locations.tsx`, `LocationForm.tsx`, `StoreKeeperMatrix.tsx`).  
**Author:** Explorer Subagent (Milestone 3)  
**Date:** 2026-11-11  

---

## Executive Summary
This document provides an exhaustive, line-by-line audit and production-ready refactoring blueprint for Milestone 3 (Master Data & Catalog Views).
Across the 9 audited pages, we identified:
1. **10 native browser dialog occurrences** (`window.alert()` and `window.confirm()`) that violate design system feedback standards; these are mapped to SweetAlert2 helpers (`showConfirm`, `showInfo`, `showToast`).
2. **25 hardcoded directional utility classes** (`mr-*`, `ml-*`, `pl-*`, `right-*`, `text-left`, `text-right`) that break RTL bilingual layouts (Arabic/English); these are mapped to Tailwind logical utilities (`me-*`, `ms-*`, `ps-*`, `end-*`, `text-start`, `text-end`).
3. **Pervasive legacy colors and card styles** (`border-slate-200`, `bg-white`, `bg-slate-50`, hardcoded badge colors `bg-red-100`, `bg-amber-100`, `bg-emerald-100`, `bg-teal-50`); these are mapped to design system tokens and shared components (`ContainerCard`, `CustomTable` / `DataTable`, `Button`, `Input`, `Select`, `Textarea`, `StatusBadge`, `ToggleSwitch`, `Modal`, `SlideOverDrawer`, `TableActionsButtons`).
4. **Unstyled raw form controls** in form views (`<input>`, `<select>`, `<textarea>`, custom checkbox implementations); these are refactored to shared UI primitives with full dark mode token parity.
5. **Zero test breakage**: Verified that automated tests (`npm run test:server` and `npm run test:e2e`) operate against backend REST endpoints; all front-end form field names, state models, route bindings, and IDs are strictly preserved.

---

## 1. Observation

### 1.1 Native Dialogs Inventory (10 Occurrences)
| # | File Path | Line | Verbatim Code | Required Remediation |
|---|---|---|---|---|
| 1 | `src/pages/Catalog.tsx` | 122 | `alert('This item cannot be deactivated because employees currently hold active issuances. Only an Admin can override this restriction.');` | Replace with `await showInfo('Deactivation Restriction', 'This item cannot be deactivated because employees currently hold active issuances. Only an Admin can override this restriction.');` |
| 2 | `src/pages/Catalog.tsx` | 147 | `alert('This item cannot be deleted because employees currently hold active issuances. Only an Admin can override this restriction.');` | Replace with `await showInfo('Deletion Restriction', 'This item cannot be deleted because employees currently hold active issuances. Only an Admin can override this restriction.');` |
| 3 | `src/pages/Catalog.tsx` | 182 | `alert("No items to export.");` | Replace with `showToast("No items to export.", "warning");` |
| 4 | `src/pages/Attributes.tsx` | 60 | `alert(\`This attribute is currently linked to active Item Groups (${linked.map(l => l.nameEn).join(', ')}). Only an Admin can override and deactivate it.\`);` | Replace with `await showInfo('Deactivation Restriction', \`This attribute is currently linked to active Item Groups (${linked.map(l => l.nameEn).join(', ')}). Only an Admin can override and deactivate it.\`);` |
| 5 | `src/pages/Attributes.tsx` | 82 | `alert(\`Cannot trash attribute: Linked to active Item Groups. Only Admin can override.\`);` | Replace with `await showInfo('Deletion Restriction', 'Cannot move attribute to trash: Linked to active Item Groups. Only an Admin can override.');` |
| 6 | `src/pages/ItemGroups.tsx` | 60 | `alert(\`This item group is assigned to active catalog items (${linked.map(l => l.itemCode).join(', ')}). Only an Admin can override and deactivate it.\`);` | Replace with `await showInfo('Deactivation Restriction', \`This item group is assigned to active catalog items (${linked.map(l => l.itemCode).join(', ')}). Only an Admin can override and deactivate it.\`);` |
| 7 | `src/pages/ItemGroups.tsx` | 82 | `alert('Cannot trash item group: Assigned to active catalog items. Only Admin can override.');` | Replace with `await showInfo('Deletion Restriction', 'Cannot move item group to trash: Assigned to active catalog items. Only an Admin can override.');` |
| 8 | `src/pages/Locations.tsx` | 96 | `alert(\`STRICT HARD BLOCK (NO OVERRIDE ALLOWED):\\n\\nCannot deactivate location "${loc.nameEn}".\\nReason: ${meta.hardBlockReason}\`);` | Replace with `await showInfo('Strict Hard Block', \`Cannot deactivate location "${loc.nameEn}".\\n\\nReason: ${meta.hardBlockReason}\`);` |
| 9 | `src/pages/Locations.tsx` | 106 | `alert(\`STRICT HARD BLOCK (NO OVERRIDE ALLOWED):\\n\\nCannot delete location "${loc.nameEn}".\\nReason: ${meta.hardBlockReason}\`);` | Replace with `await showInfo('Strict Hard Block', \`Cannot delete location "${loc.nameEn}".\\n\\nReason: ${meta.hardBlockReason}\`);` |
| 10 | `src/pages/Locations.tsx` | 110 | `if (confirm(\`Move location "${loc.nameEn}" (${loc.code}) to the Trash Bin?\`))` | Replace with `const confirmed = await showConfirm('Move to Trash', \`Move location "${loc.nameEn}" (${loc.code}) to the Trash Bin?\`, 'Move to Trash', true); if (confirmed) ...` |

### 1.2 Directional & LTR Hardcoding Inventory (25 Occurrences)
| # | File Path | Line | Current LTR Code | Logical / Bilingual Replacement |
|---|---|---|---|---|
| 1 | `src/pages/Catalog.tsx` | 295 | `<Upload className="w-3.5 h-3.5 mr-1.5" />` | `<Upload className="w-3.5 h-3.5 me-1.5" />` |
| 2 | `src/pages/Catalog.tsx` | 298 | `<Download className="w-3.5 h-3.5 mr-1.5" />` | `<Download className="w-3.5 h-3.5 me-1.5" />` |
| 3 | `src/pages/Catalog.tsx` | 302 | `<Plus className="w-3.5 h-3.5 mr-1.5" />` | `<Plus className="w-3.5 h-3.5 me-1.5" />` |
| 4 | `src/pages/Catalog.tsx` | 486 | `className: 'w-28 text-right'` | `className: 'w-28 text-end'` / `align: 'right'` |
| 5 | `src/pages/Catalog.tsx` | 624 | `<div className="text-right font-mono">` | `<div className="text-end font-mono">` |
| 6 | `src/pages/CatalogForm.tsx` | 141 | `<ArrowLeft className="w-3.5 h-3.5 mr-1" />` | `<ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" />` |
| 7 | `src/pages/CatalogForm.tsx` | 175 | `className="absolute right-2.5 top-2.5..."` | `className="absolute end-2.5 top-2.5..."` |
| 8 | `src/pages/CatalogForm.tsx` | 408 | `className="flex items-center gap-2 pl-7 sm:pl-0"` | `className="flex items-center gap-2 ps-7 sm:ps-0"` |
| 9 | `src/pages/Attributes.tsx` | 111 | `<Plus className="w-3.5 h-3.5 mr-1.5" />` | `<Plus className="w-3.5 h-3.5 me-1.5" />` |
| 10 | `src/pages/Attributes.tsx` | 204 | `className: 'w-24 text-right'` | `className: 'w-24 text-end'` / `align: 'right'` |
| 11 | `src/pages/Attributes.tsx` | 266 | `<span className="text-slate-500 font-arabic ml-2">` | `<span className="text-slate-500 font-arabic ms-2">` |
| 12 | `src/pages/AttributeForm.tsx` | 151 | `<ArrowLeft className="w-3.5 h-3.5 mr-1" />` | `<ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" />` |
| 13 | `src/pages/AttributeForm.tsx` | 228 | `<Plus className="w-3.5 h-3.5 mr-1" />` | `<Plus className="w-3.5 h-3.5 me-1" />` |
| 14 | `src/pages/ItemGroups.tsx` | 111 | `<Plus className="w-3.5 h-3.5 mr-1.5" />` | `<Plus className="w-3.5 h-3.5 me-1.5" />` |
| 15 | `src/pages/ItemGroups.tsx` | 208 | `className: 'w-24 text-right'` | `className: 'w-24 text-end'` / `align: 'right'` |
| 16 | `src/pages/ItemGroupForm.tsx` | 155 | `<ArrowLeft className="w-3.5 h-3.5 mr-1" />` | `<ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" />` |
| 17 | `src/pages/Locations.tsx` | 124 | `<Users className="w-3.5 h-3.5 mr-1" />` | `<Users className="w-3.5 h-3.5 me-1" />` |
| 18 | `src/pages/Locations.tsx` | 127 | `<Plus className="w-3.5 h-3.5 mr-1.5" />` | `<Plus className="w-3.5 h-3.5 me-1.5" />` |
| 19 | `src/pages/Locations.tsx` | 277 | `className: 'w-24 text-right'` | `className: 'w-24 text-end'` / `align: 'right'` |
| 20 | `src/pages/Locations.tsx` | 406 | `<div className="text-right font-mono">` | `<div className="text-end font-mono">` |
| 21 | `src/pages/LocationForm.tsx` | 132 | `<ArrowLeft className="w-3.5 h-3.5 mr-1" />` | `<ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" />` |
| 22 | `src/pages/LocationForm.tsx` | 165 | `className="absolute right-2.5 top-2.5..."` | `className="absolute end-2.5 top-2.5..."` |
| 23 | `src/pages/LocationForm.tsx` | 262 | `className="absolute right-6 top-2.5..."` | `className="absolute end-6 top-2.5..."` |
| 24 | `src/pages/StoreKeeperMatrix.tsx` | 59 | `<Check className="w-4 h-4 mr-1.5" />` | `<Check className="w-4 h-4 me-1.5" />` |
| 25 | `src/pages/StoreKeeperMatrix.tsx` | 66 | `<table className="w-full text-left text-xs...">` | `<table className="w-full ltr:text-left rtl:text-right text-xs...">` |

### 1.3 Legacy Styling & Unstyled DOM Structures
- **Table Wrappers**: `Catalog.tsx:351`, `Attributes.tsx:130`, `ItemGroups.tsx:130`, `Locations.tsx:164`, `StoreKeeperMatrix.tsx:64` all use raw `<div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">` instead of `<ContainerCard noPadding className="...">` or design system token containers (`border-[#E2E8F0] dark:border-[#17263c] bg-white dark:bg-[#0e1726]`).
- **Raw Modals**:
  - `Catalog.tsx:653-707`: Lifespan Quick-Edit modal is hand-rolled with raw `fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4` and raw `<input>`, `<select>`.
  - `Catalog.tsx:712-831`: Catalog Import modal is hand-rolled with raw `fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4`.
- **Raw Form Elements in Forms**:
  - `CatalogForm.tsx`, `AttributeForm.tsx`, `LocationForm.tsx`, `ItemGroupForm.tsx`: Raw `<input>`, `<select>`, and `<textarea>` elements with manual styling (`border-slate-300`, `focus:border-teal-500`, lack of dark theme tokens `dark:bg-[#121e32] dark:border-[#17263c] dark:text-slate-100`).
- **Table Action Buttons**:
  - `Catalog.tsx:489-517`, `Attributes.tsx:207-236`, `ItemGroups.tsx:210-239`, `Locations.tsx:281-313`: Hand-rolled button clusters without standardized tooltips or variants; should be mapped to `TableActionsButtons`.

---

## 2. Logic Chain

1. **Rule Compliance**: The HSE Design System specification (`DESIGN_SYSTEM.md`) stipulates:
   - Corporate Primary Navy (`#212B59`), Canvas (`#F5F6FD` / Dark `#060818`), Hairline Slate Borders (`#E2E8F0` / Dark `#17263c`), and elevated surfaces (`#FFFFFF` / Dark `#0e1726`).
   - All interactive dialogs must use SweetAlert2 (`swalCustom` / `toastCustom` / `useSwal`). Native browser dialogs (`alert()`, `confirm()`, `prompt()`) freeze the browser thread and violate accessibility/branding guidelines.
   - All action buttons in data tables must have Tippy tooltips (`TableActionsButtons`).
   - Layouts must be bidirectional (`dir="rtl"` / `dir="ltr"`) using logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`).
2. **Component Reuse**:
   - `ContainerCard` satisfies card and table container requirements with built-in dark mode support.
   - `DataTable` is already imported in `Catalog.tsx`, `Attributes.tsx`, `ItemGroups.tsx`, `Locations.tsx`; converting outer wrappers to `ContainerCard` ensures visual harmony.
   - `Input`, `Select`, `Textarea`, `ToggleSwitch` provide unified focus rings, error messages, required asterisks, and dark mode backgrounds.
   - `StatusBadge` provides calibrated semantic tints (`Category I/II/III`, `New/Used/Scrap`, `Active/Inactive`, `Low Stock`, `Out of Stock`) meeting contrast criteria.
   - `Modal` wraps Mantine's modal dialog with design system styling and proper accessibility.
3. **Preservation of Business Logic & State**:
   - Master data operations enforce critical HSE business rules:
     - **Rule 3 / BD-I444 / BD-I446**: In-use protection for items with active issuances.
     - **Rule 4 / BD-I457 / BD-I459**: Stock condition immutability once inventory is held, and hard-block guards against deactivating locations holding stock or sole locations for active items.
     - **Rule 5 / BD-I452**: Dynamic variant derivation from Item Groups and mandatory GENDER attribute attachment when "Requires Gender Match" is checked.
     - **Rule 12 / BD-I445**: Lifespan editing applies strictly to future issuances.
   - None of these rules are altered or bypassed. The refactoring replaces the presentation layer while preserving all existing handlers, state machines, and audit log calls.

---

## 3. Caveats & Assumptions

1. **AdminOverrideModal Integration**:
   - `AdminOverrideModal` is currently used across `Catalog.tsx`, `Attributes.tsx`, `AttributeForm.tsx`, `ItemGroups.tsx`, and `ItemGroupForm.tsx`.
   - The refactoring preserves `AdminOverrideModal` for multi-step reason capture (logging to Immutable Audit Log `NEW-05`), while replacing all raw `window.alert()` / `window.confirm()` calls with `useSwal` (`showInfo`, `showConfirm`, `showToast`).
2. **Backwards Compatibility of Form Inputs**:
   - In `CatalogForm.tsx`, `LocationForm.tsx`, and `AttributeForm.tsx`, form inputs must retain their `required`, `type`, `disabled`, and `onChange` signatures. The shared `Input` and `Select` components accept standard HTML input attributes, ensuring flawless compatibility.
3. **Test Independence**:
   - As verified in `tests/e2e/runner.ts` and `server/test-comprehensive.ts`, all automated tests test the Express API routes directly using HTTP clients.
   - Front-end views are validated through `npm run lint` (`tsc --noEmit`), `npm run build` (`vite build`), and end-to-end user workflows.

---

## 4. Conclusion & Actionable Assessment

The 9 target pages can be cleanly and safely transformed to 100% design system compliance without touching the backend or breaking test contracts. The implementation recipe below details the exact import changes, component substitutions, and class replacements for each file.

---

## 5. Verification Method

To independently verify the changes once implemented:
1. **Type & Lint Check**:
   ```powershell
   npm run lint
   ```
   Must complete with 0 TypeScript diagnostics or syntax errors.
2. **Client Build Check**:
   ```powershell
   npm run build
   ```
   Vite must produce bundles cleanly with 0 build warnings or module resolution errors.
3. **Server Build Check**:
   ```powershell
   npm run build:server
   ```
   Server TypeScript compilation must pass.
4. **Backend API Test Check**:
   ```powershell
   npm run test:server
   npm run test:e2e
   ```
   All comprehensive backend tests must pass with 100% success rate.
5. **DOM & Styling Inspection**:
   - Switch language between Arabic (RTL) and English (LTR): icons (`me-1.5`, `rtl:rotate-180`) must align properly with zero left/right collision.
   - Switch theme between Light and Dark: all cards (`ContainerCard`), inputs (`Input`, `Select`), table headers, badges (`StatusBadge`), and modals (`Modal`) must reflect token parity (`dark:bg-[#0e1726]`, `dark:bg-[#121e32]`, `dark:border-[#17263c]`).
   - Triggering restricted actions (e.g. deactivating an in-use item as non-admin, or trashing a blocked location) must render the SweetAlert2 modal instead of native browser popups.

---

## 6. Detailed Implementation Recipes (Page-by-Page)

---

### Page 1: `src/pages/Catalog.tsx`

#### Imports Update
```tsx
// ADD:
import { ContainerCard } from '../components/ui/ContainerCard';
import { Modal } from '../components/ui/Modal';
import { TableActionsButtons } from '../components/ui/TableActionsButtons';
import { useSwal } from '../lib/useSwal';
```

#### Native Dialogs Remediation
```tsx
// Initialize hook:
const { showInfo, showToast, showConfirm } = useSwal();

// BEFORE (Line 121-124):
if (currentUser.role !== 'Admin') {
  alert('This item cannot be deactivated because employees currently hold active issuances. Only an Admin can override this restriction.');
  return;
}

// AFTER:
if (currentUser.role !== 'Admin') {
  await showInfo(
    'Deactivation Restriction',
    'This item cannot be deactivated because employees currently hold active issuances. Only an Admin can override this restriction.'
  );
  return;
}

// BEFORE (Line 146-149):
if (currentUser.role !== 'Admin') {
  alert('This item cannot be deleted because employees currently hold active issuances. Only an Admin can override this restriction.');
  return;
}

// AFTER:
if (currentUser.role !== 'Admin') {
  await showInfo(
    'Deletion Restriction',
    'This item cannot be deleted because employees currently hold active issuances. Only an Admin can override this restriction.'
  );
  return;
}

// BEFORE (Line 181-184):
if (filteredItems.length === 0) {
  alert("No items to export.");
  return;
}

// AFTER:
if (filteredItems.length === 0) {
  showToast("No items to export.", "warning");
  return;
}
```

#### Directional Class Remediation
```tsx
// PageHeader actions (Lines 294-304):
// Replace mr-1.5 with me-1.5 on Upload, Download, Plus icons:
<Button variant="secondary" size="sm" onClick={() => setImportModalOpen(true)}>
  <Upload className="w-3.5 h-3.5 me-1.5" /> Import Catalog
</Button>
<Button variant="secondary" size="sm" onClick={handleExport}>
  <Download className="w-3.5 h-3.5 me-1.5" /> Export CSV
</Button>
{currentUser.role === 'Admin' && (
  <Button size="sm" onClick={() => navigate('/catalog/new')}>
    <Plus className="w-3.5 h-3.5 me-1.5" /> Add PPE Item
  </Button>
)}
```

#### Table Wrapper & Actions Column Mapping
```tsx
// Replace <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden"> with:
<ContainerCard noPadding className="overflow-hidden">
  <DataTable
    data={filteredItems}
    keyExtractor={(item) => item.id}
    emptyState={...}
    columns={[
      // ... columns ...
      // Risk category column badge:
      {
        key: 'riskCategory',
        header: 'Risk Level',
        className: 'w-32',
        render: (item) => (
          <StatusBadge status={item.riskCategory} />
        )
      },
      // Stock status column badge:
      {
        key: 'stockStatus',
        header: 'Stock & Watchlist',
        className: 'w-44',
        render: (item) => {
          const { totalAvailable, lowStockLocationsCount } = getItemStockSummary(item);
          const isOutOfStock = totalAvailable === 0;
          return (
            <div className="space-y-1">
              <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {totalAvailable} {item.uom}
              </div>
              {lowStockLocationsCount > 0 ? (
                <StatusBadge 
                  status="Low Stock" 
                  label={`Low at ${lowStockLocationsCount} ${lowStockLocationsCount === 1 ? 'loc' : 'locs'}`} 
                />
              ) : isOutOfStock ? (
                <StatusBadge status="Out of Stock" />
              ) : (
                <StatusBadge status="Active" label="In Stock" />
              )}
            </div>
          );
        }
      },
      // Actions column:
      {
        key: 'actions',
        header: '',
        align: 'right',
        className: 'w-28 text-end',
        render: (item) => (
          <TableActionsButtons
            onView={() => setSelectedItemForDetails(item)}
            viewTooltip="View Details (BD-I476)"
            onEdit={currentUser.role === 'Admin' ? () => navigate(`/catalog/${item.id}/edit`) : undefined}
            editTooltip="Edit Item (BD-I444)"
            onDelete={currentUser.role === 'Admin' ? () => handleTrash(item) : undefined}
            deleteTooltip="Move to Trash (BD-I446)"
            size="sm"
          />
        )
      }
    ]}
  />
</ContainerCard>
```

#### Modals Remediation (Quick Lifespan Edit & Catalog Import)
```tsx
// Replace raw Lifespan Edit modal (Lines 653-707) with shared <Modal>:
<Modal
  opened={Boolean(itemForLifespanEdit)}
  onClose={() => setItemForLifespanEdit(null)}
  title="Edit Item Lifespan (BD-I445)"
  subtitle={itemForLifespanEdit ? `${itemForLifespanEdit.nameEn} (${itemForLifespanEdit.itemCode})` : undefined}
  size="md"
  footer={
    <div className="flex items-center justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={() => setItemForLifespanEdit(null)}>
        Cancel
      </Button>
      <Button size="sm" onClick={handleSaveLifespan}>
        Save Lifespan
      </Button>
    </div>
  }
>
  {itemForLifespanEdit && (
    <div className="space-y-4">
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Changes apply strictly to <strong>future issuances only</strong> and will not recalculate dates for existing equipment holders.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Lifespan Value"
          type="number"
          min={1}
          value={newLifespanVal}
          onChange={e => setNewLifespanVal(Math.max(1, parseInt(e.target.value) || 1))}
        />
        <Select
          label="Unit"
          value={newLifespanUnit}
          onChange={val => setNewLifespanUnit((val as any) || 'Months')}
          data={['Days', 'Months', 'Years']}
        />
      </div>
    </div>
  )}
</Modal>

// Replace raw Import modal (Lines 712-831) with shared <Modal>:
<Modal
  opened={importModalOpen}
  onClose={() => setImportModalOpen(false)}
  title="Import Catalog from Spreadsheet (BD-I486)"
  size="lg"
  footer={
    <div className="flex items-center justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={() => setImportModalOpen(false)}>
        Close
      </Button>
      {importPreview && (
        <Button size="sm" onClick={() => setImportModalOpen(false)}>
          Done
        </Button>
      )}
    </div>
  }
>
  {/* Import Mode Radio Cards, Dropzone, and Validation Preview */}
  {/* ... wrapped in design system tokens: dark:bg-[#121e32] dark:border-[#17263c] ... */}
</Modal>
```

---

### Page 2: `src/pages/CatalogForm.tsx`

#### Imports Update
```tsx
// ADD:
import { ContainerCard } from '../components/ui/ContainerCard';
import { Textarea } from '../components/ui/Textarea';
```

#### Directional Class Remediation
```tsx
// Line 141:
// BEFORE:
<ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Catalog
// AFTER:
<ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" /> Back to Catalog

// Line 175:
// BEFORE:
className="absolute right-2.5 top-2.5 flex items-center gap-1 text-[10px] font-mono font-medium text-slate-500"
// AFTER:
className="absolute end-2.5 top-2.5 flex items-center gap-1 text-[10px] font-mono font-medium text-slate-500"

// Line 408:
// BEFORE:
className="flex items-center gap-2 pl-7 sm:pl-0"
// AFTER:
className="flex items-center gap-2 ps-7 sm:ps-0"
```

#### Form Controls & ContainerCard Refactoring
```tsx
// Replace raw section boxes with ContainerCard:
<ContainerCard title="Basic Identification" className="p-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input
      label="Item Code"
      required
      disabled={isCodeLocked}
      value={formData.itemCode}
      onChange={e => setFormData({ ...formData, itemCode: e.target.value.replace(/\s/g, '').toUpperCase() })}
      placeholder="e.g. HLM-001, GLOV-HV-01"
      error={errors.itemCode}
      helperText={isCodeLocked ? "This Item Code is permanently locked because transactions have been recorded." : undefined}
      endIcon={isCodeLocked ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : undefined}
      className="font-mono font-bold uppercase"
    />

    <Select
      label="Risk Category"
      required
      value={formData.riskCategory}
      onChange={val => setFormData({ ...formData, riskCategory: (val as RiskCategory) || 'Category II' })}
      data={[
        { value: 'Category I', label: 'Category I (Minor Risk — Hand/Sun protection)' },
        { value: 'Category II', label: 'Category II (Intermediate Risk — Helmets, safety footwear)' },
        { value: 'Category III', label: 'Category III (Irreversible/Lethal Risk — Harnesses, Respirators)' }
      ]}
      helperText="Category III items require HSE Supervisor approval for stock adjustments."
    />

    <Input
      label="Item Name (English)"
      required
      value={formData.nameEn}
      onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
      placeholder="e.g. MSA V-Gard Safety Helmet"
      error={errors.nameEn}
    />

    <Input
      label="Item Name (Arabic)"
      required
      dir="rtl"
      value={formData.nameAr}
      onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
      placeholder="مثال: خوذة أمان MSA V-Gard"
      error={errors.nameAr}
      className="font-arabic"
    />
  </div>
</ContainerCard>

<ContainerCard 
  title="Classification & Dynamic Variants (Rule 5)" 
  subtitle="Gender & Size attributes are derived from the selected Item Group"
  className="p-6"
>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Select
      label="Safety Category"
      required
      value={formData.category}
      onChange={val => setFormData({ ...formData, category: val || 'Head' })}
      data={CATEGORIES}
    />

    <Select
      label="Item Group"
      required
      value={formData.itemGroupId}
      onChange={val => setFormData({ ...formData, itemGroupId: val || '' })}
      data={itemGroups.filter(g => g.active).map(g => ({
        value: g.id,
        label: `${g.nameEn} (${g.code})`
      }))}
    />

    <Select
      label="Unit of Measure (UoM)"
      required
      value={formData.uom}
      onChange={val => setFormData({ ...formData, uom: val || 'Piece' })}
      data={['Piece', 'Pair', 'Set', 'Box']}
    />
  </div>
  {/* Dynamic variant badges with dark mode tokens: dark:bg-[#121e32] dark:border-[#17263c] */}
</ContainerCard>

<ContainerCard title="Lifespan & Expiry Calculation (Rule 12)" className="p-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input
      label="Lifespan Value"
      type="number"
      min={1}
      required
      value={formData.lifespanValue}
      onChange={e => setFormData({ ...formData, lifespanValue: Math.max(1, parseInt(e.target.value) || 1) })}
      error={errors.lifespan}
    />

    <Select
      label="Lifespan Unit"
      required
      value={formData.lifespanUnit}
      onChange={val => setFormData({ ...formData, lifespanUnit: (val as LifespanUnit) || 'Months' })}
      data={['Days', 'Months', 'Years']}
    />
  </div>
</ContainerCard>

<ContainerCard 
  title="Assigned Warehouse Locations & Reorder Levels" 
  subtitle="Only Active, non-Scrap locations are offered. Set an optional Reorder Level per location."
  className="p-6"
>
  {/* Checkbox cards styled with dark mode tokens */}
</ContainerCard>

<ContainerCard title="Manufacturer, Standards & Description" className="p-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Input
      label="Manufacturer"
      value={formData.manufacturer}
      onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
      placeholder="e.g. MSA, 3M, Ansell"
    />
    <Input
      label="Model / Part No."
      value={formData.model}
      onChange={e => setFormData({ ...formData, model: e.target.value })}
      placeholder="e.g. V-Gard 500, Aura 9332+"
    />
    <Input
      label="Standard / Certification"
      value={formData.standardCertification}
      onChange={e => setFormData({ ...formData, standardCertification: e.target.value })}
      placeholder="e.g. EN 397, ANSI Z89.1"
    />
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
    <Textarea
      label="Description (English)"
      rows={3}
      value={formData.descriptionEn}
      onChange={e => setFormData({ ...formData, descriptionEn: e.target.value })}
      placeholder="Technical specifications or care instructions..."
    />
    <Textarea
      label="Description (Arabic)"
      rows={3}
      dir="rtl"
      value={formData.descriptionAr}
      onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })}
      placeholder="المواصفات الفنية وتعليمات الاستخدام..."
      className="font-arabic"
    />
  </div>
</ContainerCard>
```

---

### Page 3: `src/pages/Attributes.tsx`

#### Imports Update
```tsx
// ADD:
import { ContainerCard } from '../components/ui/ContainerCard';
import { TableActionsButtons } from '../components/ui/TableActionsButtons';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useSwal } from '../lib/useSwal';
```

#### Native Dialogs Remediation
```tsx
const { showInfo } = useSwal();

// BEFORE (Line 59-62):
if (currentUser.role !== 'Admin') {
  alert(`This attribute is currently linked to active Item Groups (${linked.map(l => l.nameEn).join(', ')}). Only an Admin can override and deactivate it.`);
  return;
}

// AFTER:
if (currentUser.role !== 'Admin') {
  await showInfo(
    'Deactivation Restriction',
    `This attribute is currently linked to active Item Groups (${linked.map(l => l.nameEn).join(', ')}). Only an Admin can override and deactivate it.`
  );
  return;
}

// BEFORE (Line 81-84):
if (currentUser.role !== 'Admin') {
  alert(`Cannot trash attribute: Linked to active Item Groups. Only Admin can override.`);
  return;
}

// AFTER:
if (currentUser.role !== 'Admin') {
  await showInfo(
    'Deletion Restriction',
    'Cannot move attribute to trash: Linked to active Item Groups. Only an Admin can override.'
  );
  return;
}
```

#### Directional & Table Actions Remediation
```tsx
// Line 111:
<Plus className="w-3.5 h-3.5 me-1.5" /> Add Attribute

// Table wrapper:
<ContainerCard noPadding className="overflow-hidden">
  <DataTable
    data={filteredAttributes}
    keyExtractor={(item) => item.id}
    emptyState={<EmptyState icon={<Tags className="w-8 h-8 text-slate-400" />} title="No attributes found" />}
    columns={[
      // ... columns ...
      {
        key: 'actions',
        header: '',
        align: 'right',
        className: 'w-24 text-end',
        render: (item) => (
          <TableActionsButtons
            onView={() => setSelectedAttrForDetails(item)}
            viewTooltip="View Attribute Details (BD-I450)"
            onEdit={currentUser.role === 'Admin' ? () => navigate(`/attributes/${item.id}/edit`) : undefined}
            editTooltip="Edit Attribute (BD-I448)"
            onDelete={currentUser.role === 'Admin' ? () => handleTrash(item) : undefined}
            deleteTooltip="Move to Trash (BD-I451)"
            size="sm"
          />
        )
      }
    ]}
  />
</ContainerCard>

// Line 266 in SlideOverDrawer:
// Replace ml-2 with ms-2:
<span className="text-slate-500 font-arabic ms-2">({val.valueAr})</span>
```

---

### Page 4: `src/pages/AttributeForm.tsx`

#### Imports Update
```tsx
// ADD:
import { ContainerCard } from '../components/ui/ContainerCard';
import { Input } from '../components/ui/Input';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
```

#### Directional Class Remediation
```tsx
// Line 151:
<ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" /> Back to Attributes

// Line 228:
<Plus className="w-3.5 h-3.5 me-1" /> Add Value
```

#### Form Controls & Containers Refactoring
```tsx
<ContainerCard title="Attribute Details" className="p-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Input
      label="Attribute Code"
      required
      value={formData.code}
      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
      placeholder="e.g. SIZE, COLOR, GENDER"
      error={errors.code}
      className="font-mono font-bold uppercase"
    />
    <Input
      label="Name (English)"
      required
      value={formData.nameEn}
      onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
      placeholder="e.g. Shoe Size"
      error={errors.nameEn}
    />
    <Input
      label="Name (Arabic)"
      required
      dir="rtl"
      value={formData.nameAr}
      onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
      placeholder="مثال: مقاس الحذاء"
      error={errors.nameAr}
      className="font-arabic"
    />
  </div>
</ContainerCard>

<ContainerCard
  title={`Configured Values (${formData.values.length})`}
  subtitle="Provide bilingual values. Duplicates are strictly prevented."
  actions={
    <Button type="button" size="sm" variant="secondary" onClick={handleAddValue}>
      <Plus className="w-3.5 h-3.5 me-1" /> Add Value
    </Button>
  }
  className="p-6"
>
  {/* Value rows styled with dark mode tokens: dark:bg-[#121e32] dark:border-[#17263c] */}
</ContainerCard>
```

---

### Page 5: `src/pages/ItemGroups.tsx`

#### Imports Update
```tsx
// ADD:
import { ContainerCard } from '../components/ui/ContainerCard';
import { TableActionsButtons } from '../components/ui/TableActionsButtons';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useSwal } from '../lib/useSwal';
```

#### Native Dialogs Remediation
```tsx
const { showInfo } = useSwal();

// BEFORE (Line 59-62):
if (currentUser.role !== 'Admin') {
  alert(`This item group is assigned to active catalog items (${linked.map(l => l.itemCode).join(', ')}). Only an Admin can override and deactivate it.`);
  return;
}

// AFTER:
if (currentUser.role !== 'Admin') {
  await showInfo(
    'Deactivation Restriction',
    `This item group is assigned to active catalog items (${linked.map(l => l.itemCode).join(', ')}). Only an Admin can override and deactivate it.`
  );
  return;
}

// BEFORE (Line 81-84):
if (currentUser.role !== 'Admin') {
  alert('Cannot trash item group: Assigned to active catalog items. Only Admin can override.');
  return;
}

// AFTER:
if (currentUser.role !== 'Admin') {
  await showInfo(
    'Deletion Restriction',
    'Cannot move item group to trash: Assigned to active catalog items. Only an Admin can override.'
  );
  return;
}
```

#### Directional & Table Actions Remediation
```tsx
// Line 111:
<Plus className="w-3.5 h-3.5 me-1.5" /> Add Item Group

// Gender Match column:
{
  key: 'genderMatch',
  header: 'Gender Match',
  className: 'w-36',
  render: (item) => item.requiresGenderMatch ? (
    <StatusBadge status="warning" label="Mandatory Match" />
  ) : (
    <span className="text-slate-400 dark:text-slate-500 text-xs">Not required</span>
  )
}

// Actions column:
{
  key: 'actions',
  header: '',
  align: 'right',
  className: 'w-24 text-end',
  render: (item) => (
    <TableActionsButtons
      onView={() => setSelectedGroupForDetails(item)}
      viewTooltip="View Group Details (BD-I455)"
      onEdit={currentUser.role === 'Admin' ? () => navigate(`/item-groups/${item.id}/edit`) : undefined}
      editTooltip="Edit Item Group (BD-I453)"
      onDelete={currentUser.role === 'Admin' ? () => handleTrash(item) : undefined}
      deleteTooltip="Move to Trash (BD-I456)"
      size="sm"
    />
  )
}
```

---

### Page 6: `src/pages/ItemGroupForm.tsx`

#### Imports Update
```tsx
// ADD:
import { ContainerCard } from '../components/ui/ContainerCard';
import { Input } from '../components/ui/Input';
```

#### Directional Class Remediation
```tsx
// Line 155:
<ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" /> Back to Item Groups
```

#### Form Controls & Containers Refactoring
```tsx
<ContainerCard title="Group Identification" className="p-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Input
      label="Group Code"
      required
      value={formData.code}
      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
      placeholder="e.g. HELMETS, FOOTWEAR"
      error={errors.code}
      className="font-mono font-bold uppercase"
    />
    <Input
      label="Name (English)"
      required
      value={formData.nameEn}
      onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
      placeholder="e.g. Safety Footwear"
      error={errors.nameEn}
    />
    <Input
      label="Name (Arabic)"
      required
      dir="rtl"
      value={formData.nameAr}
      onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
      placeholder="مثال: أحذية السلامة"
      error={errors.nameAr}
      className="font-arabic"
    />
  </div>
</ContainerCard>

<ContainerCard
  title="Assigned Attributes (Rule 5)"
  subtitle="Equipment belonging to this group will dynamically generate variants from the checked attributes."
  className="p-6"
>
  {/* Attribute checkbox cards styled with dark mode tokens: dark:bg-[#121e32] dark:border-[#17263c] */}
</ContainerCard>

<ContainerCard title="Gender Matching Rule (Rule 5)" className="p-6">
  <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg flex items-start gap-3">
    <input
      type="checkbox"
      id="genderMatchCheckbox"
      checked={formData.requiresGenderMatch}
      onChange={e => handleGenderMatchToggle(e.target.checked)}
      className="mt-1 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
    />
    <div className="space-y-1">
      <label htmlFor="genderMatchCheckbox" className="font-bold text-xs text-amber-950 dark:text-amber-200 cursor-pointer">
        Requires Gender Match
      </label>
      <p className="text-xs text-amber-900 dark:text-amber-300/80 leading-relaxed">
        If ticked, the system forces inclusion of the <strong>GENDER</strong> attribute in this Item Group. 
        At Single Issuance (BD-I467) or Kit Issuance (BD-I468), the variant's Gender MUST equal the employee's gender OR be 'Unisex'; otherwise issuance is strictly blocked.
      </p>
    </div>
  </div>
  {errors.genderMatch && <p className="text-xs text-red-600 font-bold mt-2">{errors.genderMatch}</p>}
</ContainerCard>
```

---

### Page 7: `src/pages/Locations.tsx`

#### Imports Update
```tsx
// ADD:
import { ContainerCard } from '../components/ui/ContainerCard';
import { TableActionsButtons } from '../components/ui/TableActionsButtons';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useSwal } from '../lib/useSwal';
```

#### Native Dialogs Remediation
```tsx
const { showInfo, showConfirm } = useSwal();

// BEFORE (Line 95-98):
if (loc.active && meta.isHardBlocked) {
  alert(`STRICT HARD BLOCK (NO OVERRIDE ALLOWED):\n\nCannot deactivate location "${loc.nameEn}".\nReason: ${meta.hardBlockReason}`);
  return;
}

// AFTER:
if (loc.active && meta.isHardBlocked) {
  await showInfo(
    'Strict Hard Block (No Override Allowed)',
    `Cannot deactivate location "${loc.nameEn}".\n\nReason: ${meta.hardBlockReason}`
  );
  return;
}

// BEFORE (Line 104-113):
const handleTrash = (loc: Location) => {
  const meta = getLocationMeta(loc);
  if (meta.isHardBlocked) {
    alert(`STRICT HARD BLOCK (NO OVERRIDE ALLOWED):\n\nCannot delete location "${loc.nameEn}".\nReason: ${meta.hardBlockReason}`);
    return;
  }

  if (confirm(`Move location "${loc.nameEn}" (${loc.code}) to the Trash Bin?`)) {
    trashLocation(loc.id, 'Standard location deletion');
  }
};

// AFTER:
const handleTrash = async (loc: Location) => {
  const meta = getLocationMeta(loc);
  if (meta.isHardBlocked) {
    await showInfo(
      'Strict Hard Block (No Override Allowed)',
      `Cannot delete location "${loc.nameEn}".\n\nReason: ${meta.hardBlockReason}`
    );
    return;
  }

  const confirmed = await showConfirm(
    'Move to Trash',
    `Move location "${loc.nameEn}" (${loc.code}) to the Trash Bin?`,
    'Move to Trash',
    true
  );
  if (confirmed) {
    trashLocation(loc.id, 'Standard location deletion');
  }
};
```

#### Directional & Table Actions Remediation
```tsx
// Lines 124, 127:
<Users className="w-3.5 h-3.5 me-1" /> Access Matrix
<Plus className="w-3.5 h-3.5 me-1.5" /> Add Location

// Stock Condition column:
{
  key: 'condition',
  header: 'Stock Condition (Rule 4)',
  className: 'w-36',
  render: (loc) => (
    <StatusBadge status={loc.stockCondition} />
  )
}

// Opening Balance Status column:
{
  key: 'obStatus',
  header: 'Opening Bal',
  className: 'w-28 text-center',
  render: (loc) => (
    <StatusBadge 
      status={loc.openingBalanceStatus === 'Open' ? 'warning' : 'neutral'} 
      label={loc.openingBalanceStatus} 
    />
  )
}

// Actions column:
{
  key: 'actions',
  header: '',
  align: 'right',
  className: 'w-24 text-end',
  render: (loc) => {
    const meta = getLocationMeta(loc);
    return (
      <TableActionsButtons
        onView={() => setSelectedLocForDetails(loc)}
        viewTooltip="View Location Details (BD-I460)"
        onEdit={currentUser.role === 'Admin' ? () => navigate(`/locations/${loc.id}/edit`) : undefined}
        editTooltip="Edit Location (BD-I458)"
        onDelete={currentUser.role === 'Admin' ? () => handleTrash(loc) : undefined}
        deleteTooltip={meta.isHardBlocked ? `HARD BLOCKED: ${meta.hardBlockReason}` : 'Move to Trash (BD-I461)'}
        size="sm"
      />
    );
  }
}
```

---

### Page 8: `src/pages/LocationForm.tsx`

#### Imports Update
```tsx
// ADD:
import { ContainerCard } from '../components/ui/ContainerCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
```

#### Directional Class Remediation
```tsx
// Line 132:
<ArrowLeft className="w-3.5 h-3.5 me-1 rtl:rotate-180" /> Back to Locations

// Line 165:
className="absolute end-2.5 top-2.5 flex items-center gap-1 text-[10px] font-mono font-medium text-slate-500"

// Line 262:
className="absolute end-6 top-2.5 flex items-center gap-1 text-[10px] font-mono font-medium text-slate-500"
```

#### Form Controls & Containers Refactoring
```tsx
<ContainerCard title="Facility Identification" className="p-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Input
      label="Location Code"
      required
      disabled={hasHeldStock}
      value={formData.code}
      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
      placeholder="e.g. LOC-CAI-NEW"
      error={errors.code}
      helperText={hasHeldStock ? "Location Code is permanently locked because this facility holds inventory." : undefined}
      endIcon={hasHeldStock ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : undefined}
      className="font-mono font-bold uppercase"
    />
    <Input
      label="Facility Name (EN)"
      required
      value={formData.nameEn}
      onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
      placeholder="e.g. Cairo Main Store"
      error={errors.nameEn}
    />
    <Input
      label="Facility Name (AR)"
      required
      dir="rtl"
      value={formData.nameAr}
      onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
      placeholder="مثال: مستودع القاهرة الرئيسي"
      error={errors.nameAr}
      className="font-arabic"
    />
  </div>
</ContainerCard>

<ContainerCard 
  title="Site, Type & Stock Condition (Rule 4)" 
  subtitle="Condition locks permanently once stock is held"
  className="p-6"
>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Select
      label="Site Location"
      required
      value={formData.site}
      onChange={val => setFormData({ ...formData, site: val || 'Cairo Site' })}
      data={SITES}
    />
    <Select
      label="Facility Type"
      required
      value={formData.locationType}
      onChange={val => setFormData({ ...formData, locationType: (val as LocationType) || 'Site Store' })}
      data={LOCATION_TYPES}
    />
    <Select
      label="Stock Condition Flag"
      required
      disabled={hasHeldStock}
      value={formData.stockCondition}
      onChange={val => setFormData({ ...formData, stockCondition: (val as StockCondition) || 'New' })}
      data={STOCK_CONDITIONS}
      helperText={hasHeldStock ? "Stock condition cannot be changed once stock is held." : undefined}
    />
  </div>

  <div className="pt-3 max-w-xs">
    <Input
      label={`Capacity Units ${formData.stockCondition === 'Scrap' ? '(Optional for Scrap)' : ''}`}
      type="number"
      min={0}
      required={formData.stockCondition !== 'Scrap'}
      value={formData.capacityUnits}
      onChange={e => handleCapacityChange(parseInt(e.target.value) || 0)}
      error={errors.capacity}
      endIcon={<span className="text-xs text-slate-400 font-mono">units</span>}
    />
    {capacityWarning && (
      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded text-amber-900 dark:text-amber-300 text-xs font-medium mt-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>{capacityWarning}</span>
      </div>
    )}
  </div>
</ContainerCard>

<ContainerCard
  title="Responsible Store Keeper(s) (BD-I462)"
  subtitle="Check Store Keepers who have operational authorization for this warehouse facility."
  className="p-6"
>
  {/* Keeper cards with dark mode tokens: dark:bg-[#121e32] dark:border-[#17263c] */}
</ContainerCard>
```

---

### Page 9: `src/pages/StoreKeeperMatrix.tsx`

#### Imports Update
```tsx
// ADD:
import { ContainerCard } from '../components/ui/ContainerCard';
import { StatusBadge } from '../components/ui/StatusBadge';
```

#### Directional Class Remediation
```tsx
// Line 59:
<Check className="w-4 h-4 me-1.5" /> Save Matrix Changes

// Table text direction:
// Replace <table className="w-full text-left text-xs border-collapse"> with:
<table className="w-full ltr:text-left rtl:text-right text-xs border-collapse">
```

#### Table & Status Refactoring
```tsx
<ContainerCard 
  title="Store Keeper Authorization Matrix" 
  subtitle="Keepers with 0 locations are immediately blocked from warehouse operations."
  noPadding
  className="overflow-hidden"
>
  <div className="overflow-x-auto">
    <table className="w-full ltr:text-left rtl:text-right text-xs border-collapse">
      <thead>
        <tr className="bg-[#F5F6FD] dark:bg-[#121e32] border-b border-[#E2E8F0] dark:border-[#17263c] text-slate-700 dark:text-slate-300 font-mono text-[11px] uppercase">
          <th className="py-3 px-4 w-64">Store Keeper</th>
          {activeLocations.map(loc => (
            <th key={loc.id} className="py-3 px-4 text-center">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">{loc.nameEn}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {loc.code} ({loc.stockCondition})
              </span>
            </th>
          ))}
          <th className="py-3 px-4 text-center w-36">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E2E8F0]/80 dark:divide-[#17263c]/80">
        {storeKeepers.map(keeper => {
          const assigned = matrixState[keeper.id] || [];
          const isBlocked = assigned.length === 0;

          return (
            <tr key={keeper.id} className="hover:bg-slate-50/80 dark:hover:bg-[#121e32]/60 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light flex items-center justify-center font-bold text-xs font-mono">
                    {keeper.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{keeper.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {keeper.employeeCode}</span>
                  </div>
                </div>
              </td>

              {activeLocations.map(loc => {
                const isChecked = assigned.includes(loc.id);
                return (
                  <td key={loc.id} className="py-3 px-4 text-center">
                    <label className="inline-flex items-center justify-center p-2 rounded hover:bg-slate-100 dark:hover:bg-[#17263c] cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(keeper.id, loc.id)}
                        className="rounded text-primary focus:ring-primary cursor-pointer w-4 h-4"
                      />
                    </label>
                  </td>
                );
              })}

              <td className="py-3 px-4 text-center">
                {isBlocked ? (
                  <StatusBadge status="danger" label="Blocked (0 Locs)" />
                ) : (
                  <StatusBadge 
                    status="success" 
                    label={`${assigned.length} ${assigned.length === 1 ? 'Location' : 'Locations'}`} 
                  />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</ContainerCard>
```

---

## 7. Summary for Worker Subagent

The worker subagent can follow this plan file-by-file:
1. Edit `src/pages/Catalog.tsx` according to recipe in Section 6.
2. Edit `src/pages/CatalogForm.tsx` according to recipe in Section 6.
3. Edit `src/pages/Attributes.tsx` according to recipe in Section 6.
4. Edit `src/pages/AttributeForm.tsx` according to recipe in Section 6.
5. Edit `src/pages/ItemGroups.tsx` according to recipe in Section 6.
6. Edit `src/pages/ItemGroupForm.tsx` according to recipe in Section 6.
7. Edit `src/pages/Locations.tsx` according to recipe in Section 6.
8. Edit `src/pages/LocationForm.tsx` according to recipe in Section 6.
9. Edit `src/pages/StoreKeeperMatrix.tsx` according to recipe in Section 6.
10. Execute `npm run lint` and `npm run build` to verify clean builds.
11. Execute `npm run test:server` and `npm run test:e2e` to verify zero regression.
