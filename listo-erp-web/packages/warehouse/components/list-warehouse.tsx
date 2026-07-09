"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDeleteWarehouse } from "../api";
import type { Warehouse } from "../types";
import { WarehouseTable } from "./warehouse-table";

interface ListWarehouseProps {
  warehouses: Warehouse[];
  companyId: number;
  onEdit: (warehouse: Warehouse) => void;
  headerAction?: React.ReactNode;
}

export function ListWarehouse({
  warehouses,
  companyId,
  onEdit,
  headerAction,
}: ListWarehouseProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingWarehouseId, setDeletingWarehouseId] = useState<number | null>(null);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);
  const [deleteWarehouse, isDeleting, deleteError] = useDeleteWarehouse(
    deletingWarehouseId || 0
  );

  useEffect(() => {
    if (deleteError) {
      showToast({
        type: "error",
        message:
          (deleteError as Error).message || t("common.error"),
      });
    }
  }, [deleteError, t]);

  const handleDeleteClick = (warehouse: Warehouse) => {
    setWarehouseToDelete(warehouse);
  };

  const handleConfirmDelete = () => {
    if (!warehouseToDelete || isDeleting) return;

    setDeletingWarehouseId(warehouseToDelete.id);
    deleteWarehouse(undefined, () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouses"],
      });
      setDeletingWarehouseId(null);
      setWarehouseToDelete(null);
      showToast({
        type: "success",
        message: t("company.warehouses.warehouseDeleted"),
      });
    });
  };

  return (
    <Card className="w-full">
      <CardContent>
        <WarehouseTable
          warehouses={warehouses ?? []}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          isDeleting={isDeleting}
          deletingWarehouseId={deletingWarehouseId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!warehouseToDelete}
        onOpenChange={(open) => !open && setWarehouseToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("company.warehouses.confirmDelete")}
        description={t("company.warehouses.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingWarehouseId === warehouseToDelete?.id}
      />
    </Card>
  );
}
