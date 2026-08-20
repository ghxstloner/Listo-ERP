"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { api } from "@config";
import { Plus } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGetTaxes } from "../api";
import type { Tax } from "../types";
import { CompanyTaxTable } from "./company-tax-table";

export function CompanyTaxesConfig() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [taxes, loadingTaxes, taxesError] = useGetTaxes();
  const [taxToDelete, setTaxToDelete] = useState<Tax | null>(null);

  const deleteTax = useMutation({
    mutationFn: (taxId: number) =>
      api.delete<{ success: boolean }>(`taxes/${taxId}`),
  });

  const handleConfirmDelete = () => {
    if (!taxToDelete) return;
    deleteTax.mutate(taxToDelete.id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["taxes"] });
        showToast({
          type: "success",
          message: "Impuesto eliminado correctamente.",
        });
        setTaxToDelete(null);
      },
      onError: (err) => {
        showToast({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "No se pudo eliminar el impuesto.",
        });
      },
    });
  };

  if (taxesError) {
    return (
      <Card>
        <CardContent className="py-8 text-destructive">
          No se pudieron cargar los impuestos: {taxesError.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impuestos</CardTitle>
        <CardDescription>
          Gestiona los impuestos que la empresa puede asignar a sus productos y
          servicios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CompanyTaxTable
          taxes={taxes ?? []}
          loading={loadingTaxes}
          onEdit={(tax) => router.push(`/listoerp/company/taxes/${tax.id}`)}
          onDelete={(tax) => setTaxToDelete(tax)}
          isDeleting={deleteTax.isPending}
          deletingTaxId={deleteTax.variables ?? null}
          action={
            <Button
              size="sm"
              onClick={() => router.push("/listoerp/company/taxes/new")}
            >
              <Plus className="mr-2 size-4" />
              Nuevo impuesto
            </Button>
          }
        />
      </CardContent>
      <ConfirmDialog
        open={!!taxToDelete}
        onOpenChange={(open) => !open && setTaxToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar impuesto"
        description={`¿Estás seguro de que deseas eliminar el impuesto "${taxToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        severity="destructive"
        isLoading={deleteTax.isPending}
      />
    </Card>
  );
}
