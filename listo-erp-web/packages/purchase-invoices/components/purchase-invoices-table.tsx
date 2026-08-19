"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import {
  DotsThreeVertical,
  FileText,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import {
  type Column,
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { PurchaseInvoice } from "../types";
import { PurchaseInvoiceReceiptDialog } from "./purchase-invoice-receipt-dialog";

interface PurchaseInvoicesTableProps {
  invoices: PurchaseInvoice[];
  isLoading: boolean;
  error?: Error | null;
}

const statusLabels: Record<PurchaseInvoice["status"], string> = {
  POSTED: "Registrada",
  CANCELLED: "Cancelada",
};

const statusClasses: Record<PurchaseInvoice["status"], string> = {
  POSTED:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  CANCELLED:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

function SortableHeader({
  column,
  children,
}: {
  column: Column<PurchaseInvoice, unknown>;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 px-2"
      onClick={column.getToggleSortingHandler()}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

function buildColumns(
  formatMoney: (value: number | string | null | undefined) => string,
  onReceipt: (invoice: PurchaseInvoice) => void,
): ColumnDef<PurchaseInvoice>[] {
  return [
    {
      id: "documentNumber",
      header: ({ column }) => (
        <SortableHeader column={column}>No. factura</SortableHeader>
      ),
      accessorKey: "documentNumber",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.documentNumber}</span>
      ),
    },
    {
      id: "supplierInvoiceNumber",
      header: ({ column }) => (
        <SortableHeader column={column}>No. proveedor</SortableHeader>
      ),
      accessorKey: "supplierInvoiceNumber",
    },
    {
      id: "issueDate",
      header: ({ column }) => (
        <SortableHeader column={column}>Fecha</SortableHeader>
      ),
      accessorKey: "issueDate",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {new Date(row.original.issueDate).toLocaleDateString()}
        </span>
      ),
      sortingFn: "datetime",
    },
    {
      id: "supplier",
      header: ({ column }) => (
        <SortableHeader column={column}>Proveedor</SortableHeader>
      ),
      accessorFn: (row) => row.supplier.name,
      cell: ({ row }) => row.original.supplier.name,
    },
    {
      id: "warehouse",
      header: ({ column }) => (
        <SortableHeader column={column}>Almacén</SortableHeader>
      ),
      accessorFn: (row) => row.warehouse.name,
      cell: ({ row }) => row.original.warehouse.name,
    },
    {
      id: "total",
      header: ({ column }) => (
        <SortableHeader column={column}>Total</SortableHeader>
      ),
      accessorKey: "total",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatMoney(row.original.total)}
        </span>
      ),
      sortingFn: "basic",
    },
    {
      id: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>Estado</SortableHeader>
      ),
      accessorKey: "status",
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClasses[row.original.status]}`}
        >
          {statusLabels[row.original.status]}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Acciones para factura ${row.original.documentNumber}`}
              >
                <DotsThreeVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onReceipt(row.original)}>
                <FileText className="size-4" /> Ver recibo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export function PurchaseInvoicesTable({
  invoices,
  isLoading,
  error,
}: PurchaseInvoicesTableProps) {
  const { formatMoney } = useCurrency();
  const [search, setSearch] = useState("");
  const [receiptInvoice, setReceiptInvoice] = useState<PurchaseInvoice | null>(
    null,
  );
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => buildColumns(formatMoney, setReceiptInvoice),
    [formatMoney],
  );
  const table = useReactTable({
    data: invoices ?? [],
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "")
        .trim()
        .toLowerCase();
      if (!query) return true;
      return [
        row.original.documentNumber,
        row.original.supplierInvoiceNumber,
        row.original.supplier.name,
        row.original.supplier.taxId ?? "",
        row.original.warehouse.name,
      ].some((value) => value.toLowerCase().includes(query));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar factura, proveedor o almacén..."
        />
      </div>
      <DataTable
        table={table}
        loading={isLoading}
        loadingMessage="Cargando facturas..."
        error={error?.message}
        emptyMessage="No hay facturas de proveedores registradas."
        className="overflow-x-auto"
        tableClassName="min-w-[980px]"
      />
      <DataTablePagination
        table={table}
        pageLabel="Página"
        previousLabel="Anterior"
        nextLabel="Siguiente"
      />
      <PurchaseInvoiceReceiptDialog
        invoiceId={receiptInvoice?.id ?? null}
        documentNumber={receiptInvoice?.documentNumber}
        open={receiptInvoice !== null}
        onOpenChange={(open) => !open && setReceiptInvoice(null)}
      />
    </div>
  );
}
