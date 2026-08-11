"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { OrderForm } from "@/packages/orders/components/order-form";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function EditOrderPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const params = useParams();
  const orderId = Number(params.id);

  useEffect(() => {
    setTitle(`${t("sales.orders.editOrder")} #${orderId}`);
  }, [setTitle, t, orderId]);

  return (
    <div className="w-full p-2">
      <OrderForm orderId={orderId} />
    </div>
  );
}
