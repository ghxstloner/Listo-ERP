"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDeleteSubDepartment } from "../api";
import type { SubDepartment } from "../types";
import { SubDepartmentTable } from "./subdepartment-table";

interface ListSubDepartmentProps {
  subdepartments: SubDepartment[];
  departmentId: number;
  onEdit: (subdepartment: SubDepartment) => void;
  onViewChildren: (subdepartment: SubDepartment) => void;
  hierarchyNames?: {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  };
  headerAction?: React.ReactNode;
}

export function ListSubDepartment({
  subdepartments,
  departmentId,
  onEdit,
  onViewChildren,
  hierarchyNames: _hierarchyNames,
  headerAction,
}: ListSubDepartmentProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingSubDepartmentId, setDeletingSubDepartmentId] = useState<number | null>(null);
  const [subdepartmentToDelete, setSubdepartmentToDelete] = useState<SubDepartment | null>(null);
  const [deleteSubDepartment, isDeleting, deleteError] = useDeleteSubDepartment(
    deletingSubDepartmentId || 0
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

  const handleDeleteClick = (subdepartment: SubDepartment) => {
    setSubdepartmentToDelete(subdepartment);
  };

  const handleConfirmDelete = () => {
    if (!subdepartmentToDelete || isDeleting) return;

    setDeletingSubDepartmentId(subdepartmentToDelete.id);
    deleteSubDepartment(undefined, () => {
      queryClient.invalidateQueries({
        queryKey: ["subdepartments", departmentId],
      });
      setDeletingSubDepartmentId(null);
      setSubdepartmentToDelete(null);
      showToast({
        type: "success",
        message: t("company.subdepartments.subdepartmentDeleted"),
      });
    });
  };

  return (
    <Card className="w-full">
      <CardContent>
        <SubDepartmentTable
          subdepartments={subdepartments ?? []}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          onViewChildren={onViewChildren}
          isDeleting={isDeleting}
          deletingSubDepartmentId={deletingSubDepartmentId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!subdepartmentToDelete}
        onOpenChange={(open) => !open && setSubdepartmentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("company.subdepartments.confirmDelete")}
        description={t("company.subdepartments.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingSubDepartmentId === subdepartmentToDelete?.id}
      />
    </Card>
  );
}
