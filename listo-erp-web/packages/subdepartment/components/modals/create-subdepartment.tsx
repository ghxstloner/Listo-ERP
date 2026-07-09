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
import { useCreateSubDepartment } from "@/packages/subdepartment/api";
import type { CreateSubDepartmentRequest } from "@/packages/subdepartment/types";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface CreateSubDepartmentProps {
  departmentId: number;
}

export function CreateSubDepartment({ departmentId }: CreateSubDepartmentProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const sortOrder = 0;
  const isActive = true;
  const [createSubDepartment, isCreating, createError] = useCreateSubDepartment();

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

  const handleCreateSubDepartment = () => {
    if (!name.trim()) {
      showToast({
        type: "error",
        message: t("company.subdepartments.validation.nameRequired"),
      });
      return;
    }

    if (!code.trim()) {
      showToast({
        type: "error",
        message: t("company.subdepartments.validation.codeRequired"),
      });
      return;
    }

    const request: CreateSubDepartmentRequest = {
      name: name.trim(),
      code: code.trim(),
      departmentId, // Automatically assigned
      isActive,
    };

    createSubDepartment(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["subdepartments", departmentId],
      });
      handleClose();
      showToast({
        type: "success",
        message: t("company.subdepartments.subdepartmentAdded"),
      });
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {t("company.subdepartments.addNewSubDepartment")}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("company.subdepartments.addNewSubDepartment")}</DialogTitle>
            <DialogDescription>
              {t("company.subdepartments.addSubDepartmentDescription")}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("company.subdepartments.subdepartmentInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("company.subdepartments.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("company.subdepartments.namePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">{t("company.subdepartments.code")}</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t("company.subdepartments.codePlaceholder")}
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
              onClick={handleCreateSubDepartment}
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
