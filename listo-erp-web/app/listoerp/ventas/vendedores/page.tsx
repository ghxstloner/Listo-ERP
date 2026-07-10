"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { SellersList } from "@/packages/sellers/components/sellers-list";
import { useEffect } from "react";

export default function SellersPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("sales.sellers.title"));
  }, [setTitle, t]);

  return (
    <div className="w-full p-2">
      <SellersList />
    </div>
  );
}
