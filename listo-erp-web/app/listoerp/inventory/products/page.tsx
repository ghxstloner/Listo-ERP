"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { CreateProduct } from "@/packages/product/components/modals/create-product";
import { EditProduct } from "@/packages/product/components/modals/edit-product";
import { ListProduct } from "@/packages/product/components/list-product";
import { useGetProducts } from "@/packages/product/api";
import type { Product } from "@/packages/product/types";
import { Spinner } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export default function ProductsPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const [response, isLoading, error] = useGetProducts();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    setTitle(t("inventory.products.title"));
  }, [setTitle, t]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const products = Array.isArray(response) ? response : response?.data ?? [];

  if (isLoading) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <ListProduct
        products={products}
        onEdit={handleEdit}
        headerAction={<CreateProduct />}
      />
      <EditProduct
        editingProduct={editingProduct}
        onClose={() => setEditingProduct(null)}
      />
    </div>
  );
}
