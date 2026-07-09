"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDeleteProduct } from "../api";
import type { Product } from "../types";
import { ProductTable } from "./product-table";

interface ListProductProps {
  products: Product[];
  onEdit: (product: Product) => void;
  headerAction?: React.ReactNode;
}

export function ListProduct({
  products,
  onEdit,
  headerAction,
}: ListProductProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteProduct, isDeleting, deleteError] = useDeleteProduct(
    deletingProductId || 0
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

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = () => {
    if (!productToDelete || isDeleting) return;

    setDeletingProductId(productToDelete.id);
    deleteProduct(undefined, () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      setDeletingProductId(null);
      setProductToDelete(null);
      showToast({
        type: "success",
        message: t("inventory.products.productDeleted"),
      });
    });
  };

  return (
    <Card className="w-full">
      <CardContent>
        <ProductTable
          products={products ?? []}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          isDeleting={isDeleting}
          deletingProductId={deletingProductId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("inventory.products.confirmDelete")}
        description={t("inventory.products.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingProductId === productToDelete?.id}
      />
    </Card>
  );
}
