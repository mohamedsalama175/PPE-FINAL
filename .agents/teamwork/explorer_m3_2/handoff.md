# Refactoring Specification & Handoff Report: Stock Operations, Kits, Issuance & Tracking Views (Milestone 3 - Scope 2)

**Author:** Explorer Subagent `explorer_m3_2`  
**Date:** 2026-11-11  
**Target Milestone:** Milestone 3 (Scope 2)  
**Status:** READY FOR WORKER IMPLEMENTATION  

---

## 1. Observation

A systematic codebase inspection of the 16 views and forms comprising **Stock Operations, Kits, Issuance & Tracking Views** was performed. The following exact code locations, styling issues, and API dependencies were observed:

### 1.1 Native Browser Dialogs (`window.prompt`, `window.alert`, `window.confirm`)
- **`src/pages/Scrap.tsx:27`**:
  ```typescript
  const reason = window.prompt("Please enter the reason for reversal:");
  ```
  Uses native `window.prompt` blocking execution and violating the design system feedback specification.
- **`src/pages/Kits.tsx:69`**:
  ```typescript
  alert('This is the sole active kit for this Job Position and had issuances within the last 90 days. Only an Admin can override this restriction.');
  ```
- **`src/pages/Kits.tsx:89`**:
  ```typescript
  alert('Cannot trash sole active kit with recent issuances. Only an Admin can override.');
  ```
- **`src/pages/KitForm.tsx:121`**:
  ```typescript
  alert('Cannot change job position on sole active kit with recent issuances. Only an Admin can override.');
  ```
- **`src/pages/StockAdjustments.tsx:1300-1316`**:
  Approval review actions (`handleReviewAction(a.id, 'approved')` and `handleReviewAction(a.id, 'rejected')`) execute immediately without user confirmation dialogs.

### 1.2 Legacy Palette Classes & Styling Violations
- **`src/pages/Scrap.tsx:45`**:
  ```tsx
  <div className="flex-1 overflow-hidden bg-surface border border-border rounded-sm">
  ```
  Uses deprecated tokens: `bg-surface`, `border-border`, `rounded-sm`.
- **`src/pages/Scrap.tsx:65, 68`**:
  ```tsx
  <span className="text-body italic text-xs">Reversed</span>
  ...
  <span className="text-safety-red text-xs font-medium">Scrapped</span>
  ```
  Uses deprecated utility classes `text-body` and `text-safety-red`.
- **`src/pages/Stock.tsx:196-201, 264-278`**:
  Raw inline spans with hardcoded color classes:
  ```tsx
  r.locationCondition === 'New' ? 'text-emerald-800 bg-emerald-50' : r.locationCondition === 'Used' ? 'text-blue-800 bg-blue-50' : 'text-red-800 bg-red-50'
  ...
  r.batch.status === 'Quarantined' ? 'bg-amber-100 text-amber-900 border border-amber-200' : ...
  ```
- **`src/pages/Transfers.tsx:66-75`**:
  Raw status spans with hardcoded colors (`bg-blue-100 text-blue-800`, `bg-amber-100 text-amber-800`) instead of `StatusBadge`.
- **`src/pages/ReplacementsDue.tsx:155-175`**:
  Raw custom stat cards with hardcoded `bg-amber-50 border-amber-200` and `bg-red-50 border-red-200` instead of shared `KpiCard`.

### 1.3 Custom Modal Overlays instead of Unified `Modal` Component
- **`src/pages/Stock.tsx:307-357`**:
  Raw `fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60` modal for quarantine release with unstyled `<textarea>`.
- **`src/pages/StockAdjustments.tsx:1335-1356`**:
  Raw `fixed inset-0 z-50 flex items-center justify-center bg-black/50` modal for closing opening balance.
- **`src/pages/Issuances.tsx:438-558`**:
  Raw `fixed inset-0 z-50 flex items-center justify-center bg-black/50` modal for PPE returns.
- **`src/pages/OpenLoans.tsx:476-573`**:
  Raw `fixed inset-0 z-50 flex items-center justify-center bg-black/50` modal for loan item returns.

### 1.4 Unstyled Native Form Elements
- **`src/pages/TransferForm.tsx:148-256`**:
  Native `<select className="w-full border border-slate-300 rounded px-3 py-2 text-xs ...">` and native `<input type="number" ...>` instead of shared `Select` and `Input`.
- **`src/pages/KitForm.tsx:165-272`**:
  Native `<input type="text">`, `<select>`, and `<input type="number">` instead of shared `Input` and `Select`.
- **`src/pages/StockAdjustments.tsx:594-599, 650-662`**:
  `<Input type="date">` and unstyled `<textarea>` instead of `DatePicker` and `Textarea`.
- **`src/pages/IssueLoanForm.tsx:254-273`**:
  `<Input type="date">` instead of `DatePicker`.

### 1.5 Directional (LTR) Utility Classes Violating RTL-Friendliness
- `mr-1.5`, `mr-1`, `ml-1.5`, `ml-2`: Found in `Stock.tsx`, `StockAdjustments.tsx`, `Transfers.tsx`, `TransferForm.tsx`, `Kits.tsx`, `KitForm.tsx`, `Issuances.tsx`, `OpenLoans.tsx`, `ReplacementsDue.tsx`.
- `text-left`: Hardcoded on nested table tags in `StockAdjustments.tsx:1025`, `IssueKitForm.tsx:288`, `IssueLoanForm.tsx:294`.
- `pl-4`: Found on `StockAdjustments.tsx:681`.

### 1.6 File Architecture & Relationships
- `src/pages/StockAdjustmentForm.tsx`: Contains `<Navigate to="/stock/adjustments?tab=in" replace />;`
- `src/pages/OpeningBalances.tsx`: Contains `<Navigate to="/stock/adjustments?tab=ob" replace />;`
- `src/pages/OpeningBalanceForm.tsx`: Contains `<Navigate to="/stock/adjustments?tab=ob" replace />;`
- `src/pages/StockAdjustments.tsx`: Contains the full implementation of Stock IN, Stock OUT, Opening Balance grid, and Approvals Queue.

---

## 2. Logic Chain

1. **Dialog Modernization**:
   - `Scrap.tsx:27` relies on `window.prompt` to capture scrap reversal reasons. In `src/lib/swal.ts`, `showDeleteReason(title, placeholder, validationMessage)` is specifically designed to prompt for a mandatory justification string with length validation. Replacing `window.prompt` with `await showDeleteReason(...)` cleanly fulfills the requirement with zero behavioral breakage.
   - `Kits.tsx` and `KitForm.tsx` use `alert()` for sole active kit protections. Replacing with `await showInfo(...)` provides clean modal notification matching the design system.
   - `StockAdjustments.tsx` approval review buttons directly apply or reject without confirmation. Using `await showConfirm(...)` ensures accidental review clicks are prevented.

2. **Unified Component Mapping**:
   - Shared UI components exist in `src/components/ui/` (`Button`, `Input`, `Textarea`, `Select`, `DatePicker`, `ContainerCard`, `KpiCard`, `StatusBadge`, `Modal`, `SlideOverDrawer`, `TableActionsButtons`, `EmptyState`, `CustomTable`/`DataTable`, `ToggleSwitch`).
   - Wrapping tables in `ContainerCard` with `noPadding` creates consistent rounded corners (`rounded-xl`), hairline slate borders (`border-[#E2E8F0] dark:border-[#17263c]`), and background cards (`bg-white dark:bg-[#0e1726]`).
   - Replacing custom `fixed inset-0` modals in `Stock.tsx`, `Issuances.tsx`, `OpenLoans.tsx` with `<Modal opened={...} onClose={...} title={...}>` eliminates duplicated modal shell code, ensures ESC key handling, backdrop blur, dark theme parity, and Mantine accessibility.

3. **Input and Select Modernization**:
   - In `TransferForm.tsx` and `KitForm.tsx`, replacing raw `<select>` and `<input>` with `src/components/ui/Select` and `src/components/ui/Input` guarantees uniform focus rings (`focus:border-primary`), labels, error text support, and dark mode classes.
   - In `StockAdjustments.tsx` and `IssueLoanForm.tsx`, converting `<Input type="date">` to `DatePicker` provides bilingual Flatpickr calendar adornments.

4. **Localization & RTL-Friendliness**:
   - Replacing all `mr-*` / `ml-*` with logical margin `me-*` / `ms-*` ensures icons and badges correctly position themselves in both English (`dir="ltr"`) and Arabic (`dir="rtl"`).
   - Changing `text-left` to `text-start` and `text-right` to `text-end` ensures table columns align logically.

5. **Test Preservation & Backward Compatibility**:
   - Backend E2E suites (`tests/e2e/runner.ts`, `server/test-comprehensive.ts`) test HTTP API endpoints directly.
   - Preserving all form submit logic, payload keys, store method signatures (`transferStock`, `saveKit`, `trashKit`, `issueSinglePPE`, `issueKitPPE`, `issueVisitorLoan`, `returnPPE`, `returnLoanLine`, `reverseScrap`, `reviewAdjustment`, `releaseQuarantine`), and digital signatures guarantees zero test regressions.

---

## 3. Caveats

1. **Digital Signatures Canvas**: `SignaturePad` operates via HTML5 canvas and high-DPI scaling. It must remain inside the modal and form structures with explicit width/height constraints and its callback signatures (`onSave={(sig) => ...}`) intact.
2. **Tab State in StockAdjustments**: `StockAdjustments.tsx` manages active tabs via `searchParams` (`?tab=in`, `?tab=out`, `?tab=ob`, `?tab=queue`). Sub-redirects (`StockAdjustmentForm.tsx`, `OpeningBalances.tsx`, `OpeningBalanceForm.tsx`) rely on this exact URL schema and must remain untouched.
3. **Dual Signature Pad Layout**: In `Issuances.tsx` (Return Modal) and `OpenLoans.tsx` (Return Line Modal), the modal size should be `lg` or `xl` (`size="lg"`) so the two side-by-side signature pads render without cramping.

---

## 4. Conclusion

All 16 files in Scope 2 are fully audited. The refactoring recipe below outlines exact modifications for each file to achieve 100% compliance with `DESIGN_SYSTEM.md`, eliminating all legacy colors, native dialogs, and unstyled inputs while guaranteeing test compatibility.

---

## 5. Verification Method

To verify the refactoring independently:
1. **Client Build Compilation**:
   ```bash
   npm run build
   ```
   Must complete with code 0 and zero TypeScript errors.
2. **Server Build Compilation**:
   ```bash
   npm run build:server
   ```
   Must complete with code 0.
3. **Automated Server Tests**:
   ```bash
   npm run test:server
   ```
   Must complete with all tests passing.
4. **Automated E2E Suite**:
   ```bash
   npm run test:e2e
   ```
   Must complete with all 250+ tests passing.
5. **Code Inspection**:
   - Search for `window.prompt` or `window.alert` in `src/pages/` — must return 0 results in Scope 2 files.
   - Search for `bg-surface`, `text-safety-red`, `border-border` — must return 0 results in Scope 2 files.

---

# Detailed Refactoring Recipes for Worker Implementation

### Recipe 1: `src/pages/Stock.tsx`
- **Imports**: Add `ContainerCard`, `Modal`, `Textarea`, `StatusBadge`, `SemanticStatus`.
- **Table Card**: Wrap `<DataTable>` inside `<ContainerCard noPadding>`.
- **Restricted Access Card** (lines 120-128): Replace with:
  ```tsx
  <ContainerCard className="p-8 text-center border-danger/30 bg-danger/5 dark:bg-danger/10">
    <AlertOctagon className="w-12 h-12 text-danger mx-auto mb-3" />
    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Access Restricted (0 Assigned Locations)</h2>
    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-2">
      You are signed in as an Unassigned Store Keeper. In accordance with rule BD-I462, store keepers with zero assigned warehouses are blocked from stock management and inventory screens.
    </p>
  </ContainerCard>
  ```
- **Filter Controls**: Replace raw checkbox with styled toggle or checkbox label.
- **Table Badges**:
  - Pool condition:
    ```tsx
    <StatusBadge 
      status={r.locationCondition === 'New' ? 'success' : r.locationCondition === 'Used' ? 'info' : 'danger'} 
      label={`${r.locationCondition} Pool`} 
      icon={false} 
      size="sm" 
    />
    ```
  - Batch Status:
    ```tsx
    <StatusBadge status={r.batch.status as SemanticStatus} size="sm" />
    ```
  - Low Stock:
    ```tsx
    {r.isLow && <StatusBadge status="warning" label="Low Stock" size="sm" />}
    ```
- **Quarantine Release Modal**: Replace custom `fixed inset-0` modal (lines 307-357) with:
  ```tsx
  <Modal
    opened={quarantineModal.isOpen}
    onClose={() => setQuarantineModal({ isOpen: false, batch: null, reason: '' })}
    title="Release Batch from Quarantine (NEW-03)"
    icon={<RotateCcw className="w-5 h-5 text-warning" />}
    size="md"
    footer={
      <div className="flex items-center justify-end gap-2">
        <Button 
          variant="outline" 
          color="secondary"
          size="sm" 
          onClick={() => setQuarantineModal({ isOpen: false, batch: null, reason: '' })}
        >
          Cancel
        </Button>
        <Button size="sm" color="primary" onClick={handleConfirmRelease}>
          Confirm Release
        </Button>
      </div>
    }
  >
    {quarantineModal.batch && (
      <div className="space-y-4">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          You are releasing <strong>{quarantineModal.batch.quarantinedQty} units</strong> of Batch 
          <strong> {quarantineModal.batch.batchNumber}</strong> back into active available stock.
        </p>

        <Textarea
          label="Release Justification Reason (Min 20 characters)"
          required
          rows={3}
          value={quarantineModal.reason}
          onChange={e => setQuarantineModal(prev => ({ ...prev, reason: e.target.value, error: undefined }))}
          placeholder="State technical inspection results or clearance justifying release..."
          error={quarantineModal.error}
        />
      </div>
    )}
  </Modal>
  ```

---

### Recipe 2: `src/pages/StockAdjustments.tsx`
- **Imports**: Add `ContainerCard`, `Modal`, `Textarea`, `DatePicker`, `useSwal`.
- **Confirmation for Approvals** (line 364):
  ```typescript
  const { showConfirm, showDeleteReason } = useSwal();

  const handleReviewAction = async (adjId: string, action: 'approved' | 'rejected') => {
    let reason: string | null = null;
    if (action === 'rejected') {
      reason = await showDeleteReason(
        'Reject Stock Adjustment',
        'Please enter rejection justification (mandatory)...'
      );
      if (!reason) return;
    } else {
      const confirmed = await showConfirm(
        'Approve Stock Adjustment',
        'Are you sure you want to approve and apply this adjustment to stock balances?',
        'Approve'
      );
      if (!confirmed) return;
    }

    const res = reviewAdjustment(adjId, action, currentUser.id);
    if (!res.success) {
      addToast(res.error || 'Review failed.', 'error');
    } else {
      addToast(`Adjustment ${action === 'approved' ? 'approved and applied' : 'rejected'}.`, 'success');
    }
  };
  ```
- **Cards Replacement**: Wrap all Tab forms (`Tab 1: Stock IN`, `Tab 2: Stock OUT`, `Tab 3: Opening Balance`) and Info boxes in `ContainerCard` instead of raw `<div className="bg-white rounded-lg border border-slate-200 ...">`.
- **Textarea Replacement**: Replace native `<textarea>` in forms with `Textarea` from `src/components/ui/Textarea`.
- **Date Inputs**: In Tab 1 (line 595), replace `<Input type="date" value={inExpiryDate} .../>` with:
  ```tsx
  <DatePicker
    label="Manufacturer Expiry Date (Optional)"
    value={inExpiryDate}
    onChange={(_dates, dateStr) => setInExpiryDate(dateStr)}
    minDate={new Date()}
  />
  ```
- **Close Opening Balance Confirmation**:
  Replace raw modal (lines 1335-1356) with:
  ```tsx
  const handlePromptCloseOpeningBalance = async () => {
    const confirmed = await showConfirm(
      'Close Opening Balance?',
      `Are you sure you want to permanently close Opening Balance for "${selectedObLoc?.nameEn}"? Once closed, no further opening balance entries can be posted.`,
      'Lock Opening Balance',
      true
    );
    if (confirmed) {
      handleCloseOpeningBalance();
    }
  };
  ```
- **Opening Balance Grid Table (Tab 3)**:
  Replace `text-left` with `text-start`, add dark mode borders: `border-[#E2E8F0] dark:border-[#17263c]`, wrap in `ContainerCard noPadding`.

---

### Recipe 3: `src/pages/StockAdjustmentForm.tsx`, `OpeningBalances.tsx`, `OpeningBalanceForm.tsx`
- Ensure strict TypeScript typing and keep redirect pathways:
  ```tsx
  import * as React from 'react';
  import { Navigate } from 'react-router-dom';

  export default function StockAdjustmentForm() {
    return <Navigate to="/stock/adjustments?tab=in" replace />;
  }
  ```

---

### Recipe 4: `src/pages/Transfers.tsx`
- Wrap `<DataTable>` inside `<ContainerCard noPadding>`.
- Replace raw spans for Reused pool and Overcapacity with `StatusBadge`:
  ```tsx
  {log.afterValues?.newCondition === 'Reused' && (
    <StatusBadge status="info" label="Reused Pool" size="sm" icon={false} />
  )}
  {log.afterValues?.overcapacityWarning && (
    <StatusBadge status="warning" label="Overcapacity" size="sm" />
  )}
  ```
- Replace `mr-1.5` with `me-1.5`.

---

### Recipe 5: `src/pages/TransferForm.tsx`
- Wrap the form in `ContainerCard` with title and subtitle.
- Replace all raw native `<select>` tags (lines 148, 167, 187, 211) with shared `Select` component.
- Replace raw `<input type="number">` (line 250) with `Input`.
- Replace `mr-1` with `me-1`.
- Clean semantic alert styling for condition routing violations using design system tokens.

---

### Recipe 6: `src/pages/Kits.tsx`
- Replace native `alert()` calls at lines 69 and 89:
  ```typescript
  import { useSwal } from '../lib/useSwal';

  // inside component:
  const { showInfo } = useSwal();

  const handleToggleActive = async (kit: Kit) => {
    if (kit.active && isSoleActiveKitWithRecentIssuances(kit)) {
      if (currentUser.role !== 'Admin') {
        await showInfo(
          'Restricted Action',
          'This is the sole active kit for this Job Position and had issuances within the last 90 days. Only an Admin can override this restriction.'
        );
        return;
      }
      ...
    }
    saveKit({ ...kit, active: !kit.active });
  };

  const handleTrash = async (kit: Kit) => {
    if (isSoleActiveKitWithRecentIssuances(kit)) {
      if (currentUser.role !== 'Admin') {
        await showInfo(
          'Restricted Action',
          'Cannot trash sole active kit with recent issuances. Only an Admin can override.'
        );
        return;
      }
      ...
    }
    ...
  };
  ```
- **Table Actions**: Replace raw `<button>` actions with `TableActionsButtons`:
  ```tsx
  <TableActionsButtons
    onView={() => setSelectedKitForDetails(item)}
    onEdit={currentUser.role === 'Admin' ? () => navigate(`/kits/${item.id}/edit`) : undefined}
    onDelete={currentUser.role === 'Admin' ? () => handleTrash(item) : undefined}
    viewTooltip="View Kit Details"
    editTooltip="Edit Kit"
    deleteTooltip="Move to Trash"
    size="sm"
  />
  ```
- Wrap `<DataTable>` inside `<ContainerCard noPadding>`.

---

### Recipe 7: `src/pages/KitForm.tsx`
- Replace native `alert()` at line 121:
  ```typescript
  if (existingKit && wasSoleActive && formData.jobPositionId !== existingKit.jobPositionId) {
    if (currentUser.role !== 'Admin') {
      await showInfo(
        'Restricted Action',
        'Cannot change job position on sole active kit with recent issuances. Only an Admin can override.'
      );
      return;
    }
    ...
  }
  ```
- Replace unstyled inputs:
  - Line 165: `<Input label="Kit Name (English)" required value={formData.nameEn} onChange={e => setFormData({ ...formData, nameEn: e.target.value })} error={errors.nameEn} />`
  - Line 180: `<Input label="Kit Name (Arabic)" required dir="rtl" value={formData.nameAr} onChange={e => setFormData({ ...formData, nameAr: e.target.value })} error={errors.nameAr} />`
  - Line 196: `<Select label="Job Position" required value={formData.jobPositionId} onChange={val => setFormData({ ...formData, jobPositionId: val || '' })} ... />`
  - Lines 243, 266: Replace with `Select` and `Input`.
- Wrap sections in `ContainerCard`.
- Replace `mr-1` -> `me-1`, `ml-2` -> `ms-2`.

---

### Recipe 8: `src/pages/Issuances.tsx`
- Wrap `<DataTable>` inside `<ContainerCard noPadding>`.
- Replace Return Modal (lines 438-558) with shared `<Modal opened={returnModal.isOpen} onClose={...} title="Return PPE Item (BD-I472)" size="lg">`:
  ```tsx
  <Modal
    opened={returnModal.isOpen && !!returnModal.issuance}
    onClose={() => setReturnModal(prev => ({ ...prev, isOpen: false, issuance: null }))}
    title={`Return PPE Item — Ref: ${returnModal.issuance?.reference}`}
    icon={<CornerDownLeft className="w-5 h-5 text-primary" />}
    size="lg"
    footer={
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          color="secondary"
          onClick={() => setReturnModal(prev => ({ ...prev, isOpen: false, issuance: null }))}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          onClick={handleConfirmReturn}
          loading={returnModal.submitting}
        >
          Complete Return
        </Button>
      </div>
    }
  >
    {/* Return form body with Quantity, Condition Select, Physical Receipt checkbox, and Dual SignaturePad */}
  </Modal>
  ```
- Replace `mr-1.5`, `ml-1.5`, `mr-1` with `me-1.5`, `ms-1.5`, `me-1`.

---

### Recipe 9: `src/pages/IssuanceForm.tsx`
- Wrap main form inside `<ContainerCard title="Issue PPE (Single Item)" subtitle="...">`.
- Replace buttons with `<Button variant="outline" color="secondary">` and `<Button variant="solid" color="primary">`.
- Replace hardcoded color banners with semantic classes (`bg-danger/10 border-danger/30 text-danger dark:text-danger-light`, `bg-warning/10 border-warning/30 text-warning-dark`).
- Keep `SignaturePad` dual canvas signatures with responsive grid layout.

---

### Recipe 10: `src/pages/IssueKitForm.tsx`
- Wrap form inside `<ContainerCard title="Issue Job-Specific Kit" subtitle="...">`.
- Replace line items table header `text-left` with `text-start`.
- Replace out-of-stock and in-stock badges with `StatusBadge` or semantic badge classes.
- Wrap completion summary screen inside `ContainerCard`.

---

### Recipe 11: `src/pages/IssueLoanForm.tsx`
- Wrap form inside `<ContainerCard title="Issue PPE as a Loan to Visitor / Contractor" subtitle="...">`.
- Replace `<Input type="date" value={issueDate}>` and `<Input type="date" value={expectedReturnDate}>` with `DatePicker`.
- Replace table header `text-left` with `text-start`.
- Replace `mr-1` with `me-1`.
- Keep `SignaturePad` dual canvas signatures.

---

### Recipe 12: `src/pages/OpenLoans.tsx`
- Wrap `<DataTable>` inside `<ContainerCard noPadding>`.
- Replace Return Line Modal (lines 476-573) with shared `<Modal opened={returnModal.isOpen && !!returnModal.line} onClose={...} title={`Return Loaned Item — ${returnModal.loan?.loanNumber}`} size="lg">`.
- Replace overdue badge with `<StatusBadge status="danger" label={`${l.daysLate} day(s) late`} size="sm" />`.
- Replace `mr-1.5`, `mr-1` with `me-1.5`, `me-1`.

---

### Recipe 13: `src/pages/ReplacementsDue.tsx`
- Replace raw custom stat blocks (lines 155-175) with shared `KpiCard`:
  ```tsx
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <KpiCard
      title="Upcoming Replacements (Within Site Lead Time)"
      value={upcomingCount}
      color="warning"
      icon={<Clock className="w-6 h-6 text-warning" />}
    />
    <KpiCard
      title="Overdue Replacements (Past Replacement Date)"
      value={overdueCount}
      color="danger"
      icon={<AlertTriangle className="w-6 h-6 text-danger" />}
    />
  </div>
  ```
- Wrap `<DataTable>` inside `<ContainerCard noPadding>`.
- Replace `mr-1.5`, `mr-1` with `me-1.5`, `me-1`.

---

### Recipe 14: `src/pages/Scrap.tsx`
- Replace `window.prompt` with `showDeleteReason`:
  ```typescript
  import { useSwal } from '../lib/useSwal';

  // inside component:
  const { showDeleteReason } = useSwal();

  const handleReverse = async (id: string, createdAt: string) => {
    const daysSinceScrap = differenceInDays(new Date(), new Date(createdAt));
    if (daysSinceScrap > REVERSAL_WINDOW_DAYS) {
      addToast(`Cannot reverse scrap entries older than ${REVERSAL_WINDOW_DAYS} days.`, 'error');
      return;
    }

    const reason = await showDeleteReason(
      "Reverse Scrap Entry",
      "Please enter the operational reason for reversal (minimum 5 characters)..."
    );
    if (!reason) {
      addToast('A reason is required to reverse a scrap entry.', 'error');
      return;
    }

    reverseScrap(id, reason);
    addToast('Scrap entry reversed, stock restored.', 'success');
  };
  ```
- Replace legacy styling:
  - Replace `<div className="flex-1 overflow-hidden bg-surface border border-border rounded-sm">` with `<ContainerCard noPadding className="flex-1 overflow-hidden">`.
  - In columns render status:
    ```tsx
    { key: 'status', header: 'Status', render: (s) => (
       s.reversed ? (
         <div className="flex flex-col gap-0.5">
           <StatusBadge status="neutral" label="Reversed" size="sm" icon={false} />
           {s.reversalReason && (
             <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]" title={s.reversalReason}>
               {s.reversalReason}
             </span>
           )}
         </div>
       ) : (
         <StatusBadge status="danger" label="Scrapped" size="sm" />
       )
    )}
    ```
