"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { encodeId } from "@/lib/hash-id";
import { usePageTitle } from "@/lib/page-title-context";
import { useGetProducts } from "@/packages/product/api";
import { ListProduct } from "@/packages/product/components/list-product";
import { Plus, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ServicesPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const router = useRouter();
  const [response, isLoading, error] = useGetProducts({ productType: "SERVICE" });

  useEffect(() => {
    setTitle(t("inventory.services.title"));
  }, [setTitle, t]);

  const services = Array.isArray(response) ? response : response?.data ?? [];

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
        products={services}
        onEdit={(service) =>
          router.push(`/listoerp/inventory/services/${encodeId(service.id)}`)
        }
        headerAction={
          <Button size="sm" asChild>
            <Link href="/listoerp/inventory/services/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("inventory.services.addNewService")}
            </Link>
          </Button>
        }
        searchPlaceholder={t("inventory.services.searchServices")}
        emptyMessage={t("inventory.services.noServices")}
        confirmDeleteTitle={t("inventory.services.confirmDelete")}
        confirmDeleteMessage={t("inventory.services.confirmDeleteMessage")}
        deletedMessage={t("inventory.services.serviceDeleted")}
      />
    </div>
  );
}
