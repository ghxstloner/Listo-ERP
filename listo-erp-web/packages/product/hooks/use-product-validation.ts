import { useTranslation } from "@/hooks/use-translation";
import { showToast } from "@/components/ui/sonner";

export interface ProductFormData {
  sku: string;
  name: string;
  salePrice: string;
  departmentId: number | null;
}

export function useProductValidation() {
  const t = useTranslation();

  const validateProduct = (
    data: ProductFormData,
    onError: (message: string) => void = (msg) =>
      showToast({ type: "error", message: msg }),
  ): boolean => {
    const { sku, name, salePrice, departmentId } = data;

    if (!sku.trim()) {
      onError(t("inventory.products.validation.skuRequired"));
      return false;
    }

    if (!name.trim()) {
      onError(t("inventory.products.validation.nameRequired"));
      return false;
    }

    if (
      !salePrice.trim() ||
      isNaN(parseFloat(salePrice)) ||
      parseFloat(salePrice) <= 0
    ) {
      onError(t("inventory.products.validation.salePriceRequired"));
      return false;
    }

    if (!departmentId) {
      onError(t("inventory.products.validation.departmentRequired"));
      return false;
    }

    return true;
  };

  const validateProductFields = (
    sku: string,
    name: string,
    salePrice: string,
    departmentId: number | null,
    onError?: (message: string) => void,
  ): boolean => {
    return validateProduct({ sku, name, salePrice, departmentId }, onError);
  };

  return {
    validateProduct,
    validateProductFields,
  };
}

export function useIsFormValid() {
  const { validateProductFields } = useProductValidation();

  return (
    sku: string,
    name: string,
    salePrice: string,
    departmentId: number | null,
  ): boolean => {
    // Silent validation without showing errors
    return validateProductFields(sku, name, salePrice, departmentId, () => {});
  };
}
