"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { OrdersList } from "@/packages/orders/components/orders-list";
import { useEffect } from "react";

export default function OrdersPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("sales.orders.title"));
  }, [setTitle, t]);

  return (
    <div className="w-full space-y-4 p-2">
      <OrdersList />
    </div>
  );
}
