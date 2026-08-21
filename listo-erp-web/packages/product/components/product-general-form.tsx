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
import { useGetCategories } from "@/packages/category/api";
import { useGetDepartments } from "@/packages/department/api";
import {
  getProductImageUrl,
  useUpdateProduct,
  useUploadProductImage,
} from "@/packages/product/api";
import { useProductValidation } from "@/packages/product/hooks/use-product-validation";
import type { Product, ProductType, UpdateProductRequest } from "@/packages/product/types";
import { useGetSubCategories } from "@/packages/subcategory/api";
import { useGetSubDepartments } from "@/packages/subdepartment/api";
import { Camera, Spinner, Upload } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

export interface GeneralFormState {
  sku: string;
  name: string;
  barcode: string;
  reference: string;
  usesUnit: boolean;
  dianCode: string;
  isActive: boolean;
  departmentId: number | null;
  subdepartmentId: number | null;
  categoryId: number | null;
  subcategoryId: number | null;
  imagePreview: string | null;
}

export interface ProductGeneralFormRef {
  save: () => void;
  saving: boolean;
}

type CreateProps = {
  mode: "create";
  productType: ProductType;
  state: GeneralFormState;
  onChange: (patch: Partial<GeneralFormState>) => void;
  onImageFileChange: (file: File) => void;
  disabled?: boolean;
  uploadingImage?: boolean;
};

type EditProps = {
  mode: "edit";
  product: Product;
  productId: number;
  expectedProductType: ProductType;
  onSave?: () => void;
};

type ProductGeneralFormProps = CreateProps | EditProps;

function toEditState(product: Product): GeneralFormState {
  return {
    sku: product.sku,
    name: product.name,
    barcode: product.barcode ?? "",
    reference: product.reference ?? "",
    usesUnit: Boolean(product.dianCode && product.dianCode !== "ZZ"),
    dianCode: product.dianCode === "ZZ" ? "" : (product.dianCode ?? ""),
    isActive: product.isActive,
    departmentId: product.departmentId,
    subdepartmentId: product.subdepartmentId,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    imagePreview: getProductImageUrl(product.image) || null,
  };
}

export const ProductGeneralForm = forwardRef<ProductGeneralFormRef, ProductGeneralFormProps>(
  function ProductGeneralForm(props, ref) {
    const t = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEdit = props.mode === "edit";
    const productType = isEdit ? props.expectedProductType : props.productType;
    const isService = productType === "SERVICE";

    const [editState, setEditState] = useState<GeneralFormState>(() =>
      isEdit ? toEditState(props.product) : ({} as GeneralFormState),
    );

    const state: GeneralFormState = isEdit ? editState : props.state;

    const queryClient = useQueryClient();
    const { validateProductFields } = useProductValidation();

    const [update, updating, updateError] = useUpdateProduct(isEdit ? props.productId : 0);
    const [uploadImage, uploadingImageEdit] = useUploadProductImage(
      isEdit ? props.productId : 0,
    );

    useEffect(() => {
      if (updateError)
        showToast({ type: "error", message: updateError.message || t("common.error") });
    }, [updateError, t]);

    const setField = <K extends keyof GeneralFormState>(key: K, value: GeneralFormState[K]) => {
      if (!isEdit) {
        const patch: Partial<GeneralFormState> = { [key]: value };
        if (key === "departmentId") {
          patch.subdepartmentId = null;
          patch.categoryId = null;
          patch.subcategoryId = null;
        }
        if (key === "subdepartmentId") {
          patch.categoryId = null;
          patch.subcategoryId = null;
        }
        if (key === "categoryId") patch.subcategoryId = null;
        (props as CreateProps).onChange(patch);
      } else {
        setEditState((current) => {
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
      }
    };

    const save = () => {
      if (!isEdit) return;
      const { product, productId, expectedProductType, onSave } = props as EditProps;
      if (
        !validateProductFields(state.sku, state.name, String(product.salePrice), state.departmentId)
      )
        return;
      if (state.usesUnit && !state.dianCode.trim()) {
        showToast({ type: "error", message: "El código de unidad DIAN es obligatorio." });
        return;
      }
      const request: UpdateProductRequest = {
        sku: state.sku.trim(),
        name: state.name.trim(),
        barcode: state.barcode?.trim() || null,
        reference: state.reference?.trim() || null,
        departmentId: state.departmentId!,
        subdepartmentId: state.subdepartmentId,
        categoryId: state.categoryId,
        subcategoryId: state.subcategoryId,
        dianCode: state.usesUnit ? state.dianCode.trim().toUpperCase() : "ZZ",
        isActive: state.isActive,
        productType: product.productType,
      };
      update(request, () => {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["products", productId] });
        showToast({
          type: "success",
          message:
            expectedProductType === "SERVICE"
              ? t("inventory.services.serviceUpdated")
              : t("inventory.products.productUpdated"),
        });
        onSave?.();
      });
    };

    useImperativeHandle(ref, () => ({ save, saving: updating }), [updating, state]);

    const disabled = isEdit ? updating : (props as CreateProps).disabled ?? false;
    const uploadingImage = isEdit
      ? uploadingImageEdit
      : (props as CreateProps).uploadingImage ?? false;

    const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
      if (isEdit) {
        const reader = new FileReader();
        reader.onload = (load) => setField("imagePreview", load.target?.result as string);
        reader.readAsDataURL(file);
        uploadImage(file, () =>
          queryClient.invalidateQueries({ queryKey: ["products", (props as EditProps).productId] }),
        );
      } else {
        (props as CreateProps).onImageFileChange(file);
        const reader = new FileReader();
        reader.onload = (load) =>
          (props as CreateProps).onChange({ imagePreview: load.target?.result as string });
        reader.readAsDataURL(file);
      }
    };

    const [departmentsResponse] = useGetDepartments();
    const [subdepartmentsResponse] = useGetSubDepartments(state.departmentId ?? undefined);
    const [categoriesResponse] = useGetCategories(state.subdepartmentId ?? undefined);
    const [subcategoriesResponse] = useGetSubCategories(state.categoryId ?? undefined);

    const departments = Array.isArray(departmentsResponse)
      ? departmentsResponse
      : (departmentsResponse?.data ?? []);
    const subdepartments = Array.isArray(subdepartmentsResponse)
      ? subdepartmentsResponse
      : (subdepartmentsResponse?.data ?? []);
    const categories = Array.isArray(categoriesResponse)
      ? categoriesResponse
      : (categoriesResponse?.data ?? []);
    const subcategories = Array.isArray(subcategoriesResponse)
      ? subcategoriesResponse
      : (subcategoriesResponse?.data ?? []);

    const selectField = (
      id: string,
      value: number | null,
      items: Array<{ id: number; name: string }>,
      placeholder: string,
      onValueChange: (value: number | null) => void,
      selectDisabled = false,
    ) => (
      <Select
        value={value?.toString() || ""}
        onValueChange={(v) => onValueChange(v ? Number(v) : null)}
        disabled={selectDisabled}
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isService
              ? t("inventory.services.generalInformation")
              : t("inventory.products.generalInformation")}
          </CardTitle>
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
                    {t("inventory.products.sku")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sku"
                    value={state.sku}
                    onChange={(e) => setField("sku", e.target.value)}
                    placeholder={t("inventory.products.skuPlaceholder")}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t("inventory.products.name")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={state.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder={
                      isService
                        ? t("inventory.services.namePlaceholder")
                        : t("inventory.products.namePlaceholder")
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Código de barras</Label>
                  <Input
                    id="barcode"
                    value={state.barcode}
                    onChange={(e) => setField("barcode", e.target.value)}
                    placeholder="Ej. 7701234567890"
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Referencia</Label>
                  <Input
                    id="reference"
                    value={state.reference}
                    onChange={(e) => setField("reference", e.target.value)}
                    placeholder="Ej. REF-ABC-01"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("inventory.products.additionalInformation")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uses-unit">Usa unidad de medida</Label>
                  <Switch
                    id="uses-unit"
                    checked={state.usesUnit}
                    onCheckedChange={(v) => setField("usesUnit", v)}
                    disabled={disabled}
                  />
                </div>
                {state.usesUnit && (
                  <div className="space-y-2">
                    <Label htmlFor="dianCode">Código de unidad DIAN</Label>
                    <Input
                      id="dianCode"
                      value={state.dianCode}
                      onChange={(e) => setField("dianCode", e.target.value.toUpperCase())}
                      maxLength={3}
                      disabled={disabled}
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
                    {t("inventory.products.department")} <span className="text-destructive">*</span>
                  </Label>
                  {selectField(
                    "department",
                    state.departmentId,
                    departments,
                    t("inventory.products.selectDepartment"),
                    (v) => setField("departmentId", v),
                    disabled,
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("inventory.products.subdepartment")}</Label>
                  {selectField(
                    "subdepartment",
                    state.subdepartmentId,
                    subdepartments,
                    t("inventory.products.selectSubdepartment"),
                    (v) => setField("subdepartmentId", v),
                    disabled || !state.departmentId || !subdepartments.length,
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("inventory.products.category")}</Label>
                  {selectField(
                    "category",
                    state.categoryId,
                    categories,
                    t("inventory.products.selectCategory"),
                    (v) => setField("categoryId", v),
                    disabled || !state.subdepartmentId || !categories.length,
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("inventory.products.subcategory")}</Label>
                  {selectField(
                    "subcategory",
                    state.subcategoryId,
                    subcategories,
                    t("inventory.products.selectSubcategory"),
                    (v) => setField("subcategoryId", v),
                    disabled || !state.categoryId || !subcategories.length,
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{t("inventory.products.status")}</span>
              <Switch
                id="status"
                checked={state.isActive}
                onCheckedChange={(v) => setField("isActive", v)}
                disabled={disabled}
              />
              <Label htmlFor="status" className="cursor-pointer">
                {state.isActive
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
              {state.imagePreview ? (
                isEdit ? (
                  <Image
                    src={state.imagePreview}
                    alt={state.name}
                    fill
                    sizes="(max-width: 1280px) 100vw, 280px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <img
                    src={state.imagePreview}
                    alt={state.name}
                    className="size-full object-cover"
                  />
                )
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
              onChange={handleImage}
            />
            <p className="text-center text-xs text-muted-foreground">
              {t("inventory.products.imageFormats")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  },
);
