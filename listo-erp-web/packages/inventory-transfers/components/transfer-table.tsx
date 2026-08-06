"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useQueryClient } from "@tanstack/react-query";
import {
  type Column,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DotsThreeVertical } from "@phosphor-icons/react";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useDispatchTransfer,
  useReceiveTransfer,
  type InventoryTransfer,
  type TransferStatus,
} from "../api";

function statusClass(status: TransferStatus) {
  return status === "RECEIVED"
    ? "bg-emerald-500/10 text-emerald-700"
    : status === "IN_TRANSIT"
      ? "bg-amber-500/10 text-amber-700"
      : "bg-muted text-muted-foreground";
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<InventoryTransfer, unknown>;
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

function TransferAction({ transfer }: { transfer: InventoryTransfer }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [dispatch, dispatching] = useDispatchTransfer(transfer.id);
  const [receive, receiving] = useReceiveTransfer(transfer.id);
  const receivingMode = transfer.status.code === "IN_TRANSIT";
  const execute = () => {
    const mutation = receivingMode ? receive : dispatch;
    mutation(undefined, () => {
      qc.invalidateQueries({ queryKey: ["inventory-transfers"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setConfirm(false);
      showToast({
        type: "success",
        message: receivingMode
          ? "Transferencia recibida en el almacén destino."
          : "Transferencia despachada.",
      });
    });
  };
  if (
    transfer.status.code !== "PENDING" &&
    transfer.status.code !== "IN_TRANSIT"
  )
    return null;
  const loading = dispatching || receiving;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            disabled={loading}
          >
            <DotsThreeVertical className="size-4" />
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setConfirm(true)}>
            {receivingMode ? "Recibir" : "Despachar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        onConfirm={execute}
        title={
          receivingMode
            ? "¿Recibir transferencia?"
            : "¿Despachar transferencia?"
        }
        description={
          receivingMode
            ? "La mercancía se agregará al inventario del almacén destino."
            : "La mercancía se descontará del inventario del almacén."
        }
        confirmText={receivingMode ? "Recibir" : "Despachar"}
        cancelText="Cancelar"
        isLoading={loading}
      />
    </>
  );
}

function buildColumns(): ColumnDef<InventoryTransfer>[] {
  return [
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
      id: "products",
      header: ({ column }) => (
        <SortableHeader column={column}>Productos</SortableHeader>
      ),
      accessorFn: (row) =>
        row.items.map((item) => `${item.product.sku} x${item.quantity}`).join(", "),
      cell: ({ row }) =>
        row.original.items
          .map((item) => `${item.product.sku} x${item.quantity}`)
          .join(", "),
    },
    {
      id: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>Estado</SortableHeader>
      ),
      accessorFn: (row) => row.status.label,
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass(row.original.status.code)}`}
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
          <TransferAction transfer={row.original} />
        </div>
      ),
      enableSorting: false,
    },
  ];
}

export function TransferTable({
  transfers,
}: {
  transfers: InventoryTransfer[];
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

  if (transfers.length === 0)
    return (
      <div className="flex min-h-[180px] items-center justify-center py-10 text-muted-foreground">
        No hay transferencias registradas.
      </div>
    );

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/40">
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-sm">
          Página {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </>
  );
}
