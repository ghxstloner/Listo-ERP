"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useUpdateBranch } from "@/packages/branch/api";
import type { Branch, UpdateBranchRequest } from "@/packages/branch/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface BranchConfigFormProps {
  branch: Branch;
  companyId: number;
  onSuccess?: () => void;
}

export function BranchConfigForm({
  branch,
  companyId,
  onSuccess,
}: BranchConfigFormProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(() => branch.name ?? "");
  const [address, setAddress] = useState(() => branch.address ?? "");
  const [phone, setPhone] = useState(() => branch.phone ?? "");
  const [isActive, setIsActive] = useState(() => branch.isActive ?? true);
  const [updateBranch, isUpdating, updateError] = useUpdateBranch(branch.id);

  useEffect(() => {
    if (updateError) {
      showToast({
        type: "error",
        message: (updateError as Error).message || t("common.error"),
      });
    }
  }, [updateError, t]);

  const handleSave = () => {
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
      queryClient.invalidateQueries({
        queryKey: ["branches", branch.id],
      });
      showToast({
        type: "success",
        message: t("company.branches.branchUpdated"),
      });
      onSuccess?.();
    });
  };

  return (
    <div className="space-y-6 rounded-lg border bg-card p-4">
      <h3 className="text-sm font-medium">
        {t("company.branches.branchInformation")}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="branch-name">{t("company.branches.name")}</Label>
          <Input
            id="branch-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("company.branches.namePlaceholder")}
            disabled={isUpdating}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="branch-address">{t("company.branches.address")}</Label>
          <Input
            id="branch-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("company.branches.addressPlaceholder")}
            disabled={isUpdating}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-phone">{t("company.branches.phone")}</Label>
          <Input
            id="branch-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("company.branches.phonePlaceholder")}
            disabled={isUpdating}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-status">{t("company.branches.status")}</Label>
          <Select
            value={isActive ? "ACTIVE" : "INACTIVE"}
            onValueChange={(value) => setIsActive(value === "ACTIVE")}
            disabled={isUpdating}
          >
            <SelectTrigger id="branch-status" className="w-full">
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
      <div className="flex justify-end">
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
      </div>
    </div>
  );
}
