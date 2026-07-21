"use client";

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
import { encodeId } from "@/lib/hash-id";
import { useGetCategories } from "@/packages/category/api";
import { useGetDepartments } from "@/packages/department/api";
import { uploadProductImage, useCreateProduct } from "@/packages/product/api";
import { useProductValidation } from "@/packages/product/hooks/use-product-validation";
import type { CreateProductRequest } from "@/packages/product/types";
import { useGetSubCategories } from "@/packages/subcategory/api";
import { useGetSubDepartments } from "@/packages/subdepartment/api";
import { ArrowLeft, Camera, Spinner, Upload } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

export function CreateProductPage() {
  const t = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { validateProductFields } = useProductValidation();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [usesUnit, setUsesUnit] = useState(false);
  const [dianCode, setDianCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [subdepartmentId, setSubdepartmentId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [create, creating, createError] = useCreateProduct();
  const [departmentsResponse] = useGetDepartments();
  const [subdepartmentsResponse] = useGetSubDepartments(
    departmentId ?? undefined,
  );
  const [categoriesResponse] = useGetCategories(subdepartmentId ?? undefined);
  const [subcategoriesResponse] = useGetSubCategories(categoryId ?? undefined);
  const departments = departmentsResponse?.data ?? [];
  const subdepartments = subdepartmentsResponse?.data ?? [];
  const categories = categoriesResponse?.data ?? [];
  const subcategories = subcategoriesResponse?.data ?? [];
  useEffect(() => {
    if (createError)
      showToast({
        type: "error",
        message: createError.message || t("common.error"),
      });
  }, [createError, t]);
  const image = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)
      return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (load) => setImagePreview(load.target?.result as string);
    reader.readAsDataURL(file);
  };
  const changeDepartment = (value: number) => {
    setDepartmentId(value);
    setSubdepartmentId(null);
    setCategoryId(null);
    setSubcategoryId(null);
  };
  const changeSubdepartment = (value: number) => {
    setSubdepartmentId(value);
    setCategoryId(null);
    setSubcategoryId(null);
  };
  const createProduct = () => {
    if (!validateProductFields(sku, name, salePrice, departmentId)) return;
    if (usesUnit && !dianCode.trim()) {
      showToast({
        type: "error",
        message: "El código de unidad DIAN es obligatorio.",
      });
      return;
    }
    const request: CreateProductRequest = {
      sku: sku.trim(),
      name: name.trim(),
      salePrice: Number(salePrice),
      taxRate: taxRate ? Number(taxRate) / 100 : undefined,
      departmentId: departmentId!,
      subdepartmentId,
      categoryId,
      subcategoryId,
      dianCode: usesUnit ? dianCode.trim().toUpperCase() : "ZZ",
      isActive,
    };
    create(request, async (response) => {
      if (imageFile) {
        setUploadingImage(true);
        try {
          await uploadProductImage(response.data.id, imageFile);
        } finally {
          setUploadingImage(false);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push(`/listoerp/inventory/products/${encodeId(response.data.id)}`);
    });
  };
  const select = (
    id: string,
    value: number | null,
    items: Array<{ id: number; name: string }>,
    placeholder: string,
    onChange: (value: number) => void,
    disabled = false,
  ) => (
    <Select
      value={value?.toString() || ""}
      onValueChange={(value) => onChange(Number(value))}
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
  const valid =
    !!sku.trim() &&
    !!name.trim() &&
    !!salePrice.trim() &&
    Number(salePrice) > 0 &&
    !!departmentId;
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
        <Button
          onClick={createProduct}
          disabled={creating || uploadingImage || !valid}
        >
          {creating || uploadingImage ? t("common.saving") : t("common.create")}
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
                    value={sku}
                    onChange={(event) => setSku(event.target.value)}
                    placeholder={t("inventory.products.skuPlaceholder")}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t("inventory.products.name")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("inventory.products.namePlaceholder")}
                    disabled={creating}
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
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(event) => setSalePrice(event.target.value)}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">
                    {t("inventory.products.taxRate")}
                  </Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(event) => setTaxRate(event.target.value)}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usesUnit">Usa unidad de medida</Label>
                  <Switch
                    id="usesUnit"
                    checked={usesUnit}
                    onCheckedChange={setUsesUnit}
                    disabled={creating}
                  />
                </div>
                {usesUnit && (
                  <div className="space-y-2">
                    <Label htmlFor="dianCode">Código de unidad DIAN</Label>
                    <Input
                      id="dianCode"
                      value={dianCode}
                      onChange={(event) =>
                        setDianCode(event.target.value.toUpperCase())
                      }
                      maxLength={3}
                      disabled={creating}
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
                    {t("inventory.products.department")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  {select(
                    "department",
                    departmentId,
                    departments,
                    t("inventory.products.selectDepartment"),
                    changeDepartment,
                    creating,
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("inventory.products.subdepartment")}</Label>
                  {select(
                    "subdepartment",
                    subdepartmentId,
                    subdepartments,
                    t("inventory.products.selectSubdepartment"),
                    changeSubdepartment,
                    creating || !departmentId || !subdepartments.length,
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("inventory.products.category")}</Label>
                  {select(
                    "category",
                    categoryId,
                    categories,
                    t("inventory.products.selectCategory"),
                    (value) => {
                      setCategoryId(value);
                      setSubcategoryId(null);
                    },
                    creating || !subdepartmentId || !categories.length,
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("inventory.products.subcategory")}</Label>
                  {select(
                    "subcategory",
                    subcategoryId,
                    subcategories,
                    t("inventory.products.selectSubcategory"),
                    setSubcategoryId,
                    creating || !categoryId || !subcategories.length,
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
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={creating}
              />
              <Label htmlFor="status" className="cursor-pointer">
                {isActive
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
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={name || "Producto"}
                  className="size-full object-cover"
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
