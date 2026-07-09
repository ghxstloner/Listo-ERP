"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDeleteDepartment } from "../api";
import type { HierarchyNames } from "@/packages/company/hooks/use-hierarchy-names";
import type { Department } from "../types";
import { DepartmentTable } from "./department-table";

interface ListDepartmentProps {
  departments: Department[];
  companyId: number;
  onEdit: (department: Department) => void;
  onViewChildren: (department: Department) => void;
  hierarchyNames: HierarchyNames;
  headerAction?: React.ReactNode;
}

export function ListDepartment({
  departments,
  companyId,
  onEdit,
  onViewChildren,
  hierarchyNames,
  headerAction,
}: ListDepartmentProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<number | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [deleteDepartment, isDeleting, deleteError] = useDeleteDepartment(
    deletingDepartmentId || 0
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

  const handleDeleteClick = (department: Department) => {
    setDepartmentToDelete(department);
  };

  const handleConfirmDelete = () => {
    if (!departmentToDelete || isDeleting) return;

    setDeletingDepartmentId(departmentToDelete.id);
    deleteDepartment(undefined, () => {
      queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
      setDeletingDepartmentId(null);
      setDepartmentToDelete(null);
      showToast({
        type: "success",
        message: `${hierarchyNames.level1} eliminado exitosamente`,
      });
    });
  };

  return (
    <Card className="w-full">
      <CardContent>
        <DepartmentTable
          departments={departments ?? []}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          onViewChildren={onViewChildren}
          isDeleting={isDeleting}
          deletingDepartmentId={deletingDepartmentId}
          t={t}
          action={headerAction}
          hierarchyNames={hierarchyNames}
        />
      </CardContent>
      <ConfirmDialog
        open={!!departmentToDelete}
        onOpenChange={(open) => !open && setDepartmentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("company.departments.confirmDelete")}
        description={t("company.departments.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingDepartmentId === departmentToDelete?.id}
      />
    </Card>
  );
}
