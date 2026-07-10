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
import { useGetCompanyUsersByCompany } from "@/packages/company-user/api";
import { getApiCompanyId } from "@config";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCreateSeller } from "../../api";
import type { CreateSellerRequest } from "../../types";
import { UserAssignmentList } from "../user-assignment-list";

export function CreateSeller() {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const companyId = Number(getApiCompanyId() ?? 0);
  const [companyUsers = []] = useGetCompanyUsersByCompany(companyId);
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [userIds, setUserIds] = useState<number[]>([]);
  const [createSeller, isCreating, createError] = useCreateSeller();

  useEffect(() => {
    if (createError) {
      showToast({
        type: "error",
        message: (createError as Error).message || t("common.error"),
      });
    }
  }, [createError, t]);

  const handleReset = () => {
    setCode("");
    setName("");
    setIsActive(true);
    setUserIds([]);
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  const handleCreateSeller = () => {
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

    const request: CreateSellerRequest = {
      code: code.trim(),
      name: name.trim(),
      isActive,
      userIds,
    };

    createSeller(request, () => {
      queryClient.invalidateQueries({ queryKey: ["sellers"] });
      handleClose();
      showToast({ type: "success", message: t("sales.sellers.sellerAdded") });
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {t("sales.sellers.addNewSeller")}
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}
      >
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("sales.sellers.addNewSeller")}</DialogTitle>
            <DialogDescription>
              {t("sales.sellers.addSellerDescription")}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto px-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seller-code">{t("sales.sellers.code")}</Label>
              <Input
                id="seller-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller-name">{t("sales.sellers.name")}</Label>
              <Input
                id="seller-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller-status">
                {t("sales.sellers.status")}
              </Label>
              <Select
                value={isActive ? "ACTIVE" : "INACTIVE"}
                onValueChange={(value) => setIsActive(value === "ACTIVE")}
                disabled={isCreating}
              >
                <SelectTrigger id="seller-status" className="w-full">
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
                disabled={isCreating}
              />
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
              onClick={handleCreateSeller}
              disabled={
                isCreating ||
                !code.trim() ||
                !name.trim() ||
                userIds.length === 0
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
