"use client";

import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useEffect, useMemo, useRef, useState } from "react";

interface BranchWarehousesTabProps {
  branchId: number;
  companyId: number;
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

  if (assignedError) {
    return (
      <p className="text-destructive text-sm">
        {t("common.error")}: {(assignedError as Error).message}
      </p>
    );
  }

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

        {isLoadingAssigned || isLoadingWarehouses ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : !assigned || assigned.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {t("company.branches.noWarehousesAssigned")}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => setAddModalOpen(true)}
              disabled={availableWarehouses.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("company.branches.addWarehouse")}
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>{t("company.warehouses.name")}</TableHead>
                  <TableHead>{t("company.warehouses.code")}</TableHead>
                  <TableHead>{t("company.warehouses.status")}</TableHead>
                  <TableHead className="w-[100px] text-right">{t("company.branches.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assigned.map((wb) => (
                  <TableRow key={wb.id}>
                    <TableCell className="font-medium">
                      {wb.warehouse?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {wb.warehouse?.code ?? "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          wb.warehouse?.isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {wb.warehouse?.isActive
                          ? t("company.warehouses.active")
                          : t("company.warehouses.inactive")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={isDeleting && deletingId === wb.id}
                        onClick={() => handleRemoveClick(wb)}
                      >
                        <Trash className="mr-1.5 h-4 w-4" />
                        {t("company.branches.removeWarehouse")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
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
