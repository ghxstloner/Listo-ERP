"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { CurrencyManagement } from "@/packages/currency/components/currency-management";
import { useEffect } from "react";

export default function CurrenciesPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("administration.currencies.title"));
  }, [setTitle, t]);

  return (
    <div className="w-full p-2">
      <CurrencyManagement />
    </div>
  );
}
