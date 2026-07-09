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
import { useUpdateCategory } from "@/packages/category/api";
import type { Category, UpdateCategoryRequest } from "@/packages/category/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface EditCategoryProps {
  editingCategory: Category | null;
  subdepartmentId: number;
  onClose: () => void;
}

export function EditCategory({
  editingCategory,
  subdepartmentId,
  onClose,
}: EditCategoryProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(() => editingCategory?.name ?? "");
  const [code, setCode] = useState(() => editingCategory?.code ?? "");
  const [isActive, setIsActive] = useState(() => editingCategory?.isActive ?? true);
  const [updateCategory, isUpdating, updateError] = useUpdateCategory(
    editingCategory?.id ?? 0
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
    if (!editingCategory) return;

    if (!name.trim()) {
      showToast({
        type: "error",
        message: t("company.categories.validation.nameRequired"),
      });
      return;
    }

    if (!code.trim()) {
      showToast({
        type: "error",
        message: t("company.categories.validation.codeRequired"),
      });
      return;
    }

    const request: UpdateCategoryRequest = {
      name: name.trim(),
      code: code.trim(),
      isActive,
    };

    updateCategory(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["categories", subdepartmentId],
      });
      onClose();
      showToast({
        type: "success",
        message: t("company.categories.categoryUpdated"),
      });
    });
  };

  return (
    <Dialog open={!!editingCategory} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{t("company.categories.editCategory")}</DialogTitle>
          <DialogDescription>
            {t("company.categories.editCategoryDescription")}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {editingCategory && (
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("company.categories.categoryInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t("company.categories.name")}</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("company.categories.namePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">{t("company.categories.code")}</Label>
                  <Input
                    id="edit-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t("company.categories.codePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">
                    {t("company.categories.status")}
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
                        {t("company.categories.active")}
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        {t("company.categories.inactive")}
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
