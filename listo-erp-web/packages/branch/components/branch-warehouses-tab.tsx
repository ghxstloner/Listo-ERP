"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import {
  useCreateWarehouseBranch,
  useDeleteWarehouseBranch,
  useGetWarehouseBranchesByBranch,
} from "@/packages/warehouse-branch/api";
import type { WarehouseBranchWithWarehouse } from "@/packages/warehouse-branch/types";
import { useGetWarehouses } from "@/packages/warehouse/api";
import { Plus, Spinner, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { type Column, type ColumnDef, getCoreRowModel, getPaginationRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface BranchWarehousesTabProps {
  branchId: number;
  companyId: number;
}

function SortableHeader({ column, children }: { column: Column<WarehouseBranchWithWarehouse, unknown>; children: React.ReactNode }) {
  return <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={column.getToggleSortingHandler()}>{children}<ArrowUpDown className="ml-2 h-4 w-4" /></Button>;
}

export function BranchWarehousesTab({ branchId, companyId }: BranchWarehousesTabProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [assigned, isLoadingAssigned, assignedError] = useGetWarehouseBranchesByBranch(branchId);
  const [warehouses, isLoadingWarehouses] = useGetWarehouses();
  const [createLink, isAdding] = useCreateWarehouseBranch();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLink, isDeleting] = useDeleteWarehouseBranch(deletingId ?? 0);
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleRemoveClick = (wb: WarehouseBranchWithWarehouse) => {
    if (isDeleting) return;
    setDeletingId(wb.id);
  };

  const companyWarehouses = useMemo(
    () => warehouses?.filter((w) => w.companyId === companyId) ?? [],
    [warehouses, companyId]
  );

  const assignedWarehouseIds = useMemo(
    () => new Set((assigned ?? []).map((wb) => wb.warehouse.id)),
    [assigned]
  );

  const availableWarehouses = useMemo(
    () => companyWarehouses.filter((w) => !assignedWarehouseIds.has(w.id)),
    [companyWarehouses, assignedWarehouseIds]
  );

  const handleAddWarehouse = () => {
    const warehouseId = selectedWarehouseId ? Number(selectedWarehouseId) : null;
    if (!warehouseId || isAdding) return;
    createLink(
      { branchId, warehouseId },
      () => {
        queryClient.invalidateQueries({
          queryKey: ["warehouse-branches", "by-branch", branchId],
        });
        setAddModalOpen(false);
        setSelectedWarehouseId("");
        showToast({
          type: "success",
          message: t("company.branches.warehouseAddedToBranch"),
        });
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) setSelectedWarehouseId("");
    setAddModalOpen(open);
  };

  const deletingIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (deletingId === null || deletingIdRef.current === deletingId) return;
    deletingIdRef.current = deletingId;
    deleteLink(undefined, () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouse-branches", "by-branch", branchId],
      });
      setDeletingId(null);
      deletingIdRef.current = null;
      showToast({
        type: "success",
        message: t("company.branches.warehouseRemovedFromBranch"),
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deleteLink is stable per deletingId
  }, [deletingId]);

  const columns = useMemo<ColumnDef<WarehouseBranchWithWarehouse>[]>(() => [
    { id: "name", accessorFn: (row) => row.warehouse?.name ?? "", header: ({ column }) => <SortableHeader column={column}>{t("company.warehouses.name")}</SortableHeader>, cell: ({ row }) => <span className="font-medium">{row.original.warehouse?.name ?? "-"}</span> },
    { id: "code", accessorFn: (row) => row.warehouse?.code ?? "", header: ({ column }) => <SortableHeader column={column}>{t("company.warehouses.code")}</SortableHeader>, cell: ({ row }) => <span className="text-muted-foreground">{row.original.warehouse?.code ?? "-"}</span> },
    { id: "status", accessorFn: (row) => row.warehouse?.isActive ? "ACTIVE" : "INACTIVE", header: ({ column }) => <SortableHeader column={column}>{t("company.warehouses.status")}</SortableHeader>, cell: ({ row }) => <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${row.original.warehouse?.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{row.original.warehouse?.isActive ? t("company.warehouses.active") : t("company.warehouses.inactive")}</span> },
    { id: "actions", header: () => <div className="text-right">{t("company.branches.actions")}</div>, cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={isDeleting && deletingId === row.original.id} onClick={() => handleRemoveClick(row.original)}><Trash className="mr-1.5 h-4 w-4" />{t("company.branches.removeWarehouse")}</Button></div>, enableSorting: false },
  ], [deletingId, isDeleting, t]);
  const table = useReactTable({ data: assigned ?? [], columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } } });

  return (
    <>
      <div className="space-y-6 rounded-lg border bg-card p-4">
        <div className="space-y-3">
          <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddModalOpen(true)}
            disabled={isLoadingAssigned || isLoadingWarehouses || availableWarehouses.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("company.branches.addWarehouse")}
          </Button>
        </div>

        <DataTable
          table={table}
          loading={isLoadingAssigned || isLoadingWarehouses}
          loadingMessage={<span className="inline-flex items-center gap-2"><Spinner size={20} className="animate-spin" />Cargando almacenes...</span>}
          error={assignedError ? <>{t("common.error")}: {(assignedError as Error).message}</> : undefined}
          emptyMessage={<><p className="text-muted-foreground text-sm">{t("company.branches.noWarehousesAssigned")}</p><Button size="sm" variant="outline" className="mt-3" onClick={() => setAddModalOpen(true)} disabled={availableWarehouses.length === 0}><Plus className="mr-2 h-4 w-4" />{t("company.branches.addWarehouse")}</Button></>}
        />
        <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} />
        </div>
      </div>

      <Dialog open={addModalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("company.branches.addWarehouse")}</DialogTitle>
            <DialogDescription>
              {t("company.branches.selectWarehouseToAdd")}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-3 px-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse-select">{t("company.warehouses.name")}</Label>
              <Select
                value={selectedWarehouseId}
                onValueChange={setSelectedWarehouseId}
                disabled={isAdding || availableWarehouses.length === 0}
              >
                <SelectTrigger id="warehouse-select" className="w-full">
                  <SelectValue placeholder={t("company.branches.selectWarehouseToAdd")} />
                </SelectTrigger>
                <SelectContent>
                  {availableWarehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableWarehouses.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  {t("company.warehouses.noWarehouses")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="p-4">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isAdding}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAddWarehouse}
              disabled={!selectedWarehouseId || isAdding}
            >
              {isAdding ? t("common.saving") : t("company.branches.addWarehouse")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
