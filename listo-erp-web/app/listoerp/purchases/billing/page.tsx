"use client";

import { useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { PurchaseInvoicesPage } from "@/packages/purchase-invoices/components/purchase-invoices-page";

export default function PurchaseBillingPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("navigation.supplierBilling"));
  }, [setTitle, t]);

  return <div className="w-full p-2"><PurchaseInvoicesPage /></div>;
}
