"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { CustomersList } from "@/packages/customers/components/customers-list";
import { useEffect } from "react";

export default function CustomersPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("sales.customers.title"));
  }, [setTitle, t]);

  return (
    <div className="w-full p-2 space-y-4">
      <CustomersList />
    </div>
  );
}
