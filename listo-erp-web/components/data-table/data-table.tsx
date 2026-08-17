import {
  flexRender,
  type Cell,
  type Row,
  type Table as TanStackTable,
} from "@tanstack/react-table";
import type { HTMLAttributes } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableProps<TData> {
  table: TanStackTable<TData>;
  emptyMessage?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  emptyClassName?: string;
  cellClassName?: (cell: Cell<TData, unknown>) => string | undefined;
  rowClassName?: (row: Row<TData>) => string | undefined;
  rowProps?: (row: Row<TData>) => HTMLAttributes<HTMLTableRowElement>;
}

export function DataTable<TData>({
  table,
  emptyMessage = "No hay resultados.",
  loading = false,
  loadingMessage = "Cargando...",
  error,
  className,
  tableClassName,
  headerClassName = "bg-muted/40",
  emptyClassName = "h-24 text-center text-muted-foreground",
  cellClassName,
  rowClassName,
  rowProps,
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;

  return (
    <div className={cn("rounded-lg border", className)}>
      <Table className={tableClassName}>
        <TableHeader className={headerClassName}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {error ? (
            <TableRow>
              <TableCell colSpan={table.getAllLeafColumns().length} className={emptyClassName}>
                {error}
              </TableCell>
            </TableRow>
          ) : loading ? (
            <TableRow>
              <TableCell colSpan={table.getAllLeafColumns().length} className={emptyClassName}>
                {loadingMessage}
              </TableCell>
            </TableRow>
          ) : rows.length ? (
            rows.map((row) => {
              const props = rowProps?.(row);
              return (
                <TableRow
                  key={row.id}
                  {...props}
                  className={cn(rowClassName?.(row), props?.className)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cellClassName?.(cell)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={table.getAllLeafColumns().length} className={emptyClassName}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
