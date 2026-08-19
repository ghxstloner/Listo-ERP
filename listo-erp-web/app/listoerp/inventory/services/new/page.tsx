"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { CreateProductPage } from "@/packages/product/components/create-product-page";
import { useEffect } from "react";

export default function NewServicePage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("inventory.services.addNewService"));
  }, [setTitle, t]);

  return <CreateProductPage productType="SERVICE" />;
}
