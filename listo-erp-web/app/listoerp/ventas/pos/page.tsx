"use client";

import { PointOfSale } from "@/packages/pos/components/point-of-sale";
import { usePageTitle } from "@/lib/page-title-context";
import { useEffect } from "react";

export default function PosPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Punto de Venta");
  }, [setTitle]);

  return <PointOfSale />;
}
