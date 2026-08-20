"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { encodeId } from "@/lib/hash-id";
import { uploadProductImage, useCreateProduct } from "@/packages/product/api";
import type { CreateProductRequest, ProductType } from "@/packages/product/types";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import {
  ProductGeneralForm,
  type GeneralFormState,
} from "@/packages/product/components/product-general-form";
import {
  CreatePricesSection,
  type PendingPrice,
} from "@/packages/product/components/create-prices-section";
import { ArrowLeft } from "@phosphor-icons/react";
import { api } from "@config";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const defaultGeneralState = (): GeneralFormState => ({
  sku: "",
  name: "",
  usesUnit: false,
  dianCode: "",
  isActive: true,
  departmentId: null,
  subdepartmentId: null,
  categoryId: null,
  subcategoryId: null,
  imagePreview: null,
});

export function CreateProductPage({ productType = "PRODUCT" }: { productType?: ProductType }) {
  const t = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { parseMoney } = useCurrency();
  const isService = productType === "SERVICE";
  const basePath = isService
    ? "/listoerp/inventory/services"
    : "/listoerp/inventory/products";

  const [general, setGeneral] = useState<GeneralFormState>(defaultGeneralState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [costPrice, setCostPrice] = useState("");
  const [taxId, setTaxId] = useState<number | null>(null);
  const [isExempt, setIsExempt] = useState(false);
  const [extraPrices, setExtraPrices] = useState<PendingPrice[]>([]);

  const [create, creating, createError] = useCreateProduct();

  useEffect(() => {
    if (createError)
      showToast({ type: "error", message: createError.message || t("common.error") });
  }, [createError, t]);

  const firstActivePrice = extraPrices.find((p) => p.isActive);
  const derivedSalePrice = firstActivePrice ? firstActivePrice.amount : 0;

  const createProduct = () => {
    if (!general.sku.trim()) {
      showToast({ type: "error", message: t("inventory.products.validation.skuRequired") });
      return;
    }
    if (!general.name.trim()) {
      showToast({ type: "error", message: t("inventory.products.validation.nameRequired") });
      return;
    }
    if (!general.departmentId) {
      showToast({ type: "error", message: t("inventory.products.validation.departmentRequired") });
      return;
    }
    if (extraPrices.length === 0 || !firstActivePrice || firstActivePrice.amount <= 0) {
      showToast({
        type: "error",
        message: "Agrega al menos un precio activo con valor mayor a cero.",
      });
      return;
    }
    if (general.usesUnit && !general.dianCode.trim()) {
      showToast({ type: "error", message: "El código de unidad DIAN es obligatorio." });
      return;
    }

    const request: CreateProductRequest = {
      sku: general.sku.trim(),
      name: general.name.trim(),
      salePrice: derivedSalePrice,
      costPrice: costPrice.trim() ? parseMoney(costPrice) : undefined,
      taxId: taxId ?? undefined,
      isExempt,
      departmentId: general.departmentId,
      subdepartmentId: general.subdepartmentId,
      categoryId: general.categoryId,
      subcategoryId: general.subcategoryId,
      dianCode: general.usesUnit ? general.dianCode.trim().toUpperCase() : "ZZ",
      isActive: general.isActive,
      productType,
    };

    create(request, async (response) => {
      const productId = response.data.id;
      const uploads: Promise<unknown>[] = [];

      if (imageFile) {
        setUploadingImage(true);
        uploads.push(
          uploadProductImage(productId, imageFile).finally(() => setUploadingImage(false)),
        );
      }

      for (const price of extraPrices) {
        uploads.push(
          api.post(`products/${productId}/prices`, {
            body: {
              name: price.name.trim() || `Precio ${(price.sortOrder ?? 0) + 1}`,
              amount: price.amount,
              sortOrder: price.sortOrder,
              isActive: price.isActive,
            },
          }),
        );
      }

      await Promise.allSettled(uploads);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push(`${basePath}/${encodeId(productId)}`);
    });
  };

  const valid =
    !!general.sku.trim() &&
    !!general.name.trim() &&
    !!general.departmentId &&
    extraPrices.length > 0 &&
    !!firstActivePrice &&
    firstActivePrice.amount > 0;

  return (
    <div className="w-full p-2">
      <Tabs defaultValue="general" className="w-full">
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
          </TabsList>
          <Button
            onClick={createProduct}
            disabled={creating || uploadingImage || !valid}
            className="ml-auto shrink-0"
          >
            {creating || uploadingImage ? t("common.saving") : t("common.create")}
          </Button>
        </div>

        <TabsContent value="general" className="mt-2 w-full">
          <ProductGeneralForm
            mode="create"
            productType={productType}
            state={general}
            onChange={(patch) => setGeneral((prev) => ({ ...prev, ...patch }))}
            onImageFileChange={setImageFile}
            disabled={creating}
            uploadingImage={uploadingImage}
          />
        </TabsContent>

        <TabsContent value="prices" className="mt-2 w-full">
          <CreatePricesSection
            productType={productType}
            costPrice={costPrice}
            taxId={taxId}
            isExempt={isExempt}
            onFieldChange={(key, value) => {
              if (key === "costPrice") setCostPrice(value as string);
              else if (key === "taxId") setTaxId(value as number | null);
              else if (key === "isExempt") setIsExempt(value as boolean);
            }}
            extraPrices={extraPrices}
            onExtraPricesChange={setExtraPrices}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
