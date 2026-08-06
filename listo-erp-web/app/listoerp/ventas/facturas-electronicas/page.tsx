"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { ElectronicInvoicesList } from "@/packages/electronic-invoices/components/electronic-invoices-list";
import { useEffect } from "react";

export default function ElectronicInvoicesPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("sales.electronicInvoices.title"));
  }, [setTitle, t]);

  return (
    <div className="w-full space-y-4 p-2">
      <ElectronicInvoicesList />
    </div>
  );
}
