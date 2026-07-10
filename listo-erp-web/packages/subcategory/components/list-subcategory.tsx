"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDeleteSubCategory } from "../api";
import type { SubCategory } from "../types";
import { SubCategoryTable } from "./subcategory-table";

interface ListSubCategoryProps {
  subcategories: SubCategory[];
  categoryId: number;
  onEdit: (subcategory: SubCategory) => void;
  hierarchyNames?: {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  };
  headerAction?: React.ReactNode;
}

export function ListSubCategory({
  subcategories,
  categoryId,
  onEdit,
  hierarchyNames: _hierarchyNames,
  headerAction,
}: ListSubCategoryProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingSubCategoryId, setDeletingSubCategoryId] = useState<number | null>(null);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<SubCategory | null>(null);
  const [deleteSubCategory, isDeleting, deleteError] = useDeleteSubCategory(
    deletingSubCategoryId || 0
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

  const handleDeleteClick = (subcategory: SubCategory) => {
    setSubcategoryToDelete(subcategory);
  };

  const handleConfirmDelete = () => {
    if (!subcategoryToDelete || isDeleting) return;

    setDeletingSubCategoryId(subcategoryToDelete.id);
    deleteSubCategory(undefined, () => {
      queryClient.invalidateQueries({
        queryKey: ["subcategories", categoryId],
      });
      setDeletingSubCategoryId(null);
      setSubcategoryToDelete(null);
      showToast({
        type: "success",
        message: t("company.subcategories.subcategoryDeleted"),
      });
    });
  };

  return (
    <Card className="w-full">
      <CardContent>
        <SubCategoryTable
          subcategories={subcategories ?? []}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          isDeleting={isDeleting}
          deletingSubCategoryId={deletingSubCategoryId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!subcategoryToDelete}
        onOpenChange={(open) => !open && setSubcategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("company.subcategories.confirmDelete")}
        description={t("company.subcategories.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingSubCategoryId === subcategoryToDelete?.id}
      />
    </Card>
  );
}
