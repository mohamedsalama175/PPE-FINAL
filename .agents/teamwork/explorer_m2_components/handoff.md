# Milestone 2: Shared UI Components Architecture & Implementation Specification

**Document ID:** HANDOFF-M2-COMPONENTS-001  
**Author:** M2 Components Explorer (`explorer_m2_components`)  
**Target Milestone:** Milestone 2: Shared UI Components and Application Layout Shell  
**Date:** 2026-11-11T08:55:00Z  
**Status:** COMPLETE / READY FOR IMPLEMENTATION  

---

## 1. Observation

Direct observations extracted verbatim from authoritative project files, configurations, and existing implementations:

1. **Design Tokens & Baseline Foundations (`DESIGN_SYSTEM.md`, `src/index.css`):**
   - Deep navy corporate primary `#212B59` (`--color-primary`), secondary purple `#805dca` (`--color-secondary`), canvas `#F5F6FD` (dark `#060818`), panel surface `#FFFFFF` (dark `#0e1726`), hairline slate borders `#E2E8F0` (dark `#17263c`), and table row divider `#e0e6ed`/40 (dark `#191e3a`).
   - Font scale is anchored on Google's **Almarai** font family (`'Almarai', sans-serif`).
   - Border radii tokens: `rounded-lg` (8px) for buttons, `rounded-xl` (12px) for cards, container panels, inputs, and table headers.

2. **Required Packages & Ecosystem (`package.json`, `src/main.tsx`):**
   - `@mantine/core` (`^8.2.4`), `@mantine/hooks`, `@mantine/dates`, `dayjs` are installed.
   - `@tippyjs/react` (`^4.2.6`) and `tippy.js` (`^6.3.7`) are installed and imported in `src/main.tsx` (`import 'tippy.js/dist/tippy.css'`).
   - `sweetalert2` (`^11.26.25`) is installed.
   - `lucide-react` (`^0.546.0`) is installed.

3. **Existing UI Components Audit (`src/components/ui/`):**
   - `src/components/ui/Button.tsx`: Currently uses legacy non-standard tokens (`bg-accent`, `bg-surface`, `bg-safety-red`), lacks `solid`, `outline`, `text`, `icon` variants, lacks `loading` state with Lucide spinner, lacks `active:scale-[0.98]`, lacks Tippy tooltip integration, and has 0 dark mode styles.
   - `src/components/ui/DataTable.tsx`: Hardcodes `text-left` (which breaks Arabic RTL), hardcodes `#F1F1EF` thead, lacks sort indicators (`ArrowUpDown`, `ArrowUp`, `ArrowDown`), lacks row selection checkboxes with indeterminate state, lacks pagination controls (circular 36x36px page buttons / page size selector), and lacks action buttons with tooltips.
   - `src/components/ui/StatusBadge.tsx`: Uses hardcoded `mr-1` which disrupts RTL layouts, lacks domain-specific badges (risk categories, stock conditions, inspection/approval workflows), and lacks dark theme tokens.
   - `src/components/ui/EmptyState.tsx`: Basic dashed box lacking HSE design system styling (rounded-2xl badge with ring, centered title, description, and action button).
   - Missing Components: `TableActionsButtons.tsx`, `ContainerCard.tsx`, `KpiCard.tsx`, and `CustomTable.tsx` do not exist in `src/components/ui/`.

4. **Existing Page Usage Signatures (`src/pages/`):**
   - `Button`: 16+ pages invoke `<Button variant="primary" | "secondary" | "danger" | "ghost" | "outline" size="sm" | "md" | "lg" icon={...}>`.
   - `DataTable`: 16+ pages invoke `<DataTable data={...} columns={...} keyExtractor={(item) => item.id} emptyState={...} onRowClick={...}>`.
   - `StatusBadge`: Used in `Employees.tsx`, `EmployeeDetail.tsx`, `Issuances.tsx`, `MyPPE.tsx`, `OpenLoans.tsx`, `ReplacementsDue.tsx`, `StockAdjustments.tsx` with `status="success" | "error" | "warning" | "info" | "neutral"` and `label={...}`.
   - `Catalog.tsx`, `Stock.tsx`: Use inline risk badges (`Category I`, `Category II`, `Category III`) and stock condition pills (`New`, `Used`, `Scrap`, `Quarantine`).

5. **Build and Type Validation Baseline:**
   - Both `npm run build` and `npm run lint` (`tsc --noEmit`) complete with exit code 0.

---

## 2. Logic Chain

1. **Premise 1 (Design Contract & Specifications):**
   `ORIGINAL_REQUEST.md` (R2) and `PROJECT.md` mandate that shared UI components in `src/components/ui/` must conform to `DESIGN_SYSTEM.md` specifications for styling, states, dark mode, and RTL readiness.

2. **Premise 2 (Backward Compatibility Requirement):**
   Existing pages in `src/pages/` must NOT break during Milestone 2. Components must accept both legacy props (e.g. `variant="primary"`, `keyExtractor`, `btnCorner`, `label`) and new design system props (`variant="solid" | "outline" | "text" | "icon"`, `color="primary" | "secondary" | ...`, `selectable`, `pagination`, `actions`).

3. **Premise 3 (RTL & Directional Symmetry):**
   Components must eliminate hardcoded physical offsets (`mr-2`, `text-left`, `right-0`) and replace them with directional utilities (`ltr:mr-2 rtl:ml-2`, `ltr:text-left rtl:text-right`, `ltr:right-0 rtl:left-0`). Chevron icons in pagination must rotate 180 degrees in RTL (`rtl:rotate-180`).

4. **Premise 4 (Micro-Interactions & State Parity):**
   Buttons require `active:scale-[0.98]`, focus rings with dark-mode offsets, disabled styling (`opacity-60 cursor-not-allowed`), and a spinning `Loader2` state. Icon buttons must wrap with `@tippyjs/react` tooltips.

5. **Premise 5 (Data Table Completeness):**
   The Data Table must provide a complete data-grid experience: sortable columns with dynamic indicators, multi-row selection with indeterminate master checkbox, hover and active row highlights, empty state fallback, and circular 36x36px pagination buttons with record counts and page-size selector. `CustomTable.tsx` must be provided alongside `DataTable.tsx` as a drop-in alias.

6. **Premise 6 (Domain Badges & Cards):**
   `ContainerCard.tsx` standardizes content containers with hairline borders and dark mode surfaces. `KpiCard.tsx` standardizes metrics with 48x48px icon badges, trend indicators, and chart slots. `StatusBadge.tsx` handles generic semantics plus automatic categorization for PPE Inventory, Risk Levels, and Conditions.

---

## 3. Caveats

1. **Recharts vs ApexCharts in KpiCard Slot:**
   `KpiCard.tsx` provides a generic `chart?: React.ReactNode` slot. While `DESIGN_SYSTEM.md` specifies ApexCharts for business intelligence dashboards, existing views currently use Recharts. The `chart` slot is framework-agnostic and accommodates either library without coupling.
2. **Table Sorting & Pagination Execution:**
   `DataTable.tsx` supports both uncontrolled sorting (client-side data sorting if not handled by parent) and controlled sorting/pagination via `sortColumn`, `sortDirection`, `onSortChange`, and `pagination` props. This prevents conflicts when a view manages server-side pagination.
3. **Mantine Form Components Scope:**
   Mantine form inputs (`Input.tsx`, `Textarea.tsx`, `Select.tsx`, `CheckboxCard.tsx`, `ToggleSwitch.tsx`, `DatePicker.tsx`, `FileUpload.tsx`) belong to FE-CMP-02..04. This specification focuses on the requested components: Button, Data Tables, Cards, and Badges.

---

## 4. Conclusion & Component Implementation Blueprints

Below are the complete, ready-to-implement TypeScript code blocks. The implementer agent can write these directly into `src/components/ui/`.

---

### Blueprint 1: `src/components/ui/Button.tsx`

```typescript
import * as React from "react";
import { Loader2 } from "lucide-react";
import Tippy from "@tippyjs/react";
import { cn } from "../../lib/utils";

export type ButtonVariant = 
  | 'solid' 
  | 'outline' 
  | 'text' 
  | 'icon' 
  // Backward compatibility legacy variants
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'ghost' 
  | 'destructive';

export type ButtonColor = 
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'success' 
  | 'warning' 
  | 'info' 
  | 'dark' 
  | 'white';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  tooltip?: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'solid',
      color,
      size = 'md',
      loading = false,
      loadingText,
      icon,
      iconPosition = 'start',
      tooltip,
      tooltipPlacement = 'top',
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // 1. Resolve variant and color with backward compatibility
    let resolvedVariant: 'solid' | 'outline' | 'text' | 'icon' = 'solid';
    let resolvedColor: ButtonColor = color || 'primary';

    if (variant === 'primary') {
      resolvedVariant = 'solid';
      resolvedColor = color || 'primary';
    } else if (variant === 'secondary') {
      resolvedVariant = 'outline';
      resolvedColor = color || 'secondary';
    } else if (variant === 'danger' || variant === 'destructive') {
      resolvedVariant = 'solid';
      resolvedColor = color || 'danger';
    } else if (variant === 'ghost') {
      resolvedVariant = 'text';
      resolvedColor = color || 'dark';
    } else {
      resolvedVariant = variant as 'solid' | 'outline' | 'text' | 'icon';
      resolvedColor = color || (resolvedVariant === 'icon' ? 'dark' : 'primary');
    }

    // 2. Base Styles
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none whitespace-nowrap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#060818] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100";

    // 3. Sizing Styles
    const sizeClasses: Record<ButtonSize, string> = {
      sm: resolvedVariant === 'icon' ? "h-8 w-8 text-xs p-0 shrink-0" : "h-8 px-3 text-xs gap-1.5",
      md: resolvedVariant === 'icon' ? "h-10 w-10 text-sm p-0 shrink-0" : "h-10 px-4 text-sm gap-2",
      lg: resolvedVariant === 'icon' ? "h-12 w-12 text-base p-0 shrink-0" : "h-12 px-6 text-base gap-2.5",
    };

    // 4. Variant & Color Matrix
    const colorStyles: Record<'solid' | 'outline' | 'text' | 'icon', Record<ButtonColor, string>> = {
      solid: {
        primary: "bg-primary text-white hover:bg-[#1a2247] shadow-sm focus-visible:ring-primary/40",
        secondary: "bg-secondary text-white hover:bg-[#6f4eb5] shadow-sm focus-visible:ring-secondary/40",
        danger: "bg-danger text-white hover:bg-[#d63d46] shadow-sm focus-visible:ring-danger/40",
        success: "bg-success text-white hover:bg-[#00964b] shadow-sm focus-visible:ring-success/40",
        warning: "bg-warning text-white hover:bg-[#cf8f30] shadow-sm focus-visible:ring-warning/40",
        info: "bg-info text-white hover:bg-[#1984d8] shadow-sm focus-visible:ring-info/40",
        dark: "bg-dark text-white hover:bg-[#2c3049] shadow-sm focus-visible:ring-dark/40 dark:bg-[#1b2e4b] dark:hover:bg-[#203759]",
        white: "bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-slate-50 shadow-sm focus-visible:ring-slate-300 dark:bg-[#121e32] dark:text-white dark:border-[#17263c] dark:hover:bg-[#182740]",
      },
      outline: {
        primary: "border border-primary text-primary hover:bg-primary hover:text-white dark:border-[#4d6ecf] dark:text-[#738edc] dark:hover:bg-primary dark:hover:text-white focus-visible:ring-primary/40",
        secondary: "border border-secondary text-secondary hover:bg-secondary hover:text-white focus-visible:ring-secondary/40",
        danger: "border border-danger text-danger hover:bg-danger hover:text-white focus-visible:ring-danger/40",
        success: "border border-success text-success hover:bg-success hover:text-white focus-visible:ring-success/40",
        warning: "border border-warning text-warning hover:bg-warning hover:text-white focus-visible:ring-warning/40",
        info: "border border-info text-info hover:bg-info hover:text-white focus-visible:ring-info/40",
        dark: "border border-dark text-dark hover:bg-dark hover:text-white dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 focus-visible:ring-dark/40",
        white: "border border-white/60 text-white hover:bg-white hover:text-[#1E293B] focus-visible:ring-white/40",
      },
      text: {
        primary: "bg-transparent text-primary hover:bg-primary-light/50 dark:text-primary-light dark:hover:bg-primary/20 focus-visible:ring-primary/40",
        secondary: "bg-transparent text-secondary hover:bg-secondary-light/50 dark:hover:bg-secondary/20 focus-visible:ring-secondary/40",
        danger: "bg-transparent text-danger hover:bg-danger-light/50 dark:hover:bg-danger/20 focus-visible:ring-danger/40",
        success: "bg-transparent text-success hover:bg-success-light/50 dark:hover:bg-success/20 focus-visible:ring-success/40",
        warning: "bg-transparent text-warning hover:bg-warning-light/50 dark:hover:bg-warning/20 focus-visible:ring-warning/40",
        info: "bg-transparent text-info hover:bg-info-light/50 dark:hover:bg-info/20 focus-visible:ring-info/40",
        dark: "bg-transparent text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 dark:text-[#888ea8] dark:hover:text-white dark:hover:bg-[#1a2941] focus-visible:ring-slate-300",
        white: "bg-transparent text-white hover:bg-white/10 focus-visible:ring-white/40",
      },
      icon: {
        primary: "bg-transparent text-primary hover:bg-primary-light/60 dark:text-primary-light dark:hover:bg-primary/20",
        secondary: "bg-transparent text-secondary hover:bg-secondary-light/60 dark:hover:bg-secondary/20",
        danger: "bg-transparent text-danger hover:bg-danger-light/60 dark:hover:bg-danger/20",
        success: "bg-transparent text-success hover:bg-success-light/60 dark:hover:bg-success/20",
        warning: "bg-transparent text-warning hover:bg-warning-light/60 dark:hover:bg-warning/20",
        info: "bg-transparent text-info hover:bg-info-light/60 dark:hover:bg-info/20",
        dark: "bg-transparent text-[#64748B] hover:text-primary hover:bg-[#F5F6FD] dark:text-[#888ea8] dark:hover:text-white dark:hover:bg-[#1a2941]",
        white: "bg-transparent text-white hover:bg-white/10",
      },
    };

    const spinnerSize = size === 'sm' ? "w-3.5 h-3.5" : size === 'lg' ? "w-5 h-5" : "w-4 h-4";

    const content = (
      <>
        {loading ? (
          <Loader2 className={cn("animate-spin shrink-0", spinnerSize, (children || loadingText) ? "ltr:mr-2 rtl:ml-2" : "")} />
        ) : (
          icon && iconPosition === 'start' && (
            <span className={cn("inline-flex items-center shrink-0", children ? "ltr:mr-2 rtl:ml-2" : "")}>
              {icon}
            </span>
          )
        )}
        {loading && loadingText ? loadingText : children}
        {!loading && icon && iconPosition === 'end' && (
          <span className={cn("inline-flex items-center shrink-0", children ? "ltr:ml-2 rtl:mr-2" : "")}>
            {icon}
          </span>
        )}
      </>
    );

    const buttonNode = (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseClasses,
          sizeClasses[size],
          colorStyles[resolvedVariant][resolvedColor],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {content}
      </button>
    );

    if (tooltip) {
      return (
        <Tippy content={tooltip} placement={tooltipPlacement}>
          {buttonNode}
        </Tippy>
      );
    }

    return buttonNode;
  }
);

Button.displayName = "Button";
export default Button;
```

---

### Blueprint 2: `src/components/ui/DataTable.tsx`

```typescript
import * as React from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTablePagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor?: (item: T, index: number) => string;
  idKey?: keyof T;
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectRow?: (ids: string[]) => void;
  onRowClick?: (item: T) => void;
  emptyState?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (columnKey: string, direction: 'asc' | 'desc') => void;
  pagination?: DataTablePagination;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  idKey = 'id' as keyof T,
  loading = false,
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onRowClick,
  emptyState,
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display matching your criteria.",
  emptyAction,
  sortColumn,
  sortDirection,
  onSortChange,
  pagination,
  striped = false,
  hoverable = true,
  className
}: DataTableProps<T>) {
  // Local sort state for uncontrolled usage
  const [internalSortKey, setInternalSortKey] = React.useState<string | null>(sortColumn || null);
  const [internalSortDir, setInternalSortDir] = React.useState<'asc' | 'desc'>(sortDirection || 'asc');

  const activeSortKey = sortColumn !== undefined ? sortColumn : internalSortKey;
  const activeSortDir = sortDirection !== undefined ? sortDirection : internalSortDir;

  const handleSort = (key: string) => {
    let nextDir: 'asc' | 'desc' = 'asc';
    if (activeSortKey === key) {
      nextDir = activeSortDir === 'asc' ? 'desc' : 'asc';
    }
    if (onSortChange) {
      onSortChange(key, nextDir);
    } else {
      setInternalSortKey(key);
      setInternalSortDir(nextDir);
    }
  };

  // Helper to extract key
  const getItemId = (item: T, idx: number): string => {
    if (keyExtractor) return keyExtractor(item, idx);
    if (idKey && (item as any)[idKey] !== undefined) return String((item as any)[idKey]);
    return String(idx);
  };

  // Selection handlers
  const allIds = React.useMemo(() => data.map((item, idx) => getItemId(item, idx)), [data]);
  const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const masterCheckboxRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleSelectAll = () => {
    if (!onSelectRow) return;
    if (isAllSelected) {
      onSelectRow([]);
    } else {
      onSelectRow(allIds);
    }
  };

  const handleToggleRow = (id: string) => {
    if (!onSelectRow) return;
    if (selectedIds.includes(id)) {
      onSelectRow(selectedIds.filter((item) => item !== id));
    } else {
      onSelectRow([...selectedIds, id]);
    }
  };

  // Alignment classes helper
  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'center') return "text-center";
    if (align === 'right') return "ltr:text-right rtl:text-left";
    return "ltr:text-left rtl:text-right";
  };

  const totalCols = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cn("w-full overflow-hidden rounded-xl border border-border dark:border-[#17263c] bg-white dark:bg-[#0e1726] shadow-sm", className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse ltr:text-left rtl:text-right text-sm">
          {/* Table Header */}
          <thead className="bg-[#F8FAFC] dark:bg-[#1a2941] border-b border-[#e0e6ed]/40 dark:border-[#191e3a]">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    ref={masterCheckboxRef}
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary dark:text-[#4d6ecf] focus:ring-primary/20 accent-[#212B59] dark:accent-[#4d6ecf] cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = activeSortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      "py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94a3b8] whitespace-nowrap",
                      getAlignClass(col.align),
                      col.sortable && "cursor-pointer select-none group hover:text-primary dark:hover:text-white transition-colors",
                      col.headerClassName || col.className
                    )}
                  >
                    <div className={cn("inline-flex items-center gap-1.5", col.align === 'center' ? "justify-center" : col.align === 'right' ? "justify-end" : "justify-start")}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="shrink-0">
                          {isSorted ? (
                            activeSortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-primary dark:text-[#4d6ecf]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-primary dark:text-[#4d6ecf]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#e0e6ed]/40 dark:divide-[#191e3a]">
            {loading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-3.5 text-center">
                      <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={`skeleton-cell-${cIdx}`} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={totalCols} className="py-12 px-4 text-center">
                  {emptyState ? (
                    emptyState
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#121e32] ring-1 ring-slate-200 dark:ring-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3 shadow-sm">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{emptyTitle}</h4>
                      {emptyDescription && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{emptyDescription}</p>
                      )}
                      {emptyAction && <div className="mt-4">{emptyAction}</div>}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((item, index) => {
                const itemId = getItemId(item, index);
                const isSelected = selectedIds.includes(itemId);

                return (
                  <tr
                    key={itemId}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "transition-colors",
                      striped && index % 2 === 1 && "bg-slate-50/40 dark:bg-[#121e32]/20",
                      hoverable && "hover:bg-[#F5F6FD]/60 dark:hover:bg-[#1a2941]/40",
                      isSelected && "bg-primary/5 dark:bg-primary/10",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {selectable && (
                      <td
                        className="w-10 px-4 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(itemId)}
                          aria-label={`Select row ${index + 1}`}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary dark:text-[#4d6ecf] focus:ring-primary/20 accent-[#212B59] dark:accent-[#4d6ecf] cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "py-3 px-4 text-sm font-normal text-[#1E293B] dark:text-[#c9d1d9] align-middle",
                          getAlignClass(col.align),
                          col.className
                        )}
                      >
                        {col.render ? col.render(item, index) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3.5 border-t border-[#e0e6ed]/40 dark:border-[#191e3a] bg-[#F8FAFC]/50 dark:bg-[#121e32]/30 text-xs text-[#64748B] dark:text-[#888ea8]">
          <div className="flex items-center gap-2">
            <span>
              Showing {Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, pagination.totalRecords)} to{" "}
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} of {pagination.totalRecords} entries
            </span>
            {pagination.onPageSizeChange && (
              <div className="flex items-center gap-1.5 ltr:ml-4 rtl:mr-4">
                <span>Rows:</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onPageSizeChange!(Number(e.target.value))}
                  className="rounded-lg border border-[#E2E8F0] dark:border-[#17263c] bg-white dark:bg-[#0e1726] px-2 py-1 text-xs text-[#1E293B] dark:text-white focus:outline-none focus:border-primary"
                >
                  {(pagination.pageSizeOptions || [10, 25, 50, 100]).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Circular 36x36px Page Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              aria-label="Previous Page"
              className="h-9 w-9 rounded-full flex items-center justify-center text-xs transition-colors duration-150 border border-[#E2E8F0] dark:border-[#17263c] bg-white dark:bg-[#0e1726] text-[#1E293B] dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#1a2941] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, and window around current page
                if (p === 1 || p === pagination.totalPages) return true;
                return Math.abs(p - pagination.currentPage) <= 1;
              })
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;

                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => pagination.onPageChange(p)}
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-150",
                        pagination.currentPage === p
                          ? "bg-primary text-white shadow-sm dark:bg-[#4d6ecf]"
                          : "border border-[#E2E8F0] dark:border-[#17263c] bg-white dark:bg-[#0e1726] text-[#1E293B] dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#1a2941]"
                      )}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              aria-label="Next Page"
              className="h-9 w-9 rounded-full flex items-center justify-center text-xs transition-colors duration-150 border border-[#E2E8F0] dark:border-[#17263c] bg-white dark:bg-[#0e1726] text-[#1E293B] dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#1a2941] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
```

---

### Blueprint 3: `src/components/ui/CustomTable.tsx` (Alias / Re-export)

```typescript
import * as React from "react";
import { DataTable, DataTableProps, ColumnDef } from "./DataTable";

export type { ColumnDef };
export type CustomTableProps<T> = DataTableProps<T>;

export function CustomTable<T>(props: CustomTableProps<T>) {
  return <DataTable<T> {...props} />;
}

export default CustomTable;
```

---

### Blueprint 4: `src/components/ui/TableActionsButtons.tsx`

```typescript
import * as React from "react";
import { Eye, Edit2, Trash2, Copy } from "lucide-react";
import Tippy from "@tippyjs/react";
import { cn } from "../../lib/utils";

export interface CustomAction {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  color?: string;
  className?: string;
}

export interface TableActionsButtonsProps {
  id?: string | number;
  onView?: () => void;
  onShow?: () => void; // Alias for onView
  onEdit?: () => void;
  onDelete?: () => void;
  onClone?: () => void;
  onDuplicate?: () => void; // Alias for onClone
  viewTooltip?: string;
  editTooltip?: string;
  deleteTooltip?: string;
  cloneTooltip?: string;
  customActions?: CustomAction[];
  size?: 'sm' | 'md';
  className?: string;
}

export const TableActionsButtons: React.FC<TableActionsButtonsProps> = ({
  id,
  onView,
  onShow,
  onEdit,
  onDelete,
  onClone,
  onDuplicate,
  viewTooltip = "View",
  editTooltip = "Edit",
  deleteTooltip = "Delete",
  cloneTooltip = "Clone",
  customActions = [],
  size = 'md',
  className,
}) => {
  const handleView = onView || onShow;
  const handleClone = onClone || onDuplicate;

  const iconSize = size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4";
  const btnPadding = size === 'sm' ? "p-1 rounded-md" : "p-1.5 rounded-lg";

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {/* View Action */}
      {handleView && (
        <Tippy content={viewTooltip} placement="top">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
            aria-label={viewTooltip}
            className={cn(
              btnPadding,
              "text-slate-400 hover:text-primary dark:hover:text-primary-light hover:bg-primary-light/50 dark:hover:bg-primary/20 transition-colors duration-150 active:scale-95"
            )}
          >
            <Eye className={iconSize} />
          </button>
        </Tippy>
      )}

      {/* Edit Action */}
      {onEdit && (
        <Tippy content={editTooltip} placement="top">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label={editTooltip}
            className={cn(
              btnPadding,
              "text-slate-400 hover:text-warning dark:hover:text-warning hover:bg-warning-light/50 dark:hover:bg-warning/20 transition-colors duration-150 active:scale-95"
            )}
          >
            <Edit2 className={iconSize} />
          </button>
        </Tippy>
      )}

      {/* Clone / Duplicate Action */}
      {handleClone && (
        <Tippy content={cloneTooltip} placement="top">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClone();
            }}
            aria-label={cloneTooltip}
            className={cn(
              btnPadding,
              "text-slate-400 hover:text-info dark:hover:text-info hover:bg-info-light/50 dark:hover:bg-info/20 transition-colors duration-150 active:scale-95"
            )}
          >
            <Copy className={iconSize} />
          </button>
        </Tippy>
      )}

      {/* Custom Actions */}
      {customActions.map((action, idx) => (
        <Tippy key={idx} content={action.tooltip} placement="top">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            aria-label={action.tooltip}
            className={cn(
              btnPadding,
              "text-slate-400 hover:text-[#1E293B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2941] transition-colors duration-150 active:scale-95",
              action.className
            )}
          >
            {action.icon}
          </button>
        </Tippy>
      ))}

      {/* Delete Action */}
      {onDelete && (
        <Tippy content={deleteTooltip} placement="top">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={deleteTooltip}
            className={cn(
              btnPadding,
              "text-slate-400 hover:text-danger dark:hover:text-danger hover:bg-danger-light/50 dark:hover:bg-danger/20 transition-colors duration-150 active:scale-95"
            )}
          >
            <Trash2 className={iconSize} />
          </button>
        </Tippy>
      )}
    </div>
  );
};

export default TableActionsButtons;
```

---

### Blueprint 5: `src/components/ui/ContainerCard.tsx`

```typescript
import * as React from "react";
import { cn } from "../../lib/utils";

export interface ContainerCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  subTitle?: React.ReactNode; // Backward compatibility alias
  btnCorner?: React.ReactNode; // Backward compatibility alias
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  children: React.ReactNode;
}

export const ContainerCard: React.FC<ContainerCardProps> = ({
  title,
  subtitle,
  subTitle,
  btnCorner,
  actions,
  icon,
  badge,
  footer,
  noPadding = false,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  children,
}) => {
  const resolvedSubtitle = subtitle || subTitle;
  const resolvedActions = actions || btnCorner;
  const hasHeader = title || resolvedSubtitle || resolvedActions || icon || badge;

  return (
    <div
      className={cn(
        "rounded-xl border border-[#E2E8F0] dark:border-[#17263c] bg-white dark:bg-[#0e1726] shadow-sm transition-colors duration-200 overflow-hidden",
        className
      )}
    >
      {/* Card Header */}
      {hasHeader && (
        <div
          className={cn(
            "flex items-center justify-between gap-4 px-5 py-4 border-b border-[#E2E8F0] dark:border-[#17263c]",
            headerClassName
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <span className="text-primary dark:text-primary-light shrink-0">
                {icon}
              </span>
            )}
            <div className="truncate">
              {title && (
                <h3 className="text-primary dark:text-white font-bold text-lg leading-tight truncate">
                  {title}
                </h3>
              )}
              {resolvedSubtitle && (
                <p className="text-xs text-[#64748B] dark:text-[#888ea8] font-medium mt-0.5 truncate">
                  {resolvedSubtitle}
                </p>
              )}
            </div>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {resolvedActions && (
            <div className="flex items-center gap-2 shrink-0">
              {resolvedActions}
            </div>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className={cn(noPadding ? "p-0" : "p-5 md:p-6", bodyClassName)}>
        {children}
      </div>

      {/* Optional Card Footer */}
      {footer && (
        <div
          className={cn(
            "border-t border-[#E2E8F0] dark:border-[#17263c] px-5 py-3.5 bg-slate-50/60 dark:bg-[#121e32]/40 rounded-b-xl",
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default ContainerCard;
```

---

### Blueprint 6: `src/components/ui/KpiCard.tsx`

```typescript
import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface KpiTrend {
  value: number | string;
  isPositive?: boolean;
  label?: string;
}

export type KpiColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subvalue?: string;
  icon: React.ReactNode;
  color?: KpiColor;
  trend?: KpiTrend;
  chart?: React.ReactNode;
  badge?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subvalue,
  icon,
  color = 'primary',
  trend,
  chart,
  badge,
  loading = false,
  onClick,
  className,
}) => {
  const iconBgClasses: Record<KpiColor, string> = {
    primary: "bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light",
    secondary: "bg-secondary-light text-secondary dark:bg-secondary/20 dark:text-secondary-light",
    success: "bg-success-light text-success dark:bg-success/20 dark:text-success",
    danger: "bg-danger-light text-danger dark:bg-danger/20 dark:text-danger",
    warning: "bg-warning-light text-warning dark:bg-warning/20 dark:text-warning",
    info: "bg-info-light text-info dark:bg-info/20 dark:text-info",
  };

  if (loading) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl border border-[#E2E8F0] dark:border-[#17263c] bg-white dark:bg-[#0e1726] p-5 shadow-sm animate-pulse", className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[#E2E8F0] dark:border-[#17263c] bg-white dark:bg-[#0e1726] p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#888ea8] truncate">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-black text-[#1E293B] dark:text-white tracking-tight mt-1.5 truncate">
            {value}
          </h3>
        </div>

        {/* 48x48px Icon Badge */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105",
            iconBgClasses[color]
          )}
        >
          {icon}
        </div>
      </div>

      {/* Sub-row with Trend or Subvalue or Badge */}
      {(trend || subvalue || badge) && (
        <div className="mt-3.5 flex items-center flex-wrap gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-[11px]",
                trend.isPositive !== false
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                  : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40"
              )}
            >
              {trend.isPositive !== false ? (
                <TrendingUp className="w-3.5 h-3.5 ltr:mr-0.5 rtl:ml-0.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 ltr:mr-0.5 rtl:ml-0.5" />
              )}
              {typeof trend.value === 'number' && trend.value > 0 ? `+${trend.value}%` : `${trend.value}`}
            </span>
          )}

          {subvalue && (
            <span className="text-[#64748B] dark:text-[#888ea8] font-medium">
              {subvalue}
            </span>
          )}

          {badge && <div className="ltr:ml-auto rtl:mr-auto">{badge}</div>}
        </div>
      )}

      {/* Sparkline / Chart Slot */}
      {chart && <div className="mt-4">{chart}</div>}
    </div>
  );
};

export default KpiCard;
```

---

### Blueprint 7: `src/components/ui/StatusBadge.tsx`

```typescript
import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Tag,
  Circle
} from "lucide-react";
import { cn } from "../../lib/utils";

export type StatusBadgeCategory = 
  | 'generic' 
  | 'inventory' 
  | 'inspection' 
  | 'approval' 
  | 'risk' 
  | 'condition';

export type SemanticStatus =
  | 'success'
  | 'error'
  | 'danger'
  | 'warning'
  | 'info'
  | 'primary'
  | 'secondary'
  | 'neutral'
  // Inventory status
  | 'Active'
  | 'Inactive'
  | 'Discontinued'
  | 'Low Stock'
  | 'Out of Stock'
  | 'Overdue'
  // Risk Categories
  | 'Category I'
  | 'Category II'
  | 'Category III'
  // Condition Pools
  | 'New'
  | 'Used'
  | 'Scrap'
  | 'Quarantine'
  // Approvals & Workflows
  | 'Approved'
  | 'Pending'
  | 'Under Review'
  | 'Rejected'
  | 'Draft'
  | 'Closed'
  | 'Open';

export interface StatusBadgeProps {
  status?: SemanticStatus | string;
  category?: StatusBadgeCategory;
  label?: string;
  children?: React.ReactNode;
  icon?: boolean | React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface BadgeStyleConfig {
  classes: string;
  defaultIcon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'neutral',
  category,
  label,
  children,
  icon = false,
  dot = false,
  pulse = false,
  size = 'md',
  className,
}) => {
  const textLabel = label || children || status;

  // 1. Resolve Style Configurations
  const getBadgeStyle = (): BadgeStyleConfig => {
    const s = String(status).toLowerCase();

    // Risk Categories
    if (s.includes('category i') && !s.includes('category ii') && !s.includes('category iii')) {
      return {
        classes: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50",
        defaultIcon: <ShieldCheck className="w-3.5 h-3.5" />,
      };
    }
    if (s.includes('category ii') && !s.includes('category iii')) {
      return {
        classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
        defaultIcon: <AlertTriangle className="w-3.5 h-3.5" />,
      };
    }
    if (s.includes('category iii')) {
      return {
        classes: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50",
        defaultIcon: <AlertCircle className="w-3.5 h-3.5" />,
      };
    }

    // Condition Pools
    if (s === 'new') {
      return {
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
        defaultIcon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'used') {
      return {
        classes: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50",
        defaultIcon: <Tag className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'scrap') {
      return {
        classes: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50",
        defaultIcon: <XCircle className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'quarantine') {
      return {
        classes: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/50",
        defaultIcon: <AlertTriangle className="w-3.5 h-3.5" />,
      };
    }

    // Approvals / Inspection
    if (s === 'approved' || s === 'passed' || s === 'active' || s === 'open') {
      return {
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
        defaultIcon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'pending' || s === 'under review' || s === 'low stock' || s === 'transferred') {
      return {
        classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
        defaultIcon: <Clock className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'rejected' || s === 'failed' || s === 'out of stock' || s === 'overdue' || s === 'terminated') {
      return {
        classes: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50",
        defaultIcon: <XCircle className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'draft' || s === 'discontinued' || s === 'closed') {
      return {
        classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        defaultIcon: <Clock className="w-3.5 h-3.5" />,
      };
    }

    // Semantic colors
    if (s === 'success') {
      return {
        classes: "bg-success-light text-success border border-success/20 dark:bg-success/20 dark:text-success dark:border-success/30",
        defaultIcon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'error' || s === 'danger') {
      return {
        classes: "bg-danger-light text-danger border border-danger/20 dark:bg-danger/20 dark:text-danger dark:border-danger/30",
        defaultIcon: <XCircle className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'warning') {
      return {
        classes: "bg-warning-light text-warning border border-warning/20 dark:bg-warning/20 dark:text-warning dark:border-warning/30",
        defaultIcon: <AlertTriangle className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'info') {
      return {
        classes: "bg-info-light text-info border border-info/20 dark:bg-info/20 dark:text-info dark:border-info/30",
        defaultIcon: <AlertCircle className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'primary') {
      return {
        classes: "bg-primary-light text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary-light dark:border-primary/30",
        defaultIcon: <Tag className="w-3.5 h-3.5" />,
      };
    }
    if (s === 'secondary') {
      return {
        classes: "bg-secondary-light text-secondary border border-secondary/20 dark:bg-secondary/20 dark:text-secondary-light dark:border-secondary/30",
        defaultIcon: <Tag className="w-3.5 h-3.5" />,
      };
    }

    // Default neutral
    return {
      classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1b2e4b] dark:text-[#888ea8] dark:border-[#17263c]",
      defaultIcon: <Clock className="w-3.5 h-3.5" />,
    };
  };

  const styleConfig = getBadgeStyle();

  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  const renderedIcon = React.isValidElement(icon)
    ? icon
    : icon === true
    ? styleConfig.defaultIcon
    : null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-full border whitespace-nowrap tracking-wide transition-colors",
        sizeClasses[size],
        styleConfig.classes,
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2 ltr:mr-1.5 rtl:ml-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {!pulse && dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current ltr:mr-1.5 rtl:ml-1.5 shrink-0" />
      )}
      {!dot && !pulse && renderedIcon && (
        <span className="inline-flex items-center shrink-0 ltr:mr-1.5 rtl:ml-1.5">
          {renderedIcon}
        </span>
      )}
      <span>{textLabel}</span>
    </span>
  );
};

export default StatusBadge;
```

---

### Blueprint 8: `src/components/ui/EmptyState.tsx`

```typescript
import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-[#E2E8F0] dark:border-[#17263c] bg-white dark:bg-[#0e1726] shadow-sm",
        compact ? "p-6" : "p-8 md:p-12",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-[#121e32] ring-1 ring-slate-200 dark:ring-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-sm shrink-0">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-bold text-[#1E293B] dark:text-white leading-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-[#64748B] dark:text-[#888ea8] mt-1.5 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex items-center justify-center gap-3">{action}</div>}
    </div>
  );
};

export default EmptyState;
```

---

## 5. Verification Method

To verify the shared UI components independently:

1. **Static Analysis & TypeScript Type Check:**
   Run:
   ```powershell
   npm run lint
   ```
   *Expected result:* 0 errors, 0 warnings across all files.

2. **Client Build Compilation:**
   Run:
   ```powershell
   npm run build
   ```
   *Expected result:* Vite bundles the entire application into `dist/` with zero missing module errors and clean asset output.

3. **Server Build & Automated Tests:**
   Run:
   ```powershell
   npm run build:server
   npm run test:server
   npm run test:e2e
   ```
   *Expected result:* Server builds successfully and existing end-to-end test suites pass with 0 regressions.

4. **Visual & Behavioral Verification Matrix:**
   - **Button**: Verify all 4 variants (`solid`, `outline`, `text`, `icon`) and 8 colors. Verify `loading={true}` renders the spinning `Loader2` and disables interaction. Verify `tooltip` triggers Tippy popup. Verify `active:scale-[0.98]`.
   - **Data Table**: Verify sort toggling rotates indicators (`ArrowUp` / `ArrowDown`). Verify clicking master checkbox toggles all row checkboxes and indeterminate state displays when subset selected. Verify circular page buttons navigate properly and flip arrows in RTL.
   - **ContainerCard & KpiCard**: Verify light and dark mode surfaces (`#FFFFFF` vs `#0e1726`), hairline border `#E2E8F0`, 48x48px icon badge in KPI card, and trend percentage pill styling.
   - **StatusBadge**: Verify Arabic text rendering with inverted spacing (`rtl:ml-1.5`), proper domain color schemes for Category I/II/III, New/Used/Scrap, and Approved/Pending/Rejected.
