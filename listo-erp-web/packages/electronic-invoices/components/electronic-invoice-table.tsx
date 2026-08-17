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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/ui/sonner";
import { downloadElectronicInvoiceReceipt } from "@/packages/pos/api";
import { DotsThreeVertical, DownloadSimple, Spinner } from "@phosphor-icons/react";
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
import { useCurrency } from "@/packages/currency/components/currency-provider";
import * as React from "react";
import type { ElectronicInvoiceListItem, ElectronicInvoiceStatus } from "../types";

type TFunction = (key: string) => string;

interface ElectronicInvoiceTableProps {
  invoices: ElectronicInvoiceListItem[];
  t: TFunction;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<ElectronicInvoiceListItem, unknown>;
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

function StatusPill({ status, t }: { status: ElectronicInvoiceStatus; t: TFunction }) {
  const statusClass = {
    ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    PROCESSING: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    REJECTED: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
    FAILED: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  };

  const statusLabel = {
    ACCEPTED: t("sales.electronicInvoices.statusLabels.accepted"),
    PENDING: t("sales.electronicInvoices.statusLabels.pending"),
    PROCESSING: t("sales.electronicInvoices.statusLabels.processing"),
    REJECTED: t("sales.electronicInvoices.statusLabels.rejected"),
    FAILED: t("sales.electronicInvoices.statusLabels.failed"),
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function DownloadReceiptButton({ invoice, t }: { invoice: ElectronicInvoiceListItem; t: TFunction }) {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadElectronicInvoiceReceipt(invoice.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${invoice.electronicInvoice?.consecutive ?? "factura"}-recibo.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast({
        type: "error",
        message: t("sales.electronicInvoices.downloadError"),
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleDownload}
      disabled={downloading}
    >
      {downloading ? (
        <Spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <DownloadSimple className="mr-2 h-4 w-4" />
      )}
      {t("sales.electronicInvoices.downloadReceipt")}
    </DropdownMenuItem>
  );
}

function buildColumns({
  t,
  formatMoney,
}: Pick<
  ElectronicInvoiceTableProps,
  "t"
> & {
  formatMoney: (value: number | string | null | undefined) => string;
}): ColumnDef<ElectronicInvoiceListItem>[] {
  return [
    {
      id: "consecutive",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.electronicInvoices.consecutive")}</SortableHeader>
      ),
      accessorFn: (row) => row.electronicInvoice?.consecutive ?? "",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">
            {row.original.electronicInvoice?.consecutive ?? "-"}
          </div>
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.electronicInvoices.date")}</SortableHeader>
      ),
      accessorFn: (row) => row.createdAt ?? "",
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap text-sm">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
      sortingFn: "datetime",
    },
    {
      id: "customer",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.electronicInvoices.customer")}</SortableHeader>
      ),
      accessorFn: (row) => row.customer?.name ?? "",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.customer.name}</span>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "seller",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.electronicInvoices.seller")}</SortableHeader>
      ),
      accessorFn: (row) => row.seller?.name ?? "",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.seller.name}</span>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "total",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.electronicInvoices.total")}</SortableHeader>
      ),
      accessorFn: (row) => row.total ?? 0,
      cell: ({ row }) => (
        <span className="text-sm font-medium">{formatMoney(row.original.total)}</span>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.electronicInvoices.status")}</SortableHeader>
      ),
      accessorFn: (row) => row.electronicInvoice?.status ?? "",
      cell: ({ row }) => (
        row.original.electronicInvoice ? (
          <StatusPill status={row.original.electronicInvoice.status} t={t} />
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      ),
      filterFn: (row, _id, filterValue) => {
        if (!filterValue || filterValue === "ALL") return true;
        return row.original.electronicInvoice?.status === filterValue;
      },
      sortingFn: "alphanumeric",
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("sales.electronicInvoices.actions")}</div>,
      cell: ({ row }) => {
        const invoice = row.original;
        const canDownload = invoice.electronicInvoice?.canDownload ?? false;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("sales.electronicInvoices.actions")}</span>
                  <DotsThreeVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canDownload && (
                  <DownloadReceiptButton invoice={invoice} t={t} />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export function ElectronicInvoiceTable({
  invoices,
  t,
}: ElectronicInvoiceTableProps) {
  const { formatMoney } = useCurrency();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusValue, setStatusValue] = React.useState<string>("");

  const columns = React.useMemo(
    () => buildColumns({ t, formatMoney }),
    [t, formatMoney]
  );

  const table = useReactTable({
    data: invoices ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").trim().toLowerCase();
      if (!q) return true;
      return [
        row.original.electronicInvoice?.consecutive,
        row.original.customer?.name,
        row.original.seller?.name,
      ].some((value) => value?.toLowerCase().includes(q));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t("sales.electronicInvoices.searchPlaceholder")}
            className="sm:max-w-sm"
          />
          <Select
            value={statusValue}
            onValueChange={(value) => {
              if (value === "ALL") {
                table.getColumn("status")?.setFilterValue(undefined);
                setStatusValue("");
                return;
              }
              setStatusValue(value);
              table.getColumn("status")?.setFilterValue(value);
            }}
          >
            <SelectTrigger size="default" className="min-w-40">
              <SelectValue placeholder={t("sales.electronicInvoices.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("sales.electronicInvoices.allStatuses")}</SelectItem>
              <SelectItem value="ACCEPTED">{t("sales.electronicInvoices.statusLabels.accepted")}</SelectItem>
              <SelectItem value="PENDING">{t("sales.electronicInvoices.statusLabels.pending")}</SelectItem>
              <SelectItem value="PROCESSING">{t("sales.electronicInvoices.statusLabels.processing")}</SelectItem>
              <SelectItem value="REJECTED">{t("sales.electronicInvoices.statusLabels.rejected")}</SelectItem>
              <SelectItem value="FAILED">{t("sales.electronicInvoices.statusLabels.failed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable table={table} emptyMessage={t("sales.electronicInvoices.noSales")} />

      <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} />
    </div>
  );
}
