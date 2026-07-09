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
import { useUpdateWarehouse } from "@/packages/warehouse/api";
import type { UpdateWarehouseRequest, Warehouse } from "@/packages/warehouse/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface EditWarehouseProps {
  editingWarehouse: Warehouse | null;
  companyId: number;
  onClose: () => void;
}

export function EditWarehouse({
  editingWarehouse,
  companyId,
  onClose,
}: EditWarehouseProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(() => editingWarehouse?.name ?? "");
  const [code, setCode] = useState(() => editingWarehouse?.code ?? "");
  const [address, setAddress] = useState(() => editingWarehouse?.address ?? "");
  const [isActive, setIsActive] = useState(() => editingWarehouse?.isActive ?? true);
  const [updateWarehouse, isUpdating, updateError] = useUpdateWarehouse(
    editingWarehouse?.id ?? 0
  );

  useEffect(() => {
    if (updateError) {
      showToast({
        type: "error",
        message: (updateError as Error).message || t("common.error"),
      });
    }
  }, [updateError, t]);

  useEffect(() => {
    if (editingWarehouse) {
      setName(editingWarehouse.name ?? "");
      setCode(editingWarehouse.code ?? "");
      setAddress(editingWarehouse.address ?? "");
      setIsActive(editingWarehouse.isActive ?? true);
    }
  }, [editingWarehouse]);

  const handleSave = () => {
    if (!editingWarehouse) return;

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

    const request: UpdateWarehouseRequest = {
      name: name.trim(),
      code: code.trim(),
      address: address.trim(),
      isActive,
    };

    updateWarehouse(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouses"],
      });
      onClose();
      showToast({
        type: "success",
        message: t("company.warehouses.warehouseUpdated"),
      });
    });
  };

  return (
    <Dialog open={!!editingWarehouse} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{t("company.warehouses.editWarehouse")}</DialogTitle>
          <DialogDescription>
            {t("company.warehouses.editWarehouseDescription")}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {editingWarehouse && (
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("company.warehouses.warehouseInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-name">{t("company.warehouses.name")}</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("company.warehouses.namePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">{t("company.warehouses.code")}</Label>
                  <Input
                    id="edit-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t("company.warehouses.codePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">
                    {t("company.warehouses.status")}
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
                        {t("company.warehouses.active")}
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        {t("company.warehouses.inactive")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-address">
                    {t("company.warehouses.address")}
                  </Label>
                  <Input
                    id="edit-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("company.warehouses.addressPlaceholder")}
                    disabled={isUpdating}
                  />
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
              !code.trim() ||
              !address.trim()
            }
          >
            {isUpdating ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
