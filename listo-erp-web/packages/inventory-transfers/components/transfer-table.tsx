"use client";
import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type Column,
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DotsThreeVertical } from "@phosphor-icons/react";
import { ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type InventoryTransferListItem, type TransferStatus } from "../api";

function statusClass(status: TransferStatus) {
  return status === "RECEIVED"
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : "bg-muted text-muted-foreground";
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<InventoryTransferListItem, unknown>;
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

function TransferActions({ transferId }: { transferId: number }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="size-8 p-0">
          <DotsThreeVertical className="size-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            router.push(`/listoerp/inventory/warehouse-transfers/${transferId}`)
          }
        >
          Ver detalle
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildColumns(): ColumnDef<InventoryTransferListItem>[] {
  return [
    {
      id: "documentNumber",
      header: ({ column }) => (
        <SortableHeader column={column}>Comprobante</SortableHeader>
      ),
      accessorFn: (row) => row.documentNumber ?? `TRF-${row.id}`,
      cell: ({ row }) => (
        <div className="font-semibold text-primary">
          {row.original.documentNumber || `TRF-${row.original.id}`}
        </div>
      ),
    },
    {
      id: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Fecha</SortableHeader>
      ),
      accessorFn: (row) => row.createdAt,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: "sourceWarehouse",
      header: ({ column }) => (
        <SortableHeader column={column}>Almacén origen</SortableHeader>
      ),
      accessorFn: (row) => row.sourceWarehouse.name,
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.sourceWarehouse.name}
          <div className="text-muted-foreground text-xs">
            {row.original.sourceWarehouse.code}
          </div>
        </div>
      ),
    },
    {
      id: "destinationWarehouse",
      header: ({ column }) => (
        <SortableHeader column={column}>Almacén destino</SortableHeader>
      ),
      accessorFn: (row) => row.destinationWarehouse.name,
      cell: ({ row }) => (
        <div>
          {row.original.destinationWarehouse.name}
          <div className="text-muted-foreground text-xs">
            {row.original.destinationWarehouse.code}
          </div>
        </div>
      ),
    },
    {
      id: "user",
      header: ({ column }) => (
        <SortableHeader column={column}>Usuario</SortableHeader>
      ),
      accessorFn: (row) => row.createdByUser?.name ?? "-",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.createdByUser?.name ?? "-"}
        </div>
      ),
    },
    {
      id: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>Estado</SortableHeader>
      ),
      accessorFn: (row) => row.status.label,
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(row.original.status.code)}`}
        >
          {row.original.status.label}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <TransferActions transferId={row.original.id} />
        </div>
      ),
      enableSorting: false,
    },
  ];
}

export function TransferTable({
  transfers,
}: {
  transfers: InventoryTransferListItem[];
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo(() => buildColumns(), []);

  const table = useReactTable({
    data: transfers ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <DataTable table={table} emptyMessage="No hay transferencias registradas." />
      <DataTablePagination table={table} pageLabel="Página" previousLabel="Anterior" nextLabel="Siguiente" />
    </>
  );
}
