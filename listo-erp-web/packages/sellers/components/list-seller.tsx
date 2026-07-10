"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDeleteSeller } from "../api";
import type { Seller } from "../types";
import { SellerTable } from "./seller-table";

interface ListSellerProps {
  sellers: Seller[];
  onEdit: (seller: Seller) => void;
  headerAction?: React.ReactNode;
}

export function ListSeller({ sellers, onEdit, headerAction }: ListSellerProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingSellerId, setDeletingSellerId] = useState<number | null>(null);
  const [sellerToDelete, setSellerToDelete] = useState<Seller | null>(null);
  const [deleteSeller, isDeleting, deleteError] = useDeleteSeller(
    deletingSellerId || 0,
  );

  useEffect(() => {
    if (deleteError) {
      showToast({
        type: "error",
        message: (deleteError as Error).message || t("common.error"),
      });
    }
  }, [deleteError, t]);

  const handleConfirmDelete = () => {
    if (!sellerToDelete || isDeleting) return;

    setDeletingSellerId(sellerToDelete.id);
    deleteSeller(undefined, () => {
      queryClient.invalidateQueries({ queryKey: ["sellers"] });
      setDeletingSellerId(null);
      setSellerToDelete(null);
      showToast({ type: "success", message: t("sales.sellers.sellerDeleted") });
    });
  };

  return (
    <Card className="w-full">
      <CardContent>
        <SellerTable
          sellers={sellers ?? []}
          onEdit={onEdit}
          onDelete={setSellerToDelete}
          isDeleting={isDeleting}
          deletingSellerId={deletingSellerId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!sellerToDelete}
        onOpenChange={(open) => !open && setSellerToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("sales.sellers.confirmDelete")}
        description={t("sales.sellers.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingSellerId === sellerToDelete?.id}
      />
    </Card>
  );
}
