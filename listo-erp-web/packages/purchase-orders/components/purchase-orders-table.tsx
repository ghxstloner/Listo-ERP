"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DotsThreeVertical, MagnifyingGlass } from "@phosphor-icons/react";
import { ArrowUpDown, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { useMemo, useState } from "react";
import { useCancelPurchaseOrder } from "../api";
import type { PurchaseOrder } from "../types";

const statusLabels: Record<PurchaseOrder["status"], string> = {
  PENDING: "Pendiente",
  RECEIVED: "Recibida",
  CANCELLED: "Cancelada",
};
const statusClasses: Record<PurchaseOrder["status"], string> = {
  PENDING:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  RECEIVED:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  CANCELLED:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

function SortableHeader({
  column,
  children,
}: {
  column: Column<PurchaseOrder, unknown>;
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

function OrderActions({ order }: { order: PurchaseOrder }) {
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState<"cancel" | null>(null);
  const [cancel, isCancelling] = useCancelPurchaseOrder(order.id);
  const isMutating = isCancelling;

  const complete = (message: string) => {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    setConfirmation(null);
    showToast({ type: "success", message });
  };

  if (order.status !== "PENDING") return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Acciones para orden ${order.id}`}
            disabled={isMutating}
          >
            <DotsThreeVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmation("cancel")}
          >
            <X className="size-4" /> Cancelar orden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmation !== null}
        onOpenChange={(open) => !open && setConfirmation(null)}
        onConfirm={() =>
          cancel(undefined, () => complete("Orden de compra cancelada."))
        }
        title="¿Cancelar orden?"
        description="La orden dejará de estar disponible para facturación. Esta acción no se puede deshacer."
        confirmText="Cancelar orden"
        severity="destructive"
        isLoading={isMutating}
      />
    </>
  );
}

function buildColumns(
  formatMoney: (value: number | string | null | undefined) => string,
): ColumnDef<PurchaseOrder>[] {
  return [
    {
      id: "id",
      header: ({ column }) => (
        <SortableHeader column={column}>Orden</SortableHeader>
      ),
      accessorFn: (row) => String(row.id),
      cell: ({ row }) => (
        <span className="font-medium">#{row.original.id}</span>
      ),
      sortingFn: "basic",
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
      id: "products",
      header: ({ column }) => (
        <SortableHeader column={column}>Productos</SortableHeader>
      ),
      accessorFn: (row) => {
        const totalQuantity = row.items.reduce(
          (sum, item) => sum + Number(item.quantity),
          0,
        );
        const total = row.items.reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.unitCost),
          0,
        );
        return `${totalQuantity} ${formatMoney(total)}`;
      },
      cell: ({ row }) => {
        const totalQuantity = row.original.items.reduce(
          (sum, item) => sum + Number(item.quantity),
          0,
        );
        const total = row.original.items.reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.unitCost),
          0,
        );
        return (
          <>
            <span className="font-medium">{totalQuantity}</span>{" "}
            <span className="text-muted-foreground">unidades</span>
            <span className="ml-2 hidden text-muted-foreground lg:inline">
              {formatMoney(total)}
            </span>
          </>
        );
      },
    },
    {
      id: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Fecha</SortableHeader>
      ),
      accessorFn: (row) => row.createdAt,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
      sortingFn: "datetime",
    },
    {
      id: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>Estado</SortableHeader>
      ),
      accessorFn: (row) => row.status,
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClasses[row.original.status]}`}
        >
          {statusLabels[row.original.status]}
        </span>
      ),
      filterFn: (row, _id, filterValue) => {
        if (!filterValue || filterValue === "ALL") return true;
        return row.original.status === filterValue;
      },
    },
    {
      id: "actions",
      header: () => (
        <div className="text-right">
          <span className="sr-only">Acciones</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end pr-4">
          <OrderActions order={row.original} />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

interface PurchaseOrdersTableProps {
  orders: PurchaseOrder[];
  isLoading: boolean;
  action?: React.ReactNode;
}

export function PurchaseOrdersTable({
  orders,
  isLoading,
  action,
}: PurchaseOrdersTableProps) {
  const { formatMoney } = useCurrency();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusValue, setStatusValue] = useState<string>("");

  const columns = useMemo(() => buildColumns(formatMoney), [formatMoney]);

  const table = useReactTable({
    data: orders ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "")
        .trim()
        .toLowerCase();
      if (!q) return true;
      return [
        String(row.original.id),
        row.original.supplier.name,
        row.original.warehouse.name,
      ].some((value) => value?.toLowerCase().includes(q));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[180px] items-center justify-center py-10 text-muted-foreground">
        Cargando órdenes de compra...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <MagnifyingGlass className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar por número, proveedor o almacén"
              className="pl-9"
            />
          </div>
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
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="PENDING">Pendientes</SelectItem>
              <SelectItem value="RECEIVED">Recibidas</SelectItem>
              <SelectItem value="CANCELLED">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {action}
        </div>
      </div>

      <DataTable
        table={table}
        emptyMessage={
          orders.length === 0
            ? "Aún no hay órdenes de compra."
            : "No hay órdenes que coincidan con los filtros."
        }
      />
      <DataTablePagination
        table={table}
        pageLabel="Página"
        previousLabel="Anterior"
        nextLabel="Siguiente"
      />
    </div>
  );
}
