import * as React from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  render?: (item: T, index?: number) => React.ReactNode;
}

export type Column<T> = ColumnDef<T>;

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
  keyExtractor?: (item: any, index: number) => string;
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
    <div className={cn("w-full overflow-hidden rounded-xl border border-border bg-white shadow-sm", className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse ltr:text-left rtl:text-right text-sm">
          {/* Table Header */}
          <thead className="bg-[#F8FAFC] border-b border-[#e0e6ed]/40 ">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    ref={masterCheckboxRef}
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-[#212B59] cursor-pointer"
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
                      "py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-[#475569] whitespace-nowrap",
                      getAlignClass(col.align),
                      col.sortable && "cursor-pointer select-none group hover:text-primary transition-colors",
                      col.headerClassName || col.className
                    )}
                  >
                    <div className={cn("inline-flex items-center gap-1.5", col.align === 'center' ? "justify-center" : col.align === 'right' ? "justify-end" : "justify-start")}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="shrink-0">
                          {isSorted ? (
                            activeSortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-primary " />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-primary " />
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
          <tbody className="divide-y divide-[#e0e6ed]/40 ">
            {loading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-3.5 text-center">
                      <div className="h-4 w-4 bg-slate-200 rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={`skeleton-cell-${cIdx}`} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
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
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-sm">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-800 ">{emptyTitle}</h4>
                      {emptyDescription && (
                        <p className="text-xs text-gray-500 mt-1 max-w-sm">{emptyDescription}</p>
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
                      striped && index % 2 === 1 && "bg-slate-50/40 ",
                      hoverable && "hover:bg-[#F5F6FD]/60 ",
                      isSelected && "bg-primary/5 ",
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
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-[#212B59] cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "py-3 px-4 text-sm font-normal text-[#1E293B] align-middle",
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3.5 border-t border-[#e0e6ed]/40 bg-[#F8FAFC]/50 text-xs text-[#64748B] ">
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
                  className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-xs text-[#1E293B] focus:outline-none focus:border-primary"
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
              type="button"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              aria-label="Previous Page"
              className="h-9 w-9 rounded-full flex items-center justify-center text-xs transition-colors duration-150 border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                      type="button"
                      onClick={() => pagination.onPageChange(p)}
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-150 cursor-pointer",
                        pagination.currentPage === p
                          ? "bg-primary text-white shadow-sm "
                          : "border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-slate-100 "
                      )}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              aria-label="Next Page"
              className="h-9 w-9 rounded-full flex items-center justify-center text-xs transition-colors duration-150 border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
