"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { decodeId } from "@/lib/hash-id";
import { usePageTitle } from "@/lib/page-title-context";
import { useGetSeller } from "@/packages/sellers/api";
import { SellerConfigForm } from "@/packages/sellers/components/seller-config-form";
import { ArrowLeft, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function SellerEditPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const params = useParams();
  const hash = params.id as string;
  const sellerId = hash ? decodeId(hash) : null;
  const [seller, isLoading, error] = useGetSeller(sellerId ?? 0);

  useEffect(() => {
    if (seller) {
      setTitle(seller.name);
    }
  }, [setTitle, seller]);

  if (hash === undefined || sellerId === null) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          {t("sales.sellers.sellerNotFound")}
        </p>
        <Button variant="outline" asChild>
          <Link href="/listoerp/ventas/vendedores">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("sales.sellers.title")}
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  if (error || !seller) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">
          {t("common.error")}:{" "}
          {(error as Error)?.message ?? t("sales.sellers.sellerNotFound")}
        </p>
        <Button variant="outline" asChild>
          <Link href="/listoerp/ventas/vendedores">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("sales.sellers.title")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <Tabs defaultValue="general" className="w-full">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/listoerp/ventas/vendedores"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("sales.sellers.title")}
            </Link>
          </Button>
          <TabsList>
            <TabsTrigger value="general">
              {t("company.generalConfiguration")}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="general" className="mt-2 w-full">
          <SellerConfigForm
            key={seller.id}
            seller={seller}
            sellerId={sellerId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
