"use client";

import { PageLoading } from "@/components/page-loading";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { encodeId } from "@/lib/hash-id";
import { useGetSuppliers } from "@/packages/suppliers/api";
import { Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { Supplier } from "../types";
import { CreateSupplier } from "./modals/create-supplier";
import { SupplierCard } from "./supplier-card";
import { ListSupplier } from "./list-supplier";

interface SuppliersListProps {
  viewMode?: "cards" | "table";
}

export function SuppliersList({ viewMode = "table" }: SuppliersListProps) {
  const t = useTranslation();
  const router = useRouter();

  const [suppliers, isLoading, error] = useGetSuppliers();

  const handleEdit = (supplier: Supplier) => {
    router.push(`/listoerp/purchases/suppliers/${encodeId(supplier.id)}`);
  };

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
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {viewMode === "cards" ? (
        !suppliers || suppliers.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[200px] items-center justify-center py-10">
              <p className="text-muted-foreground">{t("purchases.suppliers.noSuppliers")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {suppliers?.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        )
      ) : (
        <ListSupplier
          suppliers={suppliers ?? []}
          onEdit={handleEdit}
          headerAction={<CreateSupplier />}
        />
      )}
    </div>
  );
}
