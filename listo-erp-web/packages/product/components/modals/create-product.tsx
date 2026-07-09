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
import { useCreateProduct } from "@/packages/product/api";
import type { CreateProductRequest } from "@/packages/product/types";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { useProductValidation, useIsFormValid } from "@/packages/product/hooks/use-product-validation";

export function CreateProduct() {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const { validateProductFields } = useProductValidation();
  const isFormValid = useIsFormValid();
  const [isOpen, setIsOpen] = useState(false);
  
  // Campos obligatorios únicamente
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  
  const [createProduct, isCreating, createError] = useCreateProduct();
  
  // Fetch departments
  const [departmentsResponse] = useGetDepartments();
  const departments = departmentsResponse?.data ?? [];

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
    setSalePrice("");
    setDepartmentId(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  const handleCreateProduct = () => {
    if (!validateProductFields(sku, name, salePrice, departmentId)) {
      return;
    }

    const request: CreateProductRequest = {
      sku: sku.trim(),
      name: name.trim(),
      salePrice: parseFloat(salePrice),
      departmentId: departmentId!,
    };

    createProduct(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      handleClose();
      showToast({
        type: "success",
        message: t("inventory.products.productAdded"),
      });
    });
  };

  const formValid = useMemo(
    () => isFormValid(sku, name, salePrice, departmentId),
    [sku, name, salePrice, departmentId, isFormValid]
  );

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {t("inventory.products.addNewProduct")}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{t("inventory.products.addNewProduct")}</DialogTitle>
            <DialogDescription>
              {t("inventory.products.addProductDescription")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {/* Información Básica - Grid de 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Precio - Grid de 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
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
                <Label htmlFor="department">
                  {t("inventory.products.department")} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={departmentId?.toString() || ""}
                  onValueChange={(value) => setDepartmentId(Number(value))}
                  disabled={isCreating}
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
            </div>

            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> {t("common.requiredFields")}
            </p>
          </div>

          <DialogFooter className="p-6 pt-0">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={isCreating || !formValid}
            >
              {isCreating ? t("common.saving") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}