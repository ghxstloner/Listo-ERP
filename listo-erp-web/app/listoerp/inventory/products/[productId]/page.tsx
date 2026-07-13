"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { decodeId } from "@/lib/hash-id";
import { usePageTitle } from "@/lib/page-title-context";
import { useGetCategories } from "@/packages/category/api";
import { getCompanyLogoUrl } from "@/packages/company/api";
import { useGetDepartments } from "@/packages/department/api";
import { useUpdateProduct, useUploadProductImage } from "@/packages/product/api";
import { useProductValidation } from "@/packages/product/hooks/use-product-validation";
import type { Product, UpdateProductRequest } from "@/packages/product/types";
import { useGetSubCategories } from "@/packages/subcategory/api";
import { useGetSubDepartments } from "@/packages/subdepartment/api";
import { ArrowLeft, Camera, Spinner, Upload } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@config";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

interface ProductDetailPageProps {
  params: {
    productId: string;
  };
}

interface FormState {
  sku: string;
  name: string;
  description: string;
  salePrice: string;
  costPrice: string;
  taxRate: string;
  unit: string;
  isActive: boolean;
  departmentId: number | null;
  subdepartmentId: number | null;
  categoryId: number | null;
  subcategoryId: number | null;
  imagePreview: string | null;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const router = useRouter();

  const decodedProductId = decodeId(params.productId);
  const [product, isLoading, error] = useApiQuery<Product>(
    ["products", decodedProductId ?? "invalid"],
    `products/${decodedProductId ?? 0}`,
    undefined,
    { enabled: decodedProductId !== null }
  );

  useEffect(() => {
    if (product?.name) {
      setTitle(product.name);
    }
  }, [product?.name, setTitle]);

  useEffect(() => {
    if (decodedProductId === null) {
      router.replace("/listoerp/inventory/products");
    }
  }, [decodedProductId, router]);

  if (decodedProductId === null) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
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

  if (error || !product) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}: {(error as Error)?.message || t("inventory.products.notFound")}
        </p>
      </div>
    );
  }

  return <ProductDetailInner key={product.id} product={product} productId={decodedProductId} />;
}

function emptyFormState(): FormState {
  return {
    sku: "",
    name: "",
    description: "",
    salePrice: "",
    costPrice: "",
    taxRate: "0",
    unit: "und",
    isActive: true,
    departmentId: null,
    subdepartmentId: null,
    categoryId: null,
    subcategoryId: null,
    imagePreview: null,
  };
}

function productToFormState(product: Product): FormState {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? "",
    salePrice: product.salePrice.toString(),
    costPrice: product.costPrice?.toString() ?? "",
    taxRate: product.taxRate != null ? (product.taxRate * 100).toString() : "",
    unit: product.unit ?? "",
    isActive: product.isActive,
    departmentId: product.departmentId,
    subdepartmentId: product.subdepartmentId,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    imagePreview: product.image ? getCompanyLogoUrl(product.image) : null,
  };
}

function ProductDetailInner({ product, productId }: { product: Product; productId: number }) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const { validateProductFields } = useProductValidation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateProduct, isUpdating, updateError] = useUpdateProduct(productId);
  const [uploadImage, isUploadingImage] = useUploadProductImage(productId);

  const [formState, setFormState] = useState<FormState>(() =>
    product ? productToFormState(product) : emptyFormState()
  );

  const [departmentsResponse] = useGetDepartments();
  const [subdepartmentsResponse] = useGetSubDepartments(formState.departmentId ?? undefined);
  const [categoriesResponse] = useGetCategories(formState.subdepartmentId ?? undefined);
  const [subcategoriesResponse] = useGetSubCategories(formState.categoryId ?? undefined);

  const departments = departmentsResponse?.data ?? [];
  const subdepartments = subdepartmentsResponse?.data ?? [];
  const categories = categoriesResponse?.data ?? [];
  const subcategories = subcategoriesResponse?.data ?? [];

  useEffect(() => {
    if (updateError) {
      showToast({
        type: "error",
        message: (updateError as Error).message || t("common.error"),
      });
    }
  }, [updateError, t]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState(prev => {
      const next: FormState = { ...prev, [field]: value };

      if (field === "departmentId") {
        next.subdepartmentId = null;
        next.categoryId = null;
        next.subcategoryId = null;
      }

      if (field === "subdepartmentId") {
        next.categoryId = null;
        next.subcategoryId = null;
      }

      if (field === "categoryId") {
        next.subcategoryId = null;
      }

      return next;
    });
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast({
        type: "error",
        message: t("common.error"),
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast({
        type: "error",
        message: t("common.error"),
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      updateField("imagePreview", event.target?.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);

    uploadImage(formData, () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId] });
      showToast({
        type: "success",
        message: t("inventory.products.imageUpdatedSuccessfully"),
      });
    });
  };

  const handleSave = () => {
    const { sku, name, salePrice, departmentId } = formState;

    if (!validateProductFields(sku, name, salePrice, departmentId)) {
      return;
    }

    const request: UpdateProductRequest = {
      sku: sku.trim(),
      name: name.trim(),
      description: formState.description.trim() || undefined,
      salePrice: parseFloat(salePrice),
      costPrice: formState.costPrice ? parseFloat(formState.costPrice) : undefined,
      taxRate: formState.taxRate ? parseFloat(formState.taxRate) / 100 : undefined,
      departmentId: departmentId!,
      subdepartmentId: formState.subdepartmentId ?? undefined,
      categoryId: formState.categoryId ?? undefined,
      subcategoryId: formState.subcategoryId ?? undefined,
      unit: formState.unit || "und",
      isActive: formState.isActive,
    };

    updateProduct(request, () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", productId] });
      showToast({
        type: "success",
        message: t("inventory.products.productUpdated"),
      });
    });
  };

  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/listoerp/inventory/products"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("inventory.products.backToProducts")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("inventory.products.productInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("inventory.products.basicInformation")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">
                      {t("inventory.products.sku")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="sku"
                      value={formState.sku}
                      onChange={(e) => updateField('sku', e.target.value)}
                      placeholder={t("inventory.products.skuPlaceholder")}
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {t("inventory.products.name")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formState.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder={t("inventory.products.namePlaceholder")}
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="description">{t("inventory.products.description")}</Label>
                    <Input
                      id="description"
                      value={formState.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder={t("inventory.products.descriptionPlaceholder")}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("inventory.products.pricingInformation")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salePrice">
                      {t("inventory.products.salePrice")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formState.salePrice}
                      onChange={(e) => updateField('salePrice', e.target.value)}
                      placeholder={t("inventory.products.salePricePlaceholder")}
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">{t("inventory.products.costPrice")}</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formState.costPrice}
                      onChange={(e) => updateField('costPrice', e.target.value)}
                      placeholder={t("inventory.products.costPricePlaceholder")}
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">{t("inventory.products.taxRate")}</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formState.taxRate}
                      onChange={(e) => updateField('taxRate', e.target.value)}
                      placeholder={t("inventory.products.taxRatePlaceholder")}
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">{t("inventory.products.unit")}</Label>
                    <Input
                      id="unit"
                      value={formState.unit}
                      onChange={(e) => updateField('unit', e.target.value)}
                      placeholder={t("inventory.products.unitPlaceholder")}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("inventory.products.hierarchyInformation")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">
                      {t("inventory.products.department")} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formState.departmentId?.toString() || ""}
                      onValueChange={(value) => updateField('departmentId', Number(value))}
                      disabled={isUpdating}
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder={t("inventory.products.selectDepartment")} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subdepartment">{t("inventory.products.subdepartment")}</Label>
                    <Select
                      value={formState.subdepartmentId?.toString() || ""}
                      onValueChange={(value) => updateField('subdepartmentId', Number(value))}
                      disabled={isUpdating || !formState.departmentId || subdepartments.length === 0}
                    >
                      <SelectTrigger id="subdepartment">
                        <SelectValue placeholder={t("inventory.products.selectSubdepartment")} />
                      </SelectTrigger>
                      <SelectContent>
                        {subdepartments.map((subdept) => (
                          <SelectItem key={subdept.id} value={subdept.id.toString()}>
                            {subdept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">{t("inventory.products.category")}</Label>
                    <Select
                      value={formState.categoryId?.toString() || ""}
                      onValueChange={(value) => updateField('categoryId', Number(value))}
                      disabled={isUpdating || !formState.subdepartmentId || categories.length === 0}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder={t("inventory.products.selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">{t("inventory.products.subcategory")}</Label>
                    <Select
                      value={formState.subcategoryId?.toString() || ""}
                      onValueChange={(value) => updateField('subcategoryId', Number(value))}
                      disabled={isUpdating || !formState.categoryId || subcategories.length === 0}
                    >
                      <SelectTrigger id="subcategory">
                        <SelectValue placeholder={t("inventory.products.selectSubcategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((subcat) => (
                          <SelectItem key={subcat.id} value={subcat.id.toString()}>
                            {subcat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("inventory.products.additionalInformation")}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">{t("inventory.products.status")}</Label>
                    <Select
                      value={formState.isActive ? "ACTIVE" : "INACTIVE"}
                      onValueChange={(value) => updateField('isActive', value === "ACTIVE")}
                      disabled={isUpdating}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">
                          {t("inventory.products.active")}
                        </SelectItem>
                        <SelectItem value="INACTIVE">
                          {t("inventory.products.inactive")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isUpdating}>
                  {isUpdating ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("inventory.products.image")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="relative aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer overflow-hidden bg-muted/50 flex items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
              >
                {formState.imagePreview ? (
                  <Image
                    src={formState.imagePreview}
                    alt={formState.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="text-center p-4">
                    <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t("inventory.products.uploadImage")}
                    </p>
                  </div>
                )}

                {isUploadingImage && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Spinner className="h-8 w-8 animate-spin" />
                  </div>
                )}

                <div className="absolute bottom-2 right-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shadow-lg"
                    disabled={isUploadingImage}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {formState.imagePreview ? t("inventory.products.changeImage") : t("inventory.products.uploadImage")}
                  </Button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              <p className="text-xs text-muted-foreground text-center">
                {t("inventory.products.imageFormats")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("inventory.products.additionalInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span>#{product.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("inventory.products.createdAt")}:
                </span>
                <span>{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("inventory.products.updatedAt")}:
                </span>
                <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
