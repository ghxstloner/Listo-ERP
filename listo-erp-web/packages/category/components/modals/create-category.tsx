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
import { useCreateCategory } from "@/packages/category/api";
import type { CreateCategoryRequest } from "@/packages/category/types";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface CreateCategoryProps {
  subdepartmentId: number;
}

export function CreateCategory({ subdepartmentId }: CreateCategoryProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const sortOrder = 0;
  const isActive = true;
  const [createCategory, isCreating, createError] = useCreateCategory();

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

  const handleCreateCategory = () => {
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

    const request: CreateCategoryRequest = {
      name: name.trim(),
      code: code.trim(),
      subdepartmentId, // Automatically assigned
      isActive,
    };

    createCategory(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["categories", subdepartmentId],
      });
      handleClose();
      showToast({
        type: "success",
        message: t("company.categories.categoryAdded"),
      });
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {t("company.categories.addNewCategory")}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("company.categories.addNewCategory")}</DialogTitle>
            <DialogDescription>
              {t("company.categories.addCategoryDescription")}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("company.categories.categoryInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("company.categories.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("company.categories.namePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">{t("company.categories.code")}</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t("company.categories.codePlaceholder")}
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
              onClick={handleCreateCategory}
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
