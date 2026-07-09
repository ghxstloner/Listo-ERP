"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDeleteBranch } from "../api";
import type { Branch } from "../types";
import { BranchTable } from "./branch-table";

interface ListBranchProps {
  branches: Branch[];
  companyId: number;
  onEdit: (branch: Branch) => void;
  headerAction?: React.ReactNode;
}

export function ListBranch({
  branches,
  companyId,
  onEdit,
  headerAction,
}: ListBranchProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingBranchId, setDeletingBranchId] = useState<number | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [deleteBranch, isDeleting, deleteError] = useDeleteBranch(
    deletingBranchId || 0
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

  const handleDeleteClick = (branch: Branch) => {
    setBranchToDelete(branch);
  };

  const handleConfirmDelete = () => {
    if (!branchToDelete || isDeleting) return;

    setDeletingBranchId(branchToDelete.id);
    deleteBranch(undefined, () => {
      queryClient.invalidateQueries({
        queryKey: ["branches", "company", companyId],
      });
      setDeletingBranchId(null);
      setBranchToDelete(null);
      showToast({
        type: "success",
        message: t("company.branches.branchDeleted"),
      });
    });
  };

  return (
    <Card className="w-full p-0">
      <CardContent className="p-4">
        <BranchTable
          branches={branches ?? []}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          isDeleting={isDeleting}
          deletingBranchId={deletingBranchId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!branchToDelete}
        onOpenChange={(open) => !open && setBranchToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("company.branches.confirmDelete")}
        description={t("company.branches.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingBranchId === branchToDelete?.id}
      />
    </Card>
  );
}
