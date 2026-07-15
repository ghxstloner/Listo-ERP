"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { encodeId } from "@/lib/hash-id";
import { usePageTitle } from "@/lib/page-title-context";
import { ListProduct } from "@/packages/product/components/list-product";
import { useGetProducts } from "@/packages/product/api";
import { Plus, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProductsPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const router = useRouter();
  const [response, isLoading, error] = useGetProducts();

  useEffect(() => {
    setTitle(t("inventory.products.title"));
  }, [setTitle, t]);

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
        onEdit={(product) => router.push(`/listoerp/inventory/products/${encodeId(product.id)}`)}
        headerAction={
          <Button size="sm" asChild>
            <Link href="/listoerp/inventory/products/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("inventory.products.addNewProduct")}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
