"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useDeleteCompanyUser } from "../api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { CompanyUserWithUser } from "../types";
import { CompanyUserTable } from "./company-user-table";

interface ListCompanyUserProps {
  users: CompanyUserWithUser[];
  companyId: number;
  onEdit: (user: CompanyUserWithUser) => void;
  headerAction?: React.ReactNode;
}

export function ListCompanyUser({ users, companyId, onEdit, headerAction }: ListCompanyUserProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<CompanyUserWithUser | null>(null);
  const [deleteCompanyUser, isDeleting] = useDeleteCompanyUser(
    deletingUserId || 0
  );

  const handleDeleteClick = (user: CompanyUserWithUser) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete || isDeleting) return;
    
    setDeletingUserId(userToDelete.id);
    deleteCompanyUser(undefined, () => {
      queryClient.invalidateQueries({
        queryKey: ["companies-users", "company", companyId],
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeletingUserId(null);
      setUserToDelete(null);
      showToast({
        type: "success",
        message: t("company.users.userDeleted"),
      });
    });
  };

  return (
    <Card className="w-full">
      <CardContent>
        <CompanyUserTable
          users={users ?? []}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          isDeleting={isDeleting}
          deletingUserId={deletingUserId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("company.users.confirmDelete")}
        description={t("company.users.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingUserId === userToDelete?.id}
      />
    </Card>
  );
}
