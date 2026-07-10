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
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useCreateSubCategory } from "@/packages/subcategory/api";
import type { CreateSubCategoryRequest } from "@/packages/subcategory/types";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface CreateSubCategoryProps {
  categoryId: number;
  hierarchyNames?: {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  };
}

export function CreateSubCategory({ categoryId, hierarchyNames: _hierarchyNames }: CreateSubCategoryProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const sortOrder = 0;
  const isActive = true;
  const [createSubCategory, isCreating, createError] = useCreateSubCategory();

  useEffect(() => {
    if (createError) {
      showToast({
        type: "error",
        message: (createError as Error).message || t("common.error"),
      });
    }
  }, [createError, t]);

  const handleReset = () => {
    setName("");
    setCode("");
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  const handleCreateSubCategory = () => {
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

    const request: CreateSubCategoryRequest = {
      name: name.trim(),
      code: code.trim(),
      categoryId, // Automatically assigned
      isActive,
    };

    createSubCategory(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["subcategories", categoryId],
      });
      handleClose();
      showToast({
        type: "success",
        message: t("company.subcategories.subcategoryAdded"),
      });
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {t("company.subcategories.addNewSubCategory")}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("company.subcategories.addNewSubCategory")}</DialogTitle>
            <DialogDescription>
              {t("company.subcategories.addSubCategoryDescription")}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("company.subcategories.subcategoryInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("company.subcategories.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("company.subcategories.namePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">{t("company.subcategories.code")}</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t("company.subcategories.codePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateSubCategory}
              disabled={
                isCreating || !name.trim() || !code.trim()
              }
            >
              {isCreating ? t("common.saving") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
