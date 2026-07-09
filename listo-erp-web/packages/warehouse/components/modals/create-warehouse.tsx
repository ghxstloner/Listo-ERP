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
import { useCreateWarehouse } from "@/packages/warehouse/api";
import type { CreateWarehouseRequest } from "@/packages/warehouse/types";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface CreateWarehouseProps {
  companyId: number;
}

export function CreateWarehouse({ companyId }: CreateWarehouseProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [createWarehouse, isCreating, createError] = useCreateWarehouse();

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
    setAddress("");
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  const handleCreateWarehouse = () => {
    if (!name.trim()) {
      showToast({
        type: "error",
        message: t("company.warehouses.validation.nameRequired"),
      });
      return;
    }

    if (!code.trim()) {
      showToast({
        type: "error",
        message: t("company.warehouses.validation.codeRequired"),
      });
      return;
    }

    if (!address.trim()) {
      showToast({
        type: "error",
        message: t("company.warehouses.validation.addressRequired"),
      });
      return;
    }

    const request: CreateWarehouseRequest = {
      name: name.trim(),
      code: code.trim(),
      address: address.trim(),
      isActive: true,
    };

    createWarehouse(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouses"],
      });
      handleClose();
      showToast({
        type: "success",
        message: t("company.warehouses.warehouseAdded"),
      });
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {t("company.warehouses.addNewWarehouse")}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("company.warehouses.addNewWarehouse")}</DialogTitle>
            <DialogDescription>
              {t("company.warehouses.addWarehouseDescription")}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("company.warehouses.warehouseInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">{t("company.warehouses.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("company.warehouses.namePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="code">{t("company.warehouses.code")}</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t("company.warehouses.codePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">{t("company.warehouses.address")}</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("company.warehouses.addressPlaceholder")}
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
              onClick={handleCreateWarehouse}
              disabled={
                isCreating || !name.trim() || !code.trim() || !address.trim()
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
