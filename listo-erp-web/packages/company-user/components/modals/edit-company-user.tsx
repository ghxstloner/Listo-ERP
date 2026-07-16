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
import { useUpdateCompanyUser } from "@/packages/company-user/api";
import { useGetCompanyRoles } from "@/packages/company/api";
import { RoleSelector } from "@/packages/company/components/role-selector";
import type { CompanyUserWithUser, UpdateCompanyUserRequest } from "@/packages/company-user/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface EditCompanyUserProps {
  editingUser: CompanyUserWithUser | null;
  companyId: number;
  onClose: () => void;
}

export function EditCompanyUser({ editingUser, companyId, onClose }: EditCompanyUserProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [updateCompanyUser, isUpdating] = useUpdateCompanyUser(
    editingUser?.id || 0
  );
  const [roles] = useGetCompanyRoles();

  useEffect(() => setRoleIds(editingUser?.roles.map(({ role }) => role.id) ?? []), [editingUser]);

  const handleUpdateRoles = () => {
    if (!editingUser) return;

    const request: UpdateCompanyUserRequest = {
      roleIds,
    };

    updateCompanyUser(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["companies-users", "company", companyId],
      });
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
                  <Label>{t("company.users.role")}</Label>
                  <RoleSelector roles={roles || []} value={roleIds} onChange={setRoleIds} disabled={isUpdating} />
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="p-4">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            {t("common.cancel")}
          </Button><Button onClick={handleUpdateRoles} disabled={isUpdating}>{isUpdating ? t("common.saving") : t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
