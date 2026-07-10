"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDeleteCustomer } from "../api";
import type { Customer } from "../types";
import { CustomerTable } from "./customer-table";

interface ListCustomerProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  headerAction?: React.ReactNode;
}

export function ListCustomer({ customers, onEdit, headerAction }: ListCustomerProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteCustomer, isDeleting, deleteError] = useDeleteCustomer(deletingCustomerId || 0);

  useEffect(() => {
    if (deleteError) {
      showToast({
        type: "error",
        message: (deleteError as Error).message || t("common.error"),
      });
    }
  }, [deleteError, t]);

  const handleConfirmDelete = () => {
    if (!customerToDelete || isDeleting) return;

    setDeletingCustomerId(customerToDelete.id);
    deleteCustomer(undefined, () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDeletingCustomerId(null);
      setCustomerToDelete(null);
      showToast({
        type: "success",
        message: t("sales.customers.customerDeleted"),
      });
    });
  };

  return (
    <Card className="w-full">
      <CardContent>
        <CustomerTable
          customers={customers ?? []}
          onEdit={onEdit}
          onDelete={setCustomerToDelete}
          isDeleting={isDeleting}
          deletingCustomerId={deletingCustomerId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!customerToDelete}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("sales.customers.confirmDelete")}
        description={t("sales.customers.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingCustomerId === customerToDelete?.id}
      />
    </Card>
  );
}
