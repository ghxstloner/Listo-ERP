"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useGetCompanyUsersByCompany } from "@/packages/company-user/api";
import { getApiCompanyId } from "@config";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAssignSellerUsers, useUpdateSeller } from "../api";
import type { Seller, UpdateSellerRequest } from "../types";
import { UserAssignmentList } from "./user-assignment-list";

interface SellerConfigFormProps {
  seller: Seller;
  sellerId: number;
}

export function SellerConfigForm({ seller, sellerId }: SellerConfigFormProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const companyId = Number(getApiCompanyId() ?? 0);
  const [companyUsers = []] = useGetCompanyUsersByCompany(companyId);
  const [updateSeller, isUpdating, updateError] = useUpdateSeller(sellerId);
  const [assignUsers, isAssigning, assignError] =
    useAssignSellerUsers(sellerId);
  const isSaving = isUpdating || isAssigning;
  const [code, setCode] = useState(() => seller.code ?? "");
  const [name, setName] = useState(() => seller.name ?? "");
  const [isActive, setIsActive] = useState(() => seller.isActive ?? true);
  const [userIds, setUserIds] = useState<number[]>(() =>
    seller.sellerUsers.map((sellerUser) => sellerUser.userId),
  );

  useEffect(() => {
    const error = updateError || assignError;
    if (error) {
      showToast({
        type: "error",
        message: (error as Error).message || t("common.error"),
      });
    }
  }, [updateError, assignError, t]);

  const handleSave = () => {
    if (!code.trim() || !name.trim()) {
      showToast({
        type: "error",
        message: t("sales.sellers.validation.required"),
      });
      return;
    }
    if (userIds.length === 0) {
      showToast({
        type: "error",
        message: t("sales.sellers.validation.usersRequired"),
      });
      return;
    }

    const request: UpdateSellerRequest = {
      code: code.trim(),
      name: name.trim(),
      isActive,
    };

    updateSeller(request, () => {
      assignUsers({ userIds }, () => {
        queryClient.invalidateQueries({ queryKey: ["sellers"] });
        queryClient.invalidateQueries({ queryKey: ["sellers", sellerId] });
        showToast({
          type: "success",
          message: t("sales.sellers.sellerUpdated"),
        });
      });
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("sales.sellers.sellerInformation")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-seller-code">{t("sales.sellers.code")}</Label>
            <Input
              id="edit-seller-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-seller-name">{t("sales.sellers.name")}</Label>
            <Input
              id="edit-seller-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("sales.sellers.status")}</Label>
            <Select
              value={isActive ? "ACTIVE" : "INACTIVE"}
              onValueChange={(value) => setIsActive(value === "ACTIVE")}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  {t("sales.sellers.active")}
                </SelectItem>
                <SelectItem value="INACTIVE">
                  {t("sales.sellers.inactive")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("sales.sellers.assignedUsers")}</Label>
            <UserAssignmentList
              companyUsers={companyUsers}
              selectedUserIds={userIds}
              onChange={setUserIds}
              disabled={isSaving}
            />
          </div>
          <div className="text-sm text-muted-foreground md:col-span-2">
            {t("sales.sellers.createdAt")}:{" "}
            {new Date(seller.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex justify-end border-t pt-6">
          <Button
            onClick={handleSave}
            disabled={
              isSaving || !code.trim() || !name.trim() || userIds.length === 0
            }
          >
            {isSaving ? t("common.saving") : t("company.saveChanges")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
