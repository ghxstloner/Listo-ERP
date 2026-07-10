"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDeleteCategory } from "../api";
import type { Category } from "../types";
import { CategoryTable } from "./category-table";

interface ListCategoryProps {
  categories: Category[];
  subdepartmentId: number;
  onEdit: (category: Category) => void;
  onViewChildren: (category: Category) => void;
  hierarchyNames?: {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  };
  headerAction?: React.ReactNode;
}

export function ListCategory({
  categories,
  subdepartmentId,
  onEdit,
  onViewChildren,
  hierarchyNames: _hierarchyNames,
  headerAction,
}: ListCategoryProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteCategory, isDeleting, deleteError] = useDeleteCategory(
    deletingCategoryId || 0
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

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete || isDeleting) return;

    setDeletingCategoryId(categoryToDelete.id);
    deleteCategory(undefined, () => {
      queryClient.invalidateQueries({
        queryKey: ["categories", subdepartmentId],
      });
      setDeletingCategoryId(null);
      setCategoryToDelete(null);
      showToast({
        type: "success",
        message: t("company.categories.categoryDeleted"),
      });
    });
  };

  return (
    <Card className="w-full">
      <CardContent>
        <CategoryTable
          categories={categories ?? []}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          onViewChildren={onViewChildren}
          isDeleting={isDeleting}
          deletingCategoryId={deletingCategoryId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("company.categories.confirmDelete")}
        description={t("company.categories.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingCategoryId === categoryToDelete?.id}
      />
    </Card>
  );
}
