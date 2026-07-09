"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { SuppliersList } from "@/packages/suppliers/components/suppliers-list";
import { useEffect } from "react";

export default function PurchasesPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("purchases.suppliers.title"));
  }, [setTitle, t]);

  return (
    <div className="w-full p-2 space-y-4">
      <SuppliersList viewMode="table" />
    </div>
  );
}
