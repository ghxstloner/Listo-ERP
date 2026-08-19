"use client";

import { ProductDetailPage } from "@/app/listoerp/inventory/products/[productId]/page";
import { use } from "react";

export default function ServiceDetailRoute({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = use(params);
  return <ProductDetailPage productId={serviceId} productType="SERVICE" />;
}
