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
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useGetCategories } from "@/packages/category/api";
import { useGetDepartments } from "@/packages/department/api";
import { useCreateProduct } from "@/packages/product/api";
import { useProductValidation } from "@/packages/product/hooks/use-product-validation";
import type { CreateProductRequest } from "@/packages/product/types";
import { useGetSubCategories } from "@/packages/subcategory/api";
import { useGetSubDepartments } from "@/packages/subdepartment/api";
import { useGetSuppliers } from "@/packages/suppliers/api";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function CreateProduct() {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const { validateProductFields } = useProductValidation();
  const [isOpen, setIsOpen] = useState(false);

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
  const [supplierId, setSupplierId] = useState<number | null>(null);

  const [createProduct, isCreating, createError] = useCreateProduct();
  const [departmentsResponse] = useGetDepartments();
  const [subdepartmentsResponse] = useGetSubDepartments(departmentId ?? undefined);
  const [categoriesResponse] = useGetCategories(subdepartmentId ?? undefined);
  const [subcategoriesResponse] = useGetSubCategories(categoryId ?? undefined);
  const [suppliers] = useGetSuppliers();

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

  const handleReset = () => {
    setSku("");
    setName("");
    setDescription("");
    setSalePrice("");
    setCostPrice("");
    setTaxRate("");
    setUnit("und");
    setIsActive(true);
    setDepartmentId(null);
    setSubdepartmentId(null);
    setCategoryId(null);
    setSubcategoryId(null);
    setSupplierId(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsOpen(true);
      return;
    }
    handleClose();
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
      taxRate: taxRate ? parseFloat(taxRate) : undefined,
      departmentId: departmentId!,
      subdepartmentId: subdepartmentId ?? undefined,
      categoryId: categoryId ?? undefined,
      subcategoryId: subcategoryId ?? undefined,
      unit: unit.trim() || undefined,
      supplierId: supplierId ?? undefined,
      isActive,
    };

    createProduct(request, () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleClose();
      showToast({
        type: "success",
        message: t("inventory.products.productAdded"),
      });
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
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {t("inventory.products.addNewProduct")}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("inventory.products.addNewProduct")}</DialogTitle>
            <DialogDescription>
              {t("inventory.products.addProductDescription")}
            </DialogDescription>
          </DialogHeader>
          <Separator />

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
                    max="1"
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  <Label htmlFor="supplier">{t("inventory.products.supplier")}</Label>
                  <Select
                    value={supplierId?.toString() || ""}
                    onValueChange={(value) => setSupplierId(Number(value))}
                    disabled={isCreating || !suppliers?.length}
                  >
                    <SelectTrigger id="supplier" className="w-full">
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
                  <Label htmlFor="status">{t("inventory.products.status")}</Label>
                  <Select
                    value={isActive ? "ACTIVE" : "INACTIVE"}
                    onValueChange={(value) => setIsActive(value === "ACTIVE")}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="status" className="w-full">
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

          <DialogFooter className="p-4">
            <Button variant="outline" onClick={handleClose} disabled={isCreating}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateProduct} disabled={isCreating || !formValid}>
              {isCreating ? t("common.saving") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
