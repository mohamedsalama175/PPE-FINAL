import * as React from "react";
import { DataTable, DataTableProps, ColumnDef, Column, DataTablePagination } from "./DataTable";

export type { ColumnDef, Column, DataTablePagination };
export type CustomTableProps<T> = DataTableProps<T>;

export function CustomTable<T>(props: CustomTableProps<T>) {
  return <DataTable<T> {...props} />;
}

export default CustomTable;
