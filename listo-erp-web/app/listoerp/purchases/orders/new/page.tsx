"use client";

import { usePageTitle } from "@/lib/page-title-context";
import { PurchaseOrderForm } from "@/packages/purchase-orders/components/purchase-order-form";
import { useEffect } from "react";

export default function NewPurchaseOrderPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Nueva orden de compra");
  }, [setTitle]);

  return (
    <div className="w-full p-2">
      <PurchaseOrderForm />
    </div>
  );
}
