"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { OrderForm } from "@/packages/orders/components/order-form";
import { useEffect } from "react";

export default function NewOrderPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("sales.orders.newOrder"));
  }, [setTitle, t]);

  return (
    <div className="w-full p-2">
      <OrderForm />
    </div>
  );
}
