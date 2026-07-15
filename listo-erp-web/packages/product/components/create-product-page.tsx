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
import { showToast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/use-translation";
import { useGetCategories } from "@/packages/category/api";
import { useGetDepartments } from "@/packages/department/api";
import { uploadProductImage, useCreateProduct } from "@/packages/product/api";
import { useProductValidation } from "@/packages/product/hooks/use-product-validation";
import type { CreateProductRequest } from "@/packages/product/types";
import { useGetSubCategories } from "@/packages/subcategory/api";
import { useGetSubDepartments } from "@/packages/subdepartment/api";
import { ArrowLeft } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { encodeId } from "@/lib/hash-id";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function CreateProductPage() {
  const t = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { validateProductFields } = useProductValidation();

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [unit, setUnit] = useState("und");
  const [isActive, setIsActive] = useState(true);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [subdepartmentId, setSubdepartmentId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createProduct, isCreating, createError] = useCreateProduct();
  const [departmentsResponse] = useGetDepartments();
  const [subdepartmentsResponse] = useGetSubDepartments(departmentId ?? undefined);
  const [categoriesResponse] = useGetCategories(subdepartmentId ?? undefined);
  const [subcategoriesResponse] = useGetSubCategories(categoryId ?? undefined);

  const departments = departmentsResponse?.data ?? [];
  const subdepartments = subdepartmentsResponse?.data ?? [];
  const categories = categoriesResponse?.data ?? [];
  const subcategories = subcategoriesResponse?.data ?? [];

  useEffect(() => {
    if (createError) {
      showToast({
        type: "error",
        message: (createError as Error).message || t("common.error"),
      });
    }
  }, [createError, t]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      showToast({ type: "error", message: t("common.error") });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = () => {
    if (!validateProductFields(sku, name, salePrice, departmentId)) {
      return;
    }

    const request: CreateProductRequest = {
      sku: sku.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      salePrice: parseFloat(salePrice),
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      taxRate: taxRate ? parseFloat(taxRate) / 100 : undefined,
      departmentId: departmentId!,
      subdepartmentId: subdepartmentId ?? undefined,
      categoryId: categoryId ?? undefined,
      subcategoryId: subcategoryId ?? undefined,
      unit: unit.trim() || undefined,
      isActive,
    };

    createProduct(request, async (response) => {
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          await uploadProductImage(response.data.id, imageFile);
        } catch (error) {
          showToast({
            type: "error",
            message: error instanceof Error ? error.message : t("common.error"),
          });
        } finally {
          setIsUploadingImage(false);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      showToast({ type: "success", message: t("inventory.products.productAdded") });
      router.push(`/listoerp/inventory/products/${encodeId(response.data.id)}`);
    });
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(Number(value));
    setSubdepartmentId(null);
    setCategoryId(null);
    setSubcategoryId(null);
  };

  const handleSubdepartmentChange = (value: string) => {
    setSubdepartmentId(Number(value));
    setCategoryId(null);
    setSubcategoryId(null);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(Number(value));
    setSubcategoryId(null);
  };

  const formValid =
    !!sku.trim() &&
    !!name.trim() &&
    !!salePrice.trim() &&
    Number(salePrice) > 0 &&
    !!departmentId;

  return (
    <div className="w-full space-y-4 p-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/listoerp/inventory/products" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t("inventory.products.backToProducts")}
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{t("inventory.products.addNewProduct")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("inventory.products.addProductDescription")}</p>
        </CardHeader>
        <CardContent className="space-y-3">

          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("inventory.products.basicInformation")}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">
                    {t("inventory.products.sku")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder={t("inventory.products.skuPlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t("inventory.products.name")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("inventory.products.namePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">{t("inventory.products.description")}</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("inventory.products.descriptionPlaceholder")}
                    disabled={isCreating}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("inventory.products.pricingInformation")}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="salePrice">
                    {t("inventory.products.salePrice")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder={t("inventory.products.salePricePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">{t("inventory.products.costPrice")}</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder={t("inventory.products.costPricePlaceholder")}
                    disabled={isCreating}
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
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder={t("inventory.products.taxRatePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("inventory.products.hierarchyInformation")}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">
                    {t("inventory.products.department")} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={departmentId?.toString() || ""}
                    onValueChange={handleDepartmentChange}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="department" className="w-full">
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
                    value={subdepartmentId?.toString() || ""}
                    onValueChange={handleSubdepartmentChange}
                    disabled={isCreating || !departmentId || subdepartments.length === 0}
                  >
                    <SelectTrigger id="subdepartment" className="w-full">
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
                    value={categoryId?.toString() || ""}
                    onValueChange={handleCategoryChange}
                    disabled={isCreating || !subdepartmentId || categories.length === 0}
                  >
                    <SelectTrigger id="category" className="w-full">
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
                    value={subcategoryId?.toString() || ""}
                    onValueChange={(value) => setSubcategoryId(Number(value))}
                    disabled={isCreating || !categoryId || subcategories.length === 0}
                  >
                    <SelectTrigger id="subcategory" className="w-full">
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

            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("inventory.products.additionalInformation")}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit">{t("inventory.products.unit")}</Label>
                  <Input
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={t("inventory.products.unitPlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{t("inventory.products.status")}</Label>
                  <div className="flex h-9 items-center gap-3">
                    <Switch
                      id="status"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      disabled={isCreating}
                    />
                    <span className="text-sm">
                      {isActive ? t("inventory.products.active") : t("inventory.products.inactive")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("inventory.products.image")}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCreating || isUploadingImage}
                className="flex w-full items-center gap-3 rounded-md border border-dashed p-3 text-left hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt={name || "Producto"} className="size-16 rounded object-cover" />
                ) : (
                  <div className="flex size-16 items-center justify-center rounded bg-muted text-muted-foreground">+</div>
                )}
                <span className="text-sm text-muted-foreground">
                  {imageFile ? imageFile.name : t("inventory.products.uploadImage")}
                </span>
              </button>
              <p className="text-xs text-muted-foreground">{t("inventory.products.imageFormats")}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" asChild disabled={isCreating || isUploadingImage}>
              <Link href="/listoerp/inventory/products">{t("common.cancel")}</Link>
            </Button>
            <Button onClick={handleCreateProduct} disabled={isCreating || isUploadingImage || !formValid}>
              {isCreating || isUploadingImage ? t("common.saving") : t("common.create")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
