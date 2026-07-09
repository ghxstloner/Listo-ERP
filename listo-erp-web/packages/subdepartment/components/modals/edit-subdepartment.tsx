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
import { useUpdateSubDepartment } from "@/packages/subdepartment/api";
import type { SubDepartment, UpdateSubDepartmentRequest } from "@/packages/subdepartment/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface EditSubDepartmentProps {
  editingSubDepartment: SubDepartment | null;
  departmentId: number;
  onClose: () => void;
}

export function EditSubDepartment({
  editingSubDepartment,
  departmentId,
  onClose,
}: EditSubDepartmentProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(() => editingSubDepartment?.name ?? "");
  const [code, setCode] = useState(() => editingSubDepartment?.code ?? "");
  const [isActive, setIsActive] = useState(() => editingSubDepartment?.isActive ?? true);
  const [updateSubDepartment, isUpdating, updateError] = useUpdateSubDepartment(
    editingSubDepartment?.id ?? 0
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
    if (!editingSubDepartment) return;

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

    const request: UpdateSubDepartmentRequest = {
      name: name.trim(),
      code: code.trim(),
      isActive,
    };

    updateSubDepartment(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["subdepartments", departmentId],
      });
      onClose();
      showToast({
        type: "success",
        message: t("company.subdepartments.subdepartmentUpdated"),
      });
    });
  };

  return (
    <Dialog open={!!editingSubDepartment} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{t("company.subdepartments.editSubDepartment")}</DialogTitle>
          <DialogDescription>
            {t("company.subdepartments.editSubDepartmentDescription")}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {editingSubDepartment && (
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("company.subdepartments.subdepartmentInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t("company.subdepartments.name")}</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("company.subdepartments.namePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">{t("company.subdepartments.code")}</Label>
                  <Input
                    id="edit-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t("company.subdepartments.codePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">
                    {t("company.subdepartments.status")}
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
                        {t("company.subdepartments.active")}
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        {t("company.subdepartments.inactive")}
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
