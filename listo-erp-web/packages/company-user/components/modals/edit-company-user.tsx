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
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useUpdateCompanyUser } from "@/packages/company-user/api";
import type {
  CompanyUserRole,
  CompanyUserWithUser,
  UpdateCompanyUserRequest,
} from "@/packages/company-user/types";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface EditCompanyUserProps {
  editingUser: CompanyUserWithUser | null;
  companyId: number;
  onClose: () => void;
}

export function EditCompanyUser({ editingUser, companyId, onClose }: EditCompanyUserProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [pendingRole, setPendingRole] = useState<CompanyUserRole | null>(null);
  const [updateCompanyUser, isUpdating] = useUpdateCompanyUser(
    editingUser?.id || 0
  );

  const handleRoleChange = (newRole: CompanyUserRole) => {
    if (!editingUser) return;
    if (newRole !== editingUser.role) {
      setPendingRole(newRole);
    }
  };

  const handleConfirmUpdateRole = () => {
    if (!editingUser || !pendingRole) return;

    const request: UpdateCompanyUserRequest = {
      role: pendingRole,
    };

    updateCompanyUser(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["companies-users", "company", companyId],
      });
      setPendingRole(null);
      onClose();
      showToast({
        type: "success",
        message: t("company.users.userUpdated"),
      });
    });
  };

  return (
    <Dialog open={!!editingUser} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{t("company.users.editUser")}</DialogTitle>
          <DialogDescription>
            {t("company.users.editRoleDescription")}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {editingUser && (
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t("company.users.userInformation")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-name">{t("company.users.username")}</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.user.name}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">{t("company.users.email")}</Label>
                  <Input
                    id="edit-email"
                    value={editingUser.user.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role-select">{t("company.users.role")}</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => {
                      handleRoleChange(value as CompanyUserRole);
                    }}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="edit-role-select" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">
                        {t("company.users.roleAdmin")}
                      </SelectItem>
                      <SelectItem value="USER">
                        {t("company.users.roleUser")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="p-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
          >
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
      <ConfirmDialog
        open={!!pendingRole}
        onOpenChange={(open) => !open && setPendingRole(null)}
        onConfirm={handleConfirmUpdateRole}
        title={t("company.users.confirmEdit")}
        description={t("company.users.confirmEditMessage")}
        confirmText={t("common.save")}
        cancelText={t("common.cancel")}
        severity="warning"
        isLoading={isUpdating}
      />
    </Dialog>
  );
}
