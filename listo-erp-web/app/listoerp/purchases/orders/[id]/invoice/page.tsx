"use client";

import { usePageTitle } from "@/lib/page-title-context";
import { PurchaseOrderInvoiceForm } from "@/packages/purchase-invoices/components/purchase-order-invoice-form";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function PurchaseOrderInvoicePage() {
  const { setTitle } = usePageTitle();
  const params = useParams();
  const orderId = Number(params.id);

  useEffect(() => {
    setTitle(`Aprobar orden de compra #${orderId}`);
  }, [orderId, setTitle]);

  return (
    <div className="w-full p-2">
      <PurchaseOrderInvoiceForm orderId={orderId} />
    </div>
  );
}
