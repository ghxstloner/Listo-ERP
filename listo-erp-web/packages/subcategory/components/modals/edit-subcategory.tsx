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
import { useUpdateSubCategory } from "@/packages/subcategory/api";
import type { SubCategory, UpdateSubCategoryRequest } from "@/packages/subcategory/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface EditSubCategoryProps {
  editingSubCategory: SubCategory | null;
  categoryId: number;
  onClose: () => void;
}

export function EditSubCategory({
  editingSubCategory,
  categoryId,
  onClose,
}: EditSubCategoryProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(() => editingSubCategory?.name ?? "");
  const [code, setCode] = useState(() => editingSubCategory?.code ?? "");
  const [isActive, setIsActive] = useState(() => editingSubCategory?.isActive ?? true);
  const [updateSubCategory, isUpdating, updateError] = useUpdateSubCategory(
    editingSubCategory?.id ?? 0
  );

  useEffect(() => {
    if (updateError) {
      showToast({
        type: "error",
        message: (updateError as Error).message || t("common.error"),
      });
    }
  }, [updateError, t]);

  const handleSave = () => {
    if (!editingSubCategory) return;

    if (!name.trim()) {
      showToast({
        type: "error",
        message: t("company.subcategories.validation.nameRequired"),
      });
      return;
    }

    if (!code.trim()) {
      showToast({
        type: "error",
        message: t("company.subcategories.validation.codeRequired"),
      });
      return;
    }

    const request: UpdateSubCategoryRequest = {
      name: name.trim(),
      code: code.trim(),
      isActive,
    };

    updateSubCategory(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["subcategories", categoryId],
      });
      onClose();
      showToast({
        type: "success",
        message: t("company.subcategories.subcategoryUpdated"),
      });
    });
  };

  return (
    <Dialog open={!!editingSubCategory} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{t("company.subcategories.editSubCategory")}</DialogTitle>
          <DialogDescription>
            {t("company.subcategories.editSubCategoryDescription")}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {editingSubCategory && (
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("company.subcategories.subcategoryInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t("company.subcategories.name")}</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("company.subcategories.namePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">{t("company.subcategories.code")}</Label>
                  <Input
                    id="edit-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t("company.subcategories.codePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">
                    {t("company.subcategories.status")}
                  </Label>
                  <Select
                    value={isActive ? "ACTIVE" : "INACTIVE"}
                    onValueChange={(value) => setIsActive(value === "ACTIVE")}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="edit-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">
                        {t("company.subcategories.active")}
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        {t("company.subcategories.inactive")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="p-4">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isUpdating ||
              !name.trim() ||
              !code.trim()
            }
          >
            {isUpdating ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
