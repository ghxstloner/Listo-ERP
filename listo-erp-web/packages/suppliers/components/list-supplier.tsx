"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDeleteSupplier } from "../api";
import type { Supplier } from "../types";
import { SupplierTable } from "./supplier-table";

interface ListSupplierProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  headerAction?: React.ReactNode;
}

export function ListSupplier({
  suppliers,
  onEdit,
  headerAction,
}: ListSupplierProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingSupplierId, setDeletingSupplierId] = useState<number | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [deleteSupplier, isDeleting, deleteError] = useDeleteSupplier(
    deletingSupplierId || 0
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

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const handleConfirmDelete = () => {
    if (!supplierToDelete || isDeleting) return;

    setDeletingSupplierId(supplierToDelete.id);
    deleteSupplier(undefined, () => {
      queryClient.invalidateQueries({
        queryKey: ["suppliers"],
      });
      setDeletingSupplierId(null);
      setSupplierToDelete(null);
      showToast({
        type: "success",
        message: t("purchases.suppliers.supplierDeleted"),
      });
    });
  };

  return (
    <Card className="w-full">
      <CardContent>
        <SupplierTable
          suppliers={suppliers ?? []}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          isDeleting={isDeleting}
          deletingSupplierId={deletingSupplierId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!supplierToDelete}
        onOpenChange={(open) => !open && setSupplierToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("purchases.suppliers.confirmDelete")}
        description={t("purchases.suppliers.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingSupplierId === supplierToDelete?.id}
      />
    </Card>
  );
}
