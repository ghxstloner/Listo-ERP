"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/lib/page-title-context";
import { PurchaseOrdersPage } from "@/packages/purchase-orders/components/purchase-orders-page";

export default function PurchaseOrdersRoute() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Órdenes de compra");
  }, [setTitle]);

  return (
    <div className="w-full p-2">
      <PurchaseOrdersPage />
    </div>
  );
}
