"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { useGetSales } from "@/packages/pos/api";
import type { ElectronicInvoiceStatus } from "@/packages/pos/types";
import { Spinner } from "@phosphor-icons/react";
import type { ElectronicInvoiceListItem } from "../types";
import { ListElectronicInvoice } from "./list-electronic-invoice";

export function ElectronicInvoicesList() {
  const t = useTranslation();
  const [sales, isLoading, error] = useGetSales({
    status: "all" as ElectronicInvoiceStatus | "all",
  });

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
    <ListElectronicInvoice
      invoices={(sales ?? []) as ElectronicInvoiceListItem[]}
    />
  );
}
