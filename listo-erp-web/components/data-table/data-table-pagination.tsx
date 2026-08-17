import type { Table as TanStackTable } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DataTablePaginationProps<TData> {
  table: TanStackTable<TData>;
  pageLabel?: ReactNode;
  previousLabel?: ReactNode;
  nextLabel?: ReactNode;
  className?: string;
}

export function DataTablePagination<TData>({
  table,
  pageLabel = "Página",
  previousLabel = "Anterior",
  nextLabel = "Siguiente",
  className,
}: DataTablePaginationProps<TData>) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-sm text-muted-foreground">
        {pageLabel} {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {previousLabel}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
