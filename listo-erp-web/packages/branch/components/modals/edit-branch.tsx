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
import { useUpdateBranch } from "@/packages/branch/api";
import type { Branch, UpdateBranchRequest } from "@/packages/branch/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface EditBranchProps {
  editingBranch: Branch | null;
  companyId: number;
  onClose: () => void;
}

export function EditBranch({
  editingBranch,
  companyId,
  onClose,
}: EditBranchProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(() => editingBranch?.name ?? "");
  const [address, setAddress] = useState(() => editingBranch?.address ?? "");
  const [phone, setPhone] = useState(() => editingBranch?.phone ?? "");
  const [isActive, setIsActive] = useState(() => editingBranch?.isActive ?? true);
  const [updateBranch, isUpdating, updateError] = useUpdateBranch(
    editingBranch?.id ?? 0
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
    if (!editingBranch) return;

    if (!name.trim()) {
      showToast({
        type: "error",
        message: t("company.branches.validation.nameRequired"),
      });
      return;
    }

    if (!address.trim()) {
      showToast({
        type: "error",
        message: t("company.branches.validation.addressRequired"),
      });
      return;
    }

    if (!phone.trim()) {
      showToast({
        type: "error",
        message: t("company.branches.validation.phoneRequired"),
      });
      return;
    }

    const request: UpdateBranchRequest = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      isActive,
    };

    updateBranch(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["branches", "company", companyId],
      });
      onClose();
      showToast({
        type: "success",
        message: t("company.branches.branchUpdated"),
      });
    });
  };

  return (
    <Dialog open={!!editingBranch} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{t("company.branches.editBranch")}</DialogTitle>
          <DialogDescription>
            {t("company.branches.editBranchDescription")}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {editingBranch && (
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("company.branches.branchInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-name">{t("company.branches.name")}</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("company.branches.namePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-address">
                    {t("company.branches.address")}
                  </Label>
                  <Input
                    id="edit-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("company.branches.addressPlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">{t("company.branches.phone")}</Label>
                  <Input
                    id="edit-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("company.branches.phonePlaceholder")}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">
                    {t("company.branches.status")}
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
                        {t("company.branches.active")}
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        {t("company.branches.inactive")}
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
              !address.trim() ||
              !phone.trim()
            }
          >
            {isUpdating ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
