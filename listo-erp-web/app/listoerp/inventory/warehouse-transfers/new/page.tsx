"use client";

import { usePageTitle } from "@/lib/page-title-context";
import { TransferRegisterPage } from "@/packages/inventory-transfers/components/transfer-register-page";
import { useEffect } from "react";

export default function NewWarehouseTransferPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Registro de transferencia");
  }, [setTitle]);

  return (
    <div className="w-full p-2">
      <TransferRegisterPage />
    </div>
  );
}
