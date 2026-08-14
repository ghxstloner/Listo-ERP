"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@phosphor-icons/react";
import { useGetInventoryBalances, useGetInventoryMovements } from "../api";
import { CreateInventoryEntryDialog } from "./create-inventory-entry-dialog";
import { InventoryControlContent } from "./inventory-control-content";

export function InventoryControlList() {
  const t = useTranslation();
  const [balances, loadingBalances, balancesError] = useGetInventoryBalances();
  const [movements, loadingMovements, movementsError] = useGetInventoryMovements();

  if (loadingBalances || loadingMovements) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  if (balancesError || movementsError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}: {(balancesError || movementsError)?.message}
        </p>
      </div>
    );
  }

  return (
    <InventoryControlContent
      balances={balances ?? []}
      movements={movements ?? []}
      headerAction={<CreateInventoryEntryDialog />}
    />
  );
}
