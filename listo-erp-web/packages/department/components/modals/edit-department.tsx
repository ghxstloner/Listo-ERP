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
import { useUpdateDepartment } from "@/packages/department/api";
import type { Department, UpdateDepartmentRequest } from "@/packages/department/types";
import type { HierarchyNames } from "@/packages/company/hooks/use-hierarchy-names";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface EditDepartmentProps {
  editingDepartment: Department | null;
  companyId: number;
  hierarchyNames: HierarchyNames;
  onClose: () => void;
}

export function EditDepartment({
  editingDepartment,
  companyId,
  hierarchyNames,
  onClose,
}: EditDepartmentProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(() => editingDepartment?.name ?? "");
  const [code, setCode] = useState(() => editingDepartment?.code ?? "");
  const [isActive, setIsActive] = useState(() => editingDepartment?.isActive ?? true);
  const [updateDepartment, isUpdating, updateError] = useUpdateDepartment(
    editingDepartment?.id ?? 0
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
    if (!editingDepartment) return;

    if (!name.trim()) {
      showToast({
        type: "error",
        message: `El nombre del ${hierarchyNames.level1.toLowerCase()} es requerido`,
      });
      return;
    }

    if (!code.trim()) {
      showToast({
        type: "error",
        message: "El código es requerido",
      });
      return;
    }

    const request: UpdateDepartmentRequest = {
      name: name.trim(),
      code: code.trim(),
      isActive,
    };

    updateDepartment(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
      onClose();
      showToast({
        type: "success",
        message: `${hierarchyNames.level1} actualizado exitosamente`,
      });
    });
  };

  return (
    <Dialog open={!!editingDepartment} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Editar {hierarchyNames.level1}</DialogTitle>
          <DialogDescription>
            Edita los datos del {hierarchyNames.level1.toLowerCase()}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {editingDepartment && (
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                Información del {hierarchyNames.level1}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`Ingresa el nombre del ${hierarchyNames.level1.toLowerCase()}`}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Código</Label>
                  <Input
                    id="edit-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ingresa el código"
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">
                    {t("company.departments.status")}
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
                        {t("company.departments.active")}
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        {t("company.departments.inactive")}
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
