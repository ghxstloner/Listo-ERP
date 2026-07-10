"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { encodeId } from "@/lib/hash-id";
import { Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useGetSellers } from "../api";
import type { Seller } from "../types";
import { ListSeller } from "./list-seller";
import { CreateSeller } from "./modals/create-seller";

export function SellersList() {
  const t = useTranslation();
  const router = useRouter();
  const [sellers, isLoading, error] = useGetSellers();

  const handleEdit = (seller: Seller) => {
    router.push(`/listoerp/ventas/vendedores/${encodeId(seller.id)}`);
  };

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
    <ListSeller
      sellers={sellers ?? []}
      onEdit={handleEdit}
      headerAction={<CreateSeller />}
    />
  );
}
