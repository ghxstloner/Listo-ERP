"use client";

import { usePageTitle } from "@/lib/page-title-context";
import { TransferDetailPage } from "@/packages/inventory-transfers/components/transfer-detail-page";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function WarehouseTransferDetailPage() {
  const { setTitle } = usePageTitle();
  const params = useParams();
  const transferId = Number(params.id);

  useEffect(() => {
    setTitle("Detalle de transferencia");
  }, [setTitle]);

  return (
    <div className="w-full p-2">
      <TransferDetailPage id={transferId} />
    </div>
  );
}
