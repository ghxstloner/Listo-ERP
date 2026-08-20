"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import {
  ProductGeneralForm,
  type ProductGeneralFormRef,
} from "@/packages/product/components/product-general-form";
import { ProductKardexTab } from "@/packages/product/components/product-kardex-tab";
import { ProductOrdersTab } from "@/packages/product/components/product-orders-tab";
import { ProductPricesSection, type ProductPricesSectionRef } from "@/packages/product/components/product-prices-section";
import { ProductPurchasesTab } from "@/packages/product/components/product-purchases-tab";
import { ProductSalesTab } from "@/packages/product/components/product-sales-tab";
import type { Product, ProductType } from "@/packages/product/types";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState } from "react";

export function EditProductPage({
  product,
  productId,
  productType = "PRODUCT",
}: {
  product: Product;
  productId: number;
  productType?: ProductType;
}) {
  const t = useTranslation();
  const isService = productType === "SERVICE";
  const basePath = isService ? "/listoerp/inventory/services" : "/listoerp/inventory/products";
  const generalFormRef = useRef<ProductGeneralFormRef>(null);
  const pricesFormRef = useRef<ProductPricesSectionRef>(null);
  const [activeTab, setActiveTab] = useState("general");

  const showSaveButton = activeTab === "general" || activeTab === "prices";
  const handleSave = () => {
    if (activeTab === "general") generalFormRef.current?.save();
    if (activeTab === "prices") pricesFormRef.current?.save();
  };
  const isSaving = false; // Cannot read refs during render safely

  return (
    <div className="w-full p-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href={basePath} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 h-4 w-4" />
              {isService
                ? t("inventory.services.backToServices")
                : t("inventory.products.backToProducts")}
            </Link>
          </Button>
          <TabsList className="min-w-0 overflow-x-auto">
            <TabsTrigger value="general" className="whitespace-nowrap">
              {t("company.generalConfiguration")}
            </TabsTrigger>
            <TabsTrigger value="prices" className="whitespace-nowrap">
              {t("inventory.products.pricingInformation")}
            </TabsTrigger>
            {!isService && (
              <TabsTrigger value="kardex" className="whitespace-nowrap">
                {t("inventory.products.kardex.title")}
              </TabsTrigger>
            )}
            {!isService && (
              <TabsTrigger value="purchases" className="whitespace-nowrap">
                {t("inventory.products.purchases")}
              </TabsTrigger>
            )}
            <TabsTrigger value="sales" className="whitespace-nowrap">
              {t("inventory.products.sales")}
            </TabsTrigger>
            <TabsTrigger value="orders" className="whitespace-nowrap">
              {t("inventory.products.orders")}
            </TabsTrigger>
          </TabsList>
          {showSaveButton && (
            <Button
              className="ml-auto shrink-0"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? t("common.saving") : t("common.save")}
            </Button>
          )}
        </div>

        <TabsContent value="general" className="mt-2 w-full">
          <ProductGeneralForm
            ref={generalFormRef}
            mode="edit"
            key={product.id}
            product={product}
            productId={productId}
            expectedProductType={productType}
          />
        </TabsContent>

        <TabsContent value="prices" className="mt-2 w-full">
          <ProductPricesSection ref={pricesFormRef} product={product} />
        </TabsContent>

        {!isService && (
          <TabsContent value="kardex" className="mt-2 w-full">
            <Card>
              <CardHeader>
                <CardTitle>{t("inventory.products.kardex.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductKardexTab productId={productId} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {!isService && (
          <TabsContent value="purchases" className="mt-2 w-full">
            <Card>
              <CardHeader>
                <CardTitle>{t("inventory.products.purchases")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductPurchasesTab productId={productId} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="sales" className="mt-2 w-full">
          <Card>
            <CardHeader>
              <CardTitle>{t("inventory.products.sales")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSalesTab productId={productId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-2 w-full">
          <Card>
            <CardHeader>
              <CardTitle>{t("inventory.products.orders")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductOrdersTab productId={productId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
