"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { useGetWarehouses } from "@/packages/warehouse/api";
import { ListWarehouse } from "@/packages/warehouse/components/list-warehouse";
import { CreateWarehouse } from "@/packages/warehouse/components/modals/create-warehouse";
import { EditWarehouse } from "@/packages/warehouse/components/modals/edit-warehouse";
import type { Warehouse } from "@/packages/warehouse/types";
import { Spinner } from "@phosphor-icons/react";
import { useState } from "react";

interface CompanyWarehousesConfigProps {
  companyId: number;
}

export function CompanyWarehousesConfig({ companyId }: CompanyWarehousesConfigProps) {
  const t = useTranslation();
  const [warehouses, isLoading, error] = useGetWarehouses();
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  if (isLoading) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">
          {t("common.error")}: {error.message}
        </p>
      </div>
    );
  }

  const companyWarehouses =
    warehouses?.filter((w) => w.companyId === companyId) ?? warehouses ?? [];

  return (
    <>
      <ListWarehouse
        warehouses={companyWarehouses}
        companyId={companyId}
        onEdit={setEditingWarehouse}
        headerAction={<CreateWarehouse companyId={companyId} />}
      />
      <EditWarehouse
        key={editingWarehouse?.id ?? "closed"}
        editingWarehouse={editingWarehouse}
        companyId={companyId}
        onClose={() => setEditingWarehouse(null)}
      />
    </>
  );
}
