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
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/use-translation";
import { decodeId } from "@/lib/hash-id";
import { usePageTitle } from "@/lib/page-title-context";
import { useGetCategories } from "@/packages/category/api";
import { useGetDepartments } from "@/packages/department/api";
import {
  getProductImageUrl,
  useUpdateProduct,
  useUploadProductImage,
} from "@/packages/product/api";
import { useProductValidation } from "@/packages/product/hooks/use-product-validation";
import type { Product, UpdateProductRequest } from "@/packages/product/types";
import { useGetSubCategories } from "@/packages/subcategory/api";
import { useGetSubDepartments } from "@/packages/subdepartment/api";
import { ArrowLeft, Camera, Spinner, Upload } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@config";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useRef, useState, type ChangeEvent } from "react";

interface FormState {
  sku: string;
  name: string;
  salePrice: string;
  taxRate: string;
  dianCode: string;
  usesUnit: boolean;
  isActive: boolean;
  departmentId: number | null;
  subdepartmentId: number | null;
  categoryId: number | null;
  subcategoryId: number | null;
  imagePreview: string | null;
}

const toForm = (product: Product): FormState => ({
  sku: product.sku,
  name: product.name,
  salePrice: String(product.salePrice),
  taxRate: product.taxRate != null ? String(product.taxRate * 100) : "",
  dianCode: product.dianCode === "ZZ" ? "" : (product.dianCode ?? ""),
  usesUnit: Boolean(product.dianCode && product.dianCode !== "ZZ"),
  isActive: product.isActive,
  departmentId: product.departmentId,
  subdepartmentId: product.subdepartmentId,
  categoryId: product.categoryId,
  subcategoryId: product.subcategoryId,
  imagePreview: getProductImageUrl(product.image) || null,
});

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const { productId } = use(params);
  const id = decodeId(productId);
  const [product, loading, error] = useApiQuery<Product>(
    ["products", id ?? "invalid"],
    `products/${id ?? 0}`,
    undefined,
    { enabled: id !== null },
  );
  useEffect(() => {
    if (product?.name) setTitle(product.name);
  }, [product?.name, setTitle]);
  if (loading || id === null)
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin
      />
    );
  if (error || !product)
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}:{" "}
          {(error as Error)?.message || t("inventory.products.notFound")}
        </p>
      </div>
    );
  return <Editor key={product.id} product={product} productId={id} />;
}

function Editor({
  product,
  productId,
}: {
  product: Product;
  productId: number;
}) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const { validateProductFields } = useProductValidation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() => toForm(product));
  const [update, updating, updateError] = useUpdateProduct(productId);
  const [uploadImage, uploadingImage] = useUploadProductImage(productId);
  const [departmentsResponse] = useGetDepartments();
  const [subdepartmentsResponse] = useGetSubDepartments(
    form.departmentId ?? undefined,
  );
  const [categoriesResponse] = useGetCategories(
    form.subdepartmentId ?? undefined,
  );
  const [subcategoriesResponse] = useGetSubCategories(
    form.categoryId ?? undefined,
  );
  const departments = departmentsResponse?.data ?? [];
  const subdepartments = subdepartmentsResponse?.data ?? [];
  const categories = categoriesResponse?.data ?? [];
  const subcategories = subcategoriesResponse?.data ?? [];
  useEffect(() => {
    if (updateError)
      showToast({
        type: "error",
        message: updateError.message || t("common.error"),
      });
  }, [updateError, t]);
  const field = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "departmentId") {
        next.subdepartmentId = null;
        next.categoryId = null;
        next.subcategoryId = null;
      }
      if (key === "subdepartmentId") {
        next.categoryId = null;
        next.subcategoryId = null;
      }
      if (key === "categoryId") next.subcategoryId = null;
      return next;
    });
  const save = () => {
    if (
      !validateProductFields(
        form.sku,
        form.name,
        form.salePrice,
        form.departmentId,
      )
    )
      return;
    if (form.usesUnit && !form.dianCode.trim()) {
      showToast({
        type: "error",
        message: "El código de unidad DIAN es obligatorio.",
      });
      return;
    }
    const request: UpdateProductRequest = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      salePrice: Number(form.salePrice),
      taxRate: form.taxRate ? Number(form.taxRate) / 100 : undefined,
      departmentId: form.departmentId!,
      subdepartmentId: form.subdepartmentId,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId,
      dianCode: form.usesUnit ? form.dianCode.trim().toUpperCase() : "ZZ",
      isActive: form.isActive,
    };
    update(request, () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", productId] });
      showToast({
        type: "success",
        message: t("inventory.products.productUpdated"),
      });
    });
  };
  const image = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)
      return;
    const reader = new FileReader();
    reader.onload = (load) =>
      field("imagePreview", load.target?.result as string);
    reader.readAsDataURL(file);
    uploadImage(file, () =>
      queryClient.invalidateQueries({ queryKey: ["products", productId] }),
    );
  };
  const selector = (
    id: string,
    value: number | null,
    items: Array<{ id: number; name: string }>,
    placeholder: string,
    onValueChange: (value: number) => void,
    disabled = false,
  ) => (
    <Select
      value={value?.toString() || ""}
      onValueChange={(value) => onValueChange(Number(value))}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id.toString()}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/listoerp/inventory/products"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("inventory.products.backToProducts")}
          </Link>
        </Button>
        <Button onClick={save} disabled={updating}>
          {updating ? t("common.saving") : t("common.save")}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("inventory.products.productInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("inventory.products.basicInformation")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">
                    {t("inventory.products.sku")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(event) => field("sku", event.target.value)}
                    disabled={updating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t("inventory.products.name")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => field("name", event.target.value)}
                    disabled={updating}
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
                    {t("inventory.products.salePrice")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="salePrice"
                    type="number"
                    value={form.salePrice}
                    onChange={(event) => field("salePrice", event.target.value)}
                    disabled={updating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">
                    {t("inventory.products.taxRate")}
                  </Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={form.taxRate}
                    onChange={(event) => field("taxRate", event.target.value)}
                    disabled={updating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uses-unit">Usa unidad de medida</Label>
                  <Switch
                    id="uses-unit"
                    checked={form.usesUnit}
                    onCheckedChange={(value) => field("usesUnit", value)}
                    disabled={updating}
                  />
                </div>
                {form.usesUnit && (
                  <div className="space-y-2">
                    <Label htmlFor="dianCode">Código de unidad DIAN</Label>
                    <Input
                      id="dianCode"
                      value={form.dianCode}
                      onChange={(event) =>
                        field("dianCode", event.target.value.toUpperCase())
                      }
                      maxLength={3}
                      disabled={updating}
                    />
                  </div>
                )}
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("inventory.products.hierarchyInformation")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    {" "}
                    {t("inventory.products.department")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  {selector(
                    "department",
                    form.departmentId,
                    departments,
                    t("inventory.products.selectDepartment"),
                    (value) => field("departmentId", value),
                    updating,
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("inventory.products.subdepartment")}</Label>
                  {selector(
                    "subdepartment",
                    form.subdepartmentId,
                    subdepartments,
                    t("inventory.products.selectSubdepartment"),
                    (value) => field("subdepartmentId", value),
                    updating || !form.departmentId || !subdepartments.length,
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("inventory.products.category")}</Label>
                  {selector(
                    "category",
                    form.categoryId,
                    categories,
                    t("inventory.products.selectCategory"),
                    (value) => field("categoryId", value),
                    updating || !form.subdepartmentId || !categories.length,
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("inventory.products.subcategory")}</Label>
                  {selector(
                    "subcategory",
                    form.subcategoryId,
                    subcategories,
                    t("inventory.products.selectSubcategory"),
                    (value) => field("subcategoryId", value),
                    updating || !form.categoryId || !subcategories.length,
                  )}
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {t("inventory.products.status")}
              </span>
              <Switch
                id="status"
                checked={form.isActive}
                onCheckedChange={(value) => field("isActive", value)}
                disabled={updating}
              />
              <Label htmlFor="status" className="cursor-pointer">
                {form.isActive
                  ? t("inventory.products.active")
                  : t("inventory.products.inactive")}
              </Label>
            </div>
          </div>
          <div className="space-y-3 border-t pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("inventory.products.image")}
            </h3>
            <div
              className="relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
            >
              {form.imagePreview ? (
                <Image
                  src={form.imagePreview}
                  alt={form.name}
                  fill
                  sizes="(max-width: 1280px) 100vw, 280px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="p-4 text-center">
                  <Camera className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t("inventory.products.uploadImage")}
                  </p>
                </div>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Spinner className="h-8 w-8 animate-spin" />
                </div>
              )}
              <div className="absolute right-2 bottom-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="shadow-lg"
                  disabled={uploadingImage}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  {t("inventory.products.uploadImage")}
                </Button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={image}
            />
            <p className="text-center text-xs text-muted-foreground">
              {t("inventory.products.imageFormats")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
