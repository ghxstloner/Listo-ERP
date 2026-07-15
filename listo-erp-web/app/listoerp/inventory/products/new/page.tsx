"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { CreateProductPage } from "@/packages/product/components/create-product-page";
import { useEffect } from "react";

export default function NewProductPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("inventory.products.addNewProduct"));
  }, [setTitle, t]);

  return <CreateProductPage />;
}
