"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useTranslation } from "@/hooks/use-translation";
import { useGetDepartments } from "@/packages/department/api";
import { useGetSubDepartments } from "@/packages/subdepartment/api";
import { useGetCategories } from "@/packages/category/api";
import { useGetSubCategories } from "@/packages/subcategory/api";
import { useGetSuppliers } from "@/packages/suppliers/api";
import { useUpdateProduct } from "@/packages/product/api";
import type { Product, UpdateProductRequest } from "@/packages/product/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useProductValidation } from "@/packages/product/hooks/use-product-validation";

interface EditProductProps {
  editingProduct: Product | null;
  onClose: () => void;
}

export function EditProduct({ editingProduct, onClose }: EditProductProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const { validateProductFields } = useProductValidation();
  
  // Basic fields
  const [sku, setSku] = useState(() => editingProduct?.sku ?? "");
  const [name, setName] = useState(() => editingProduct?.name ?? "");
  const [description, setDescription] = useState(() => editingProduct?.description ?? "");
  const [salePrice, setSalePrice] = useState(() => editingProduct?.salePrice.toString() ?? "");
  const [costPrice, setCostPrice] = useState(() => editingProduct?.costPrice.toString() ?? "");
  const [taxRate, setTaxRate] = useState(() => editingProduct?.taxRate.toString() ?? "0");
  const [unit, setUnit] = useState(() => editingProduct?.unit ?? "und");
  const [isActive, setIsActive] = useState(() => editingProduct?.isActive ?? true);
  
  // Hierarchy fields
  const [departmentId, setDepartmentId] = useState<number | null>(() => editingProduct?.departmentId ?? null);
  const [subdepartmentId, setSubdepartmentId] = useState<number | null>(() => editingProduct?.subdepartmentId ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(() => editingProduct?.categoryId ?? null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(() => editingProduct?.subcategoryId ?? null);
  const [supplierId, setSupplierId] = useState<number | null>(() => editingProduct?.supplierId ?? null);
  
  const [updateProduct, isUpdating, updateError] = useUpdateProduct(
    editingProduct?.id ?? 0
  );
  
  // Fetch hierarchy data
  const [departmentsResponse] = useGetDepartments();
  const [subdepartmentsResponse] = useGetSubDepartments(departmentId ?? undefined);
  const [categoriesResponse] = useGetCategories(subdepartmentId ?? undefined);
  const [subcategoriesResponse] = useGetSubCategories(categoryId ?? undefined);
  const [suppliers] = useGetSuppliers();
  
  const departments = departmentsResponse?.data ?? [];
  const subdepartments = subdepartmentsResponse?.data ?? [];
  const categories = categoriesResponse?.data ?? [];
  const subcategories = subcategoriesResponse?.data ?? [];

  // Update local state when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setSku(editingProduct.sku);
      setName(editingProduct.name);
      setDescription(editingProduct.description ?? "");
      setSalePrice(editingProduct.salePrice.toString());
      setCostPrice(editingProduct.costPrice.toString());
      setTaxRate(editingProduct.taxRate.toString());
      setUnit(editingProduct.unit);
      setIsActive(editingProduct.isActive);
      setDepartmentId(editingProduct.departmentId);
      setSubdepartmentId(editingProduct.subdepartmentId);
      setCategoryId(editingProduct.categoryId);
      setSubcategoryId(editingProduct.subcategoryId);
      setSupplierId(editingProduct.supplierId);
    }
  }, [editingProduct]);

  useEffect(() => {
    if (updateError) {
      showToast({
        type: "error",
        message: (updateError as Error).message || t("common.error"),
      });
    }
  }, [updateError, t]);

  // Reset subdepartment, category, subcategory when parent changes
  useEffect(() => {
    setSubdepartmentId(null);
    setCategoryId(null);
    setSubcategoryId(null);
  }, [departmentId]);

  useEffect(() => {
    setCategoryId(null);
    setSubcategoryId(null);
  }, [subdepartmentId]);

  useEffect(() => {
    setSubcategoryId(null);
  }, [categoryId]);

  const handleSave = () => {
    if (!editingProduct) return;

    if (!validateProductFields(sku, name, salePrice, departmentId)) {
      return;
    }

    const request: UpdateProductRequest = {
      sku: sku.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      salePrice: parseFloat(salePrice),
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      taxRate: taxRate ? parseFloat(taxRate) : undefined,
      departmentId: departmentId!,
      subdepartmentId: subdepartmentId ?? undefined,
      categoryId: categoryId ?? undefined,
      subcategoryId: subcategoryId ?? undefined,
      unit: unit || "und",
      supplierId: supplierId ?? undefined,
      isActive,
    };

    updateProduct(request, () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", editingProduct.id] });
      onClose();
      showToast({
        type: "success",
        message: t("inventory.products.productUpdated"),
      });
    });
  };

  return (
    <Dialog open={!!editingProduct} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{t("inventory.products.editProduct")}</DialogTitle>
          <DialogDescription>
            {t("inventory.products.editProductDescription")}
          </DialogDescription>
        </DialogHeader>
        
        {editingProduct && (
          <div className="p-6 space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("inventory.products.basicInformation")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sku">
                    {t("inventory.products.sku")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder={t("inventory.products.skuPlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    {t("inventory.products.name")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("inventory.products.namePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="edit-description">{t("inventory.products.description")}</Label>
                  <Input
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("inventory.products.descriptionPlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>

            {/* Precios */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("inventory.products.pricingInformation")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-salePrice">
                    {t("inventory.products.salePrice")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder={t("inventory.products.salePricePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-costPrice">{t("inventory.products.costPrice")}</Label>
                  <Input
                    id="edit-costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder={t("inventory.products.costPricePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-taxRate">{t("inventory.products.taxRate")}</Label>
                  <Input
                    id="edit-taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder={t("inventory.products.taxRatePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">{t("inventory.products.unit")}</Label>
                  <Input
                    id="edit-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={t("inventory.products.unitPlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>

            {/* Jerarquía */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("inventory.products.hierarchyInformation")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">
                    {t("inventory.products.department")} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={departmentId?.toString() || ""}
                    onValueChange={(value) => setDepartmentId(Number(value))}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="edit-department">
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
                  <Label htmlFor="edit-subdepartment">{t("inventory.products.subdepartment")}</Label>
                  <Select
                    value={subdepartmentId?.toString() || ""}
                    onValueChange={(value) => setSubdepartmentId(Number(value))}
                    disabled={isUpdating || !departmentId || subdepartments.length === 0}
                  >
                    <SelectTrigger id="edit-subdepartment">
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
                  <Label htmlFor="edit-category">{t("inventory.products.category")}</Label>
                  <Select
                    value={categoryId?.toString() || ""}
                    onValueChange={(value) => setCategoryId(Number(value))}
                    disabled={isUpdating || !subdepartmentId || categories.length === 0}
                  >
                    <SelectTrigger id="edit-category">
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
                  <Label htmlFor="edit-subcategory">{t("inventory.products.subcategory")}</Label>
                  <Select
                    value={subcategoryId?.toString() || ""}
                    onValueChange={(value) => setSubcategoryId(Number(value))}
                    disabled={isUpdating || !categoryId || subcategories.length === 0}
                  >
                    <SelectTrigger id="edit-subcategory">
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

            {/* Proveedor y Estado */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("inventory.products.additionalInformation")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier">{t("inventory.products.supplier")}</Label>
                  <Select
                    value={supplierId?.toString() || ""}
                    onValueChange={(value) => setSupplierId(Number(value))}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="edit-supplier">
                      <SelectValue placeholder={t("inventory.products.selectSupplier")} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">{t("inventory.products.status")}</Label>
                  <Select
                    value={isActive ? "ACTIVE" : "INACTIVE"}
                    onValueChange={(value) => setIsActive(value === "ACTIVE")}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="edit-status">
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
          </div>
        )}
        
        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isUpdating ||
              !sku.trim() ||
              !name.trim() ||
              !salePrice.trim() ||
              !departmentId
            }
          >
            {isUpdating ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}