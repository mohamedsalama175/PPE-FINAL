import * as React from "react"
import { cn } from "../../lib/utils"

interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: any) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: any) => string;
  emptyState?: React.ReactNode;
}

export function DataTable<T>({ data, columns, keyExtractor, emptyState }: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <div className="py-8">{emptyState}</div>;
  }

  return (
    <div className="w-full overflow-x-auto bg-surface">
      <table className="w-full text-left text-[13px] border-collapse">
        <thead className="bg-[#F1F1EF] sticky top-0">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn("px-3 py-2 text-[11px] font-semibold text-body uppercase tracking-wider border-b border-border", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="hover:bg-canvas/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-3 py-2 border-b border-border h-9", col.className)}>
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
