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
import { useCreateDepartment } from "@/packages/department/api";
import type { CreateDepartmentRequest } from "@/packages/department/types";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { HierarchyNames } from "@/packages/company/hooks/use-hierarchy-names";

interface CreateDepartmentProps {
  companyId: number;
  hierarchyNames: HierarchyNames;
}

export function CreateDepartment({ companyId, hierarchyNames }: CreateDepartmentProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const sortOrder = 0;
  const isActive = true;
  const [createDepartment, isCreating, createError] = useCreateDepartment();

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

  const handleCreateDepartment = () => {
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

    const request: CreateDepartmentRequest = {
      name: name.trim(),
      code: code.trim(),
      isActive,
    };

    createDepartment(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
      handleClose();
      showToast({
        type: "success",
        message: `${hierarchyNames.level1} agregado exitosamente`,
      });
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Agregar {hierarchyNames.level1}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Agregar {hierarchyNames.level1}</DialogTitle>
            <DialogDescription>
              Crea un nuevo {hierarchyNames.level1.toLowerCase()} para tu empresa
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                Información del {hierarchyNames.level1}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`Ingresa el nombre del ${hierarchyNames.level1.toLowerCase()}`}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ingresa el código"
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
              onClick={handleCreateDepartment}
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
