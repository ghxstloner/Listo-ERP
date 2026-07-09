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
import type { CompanyUserRole } from "@/packages/company-user/types";
import { useCreateUser } from "@/packages/user/api";
import type { CreateUserRequest } from "@/packages/user/types";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface CreateCompanyUserProps {
  companyId: number;
}

export function CreateCompanyUser({ companyId }: CreateCompanyUserProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyRole, setCompanyRole] = useState<CompanyUserRole>("USER");
  const [createUser, isCreatingUser, createUserError] = useCreateUser();

  const isCreating = isCreatingUser;

  useEffect(() => {
    if (createUserError) {
      showToast({
        type: "error",
        message: createUserError.message || t("company.users.userCreated"),
      });
    }
  }, [createUserError, t]);

  const handleReset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setCompanyRole("USER");
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  const handleCreateUser = () => {
    if (!name.trim()) {
      showToast({
        type: "error",
        message: t("company.users.validation.fullNameRequired"),
      });
      return;
    }

    if (!email.trim()) {
      showToast({
        type: "error",
        message: t("company.users.validation.emailRequired"),
      });
      return;
    }

    if (!password || password.length < 6) {
      showToast({
        type: "error",
        message: t("company.users.validation.passwordMinLength"),
      });
      return;
    }
    const userRequest: CreateUserRequest = {
      name: name.trim(),
      email: email.trim(),
      password,
      role: companyRole,
    };
    createUser(userRequest, () => {
      queryClient.invalidateQueries({
        queryKey: ["companies-users", "company", companyId],
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleClose();
      showToast({
        type: "success",
        message: t("company.users.userAdded"),
      });
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {t("company.users.addNewUser")}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("company.users.addNewUser")}</DialogTitle>
            <DialogDescription>
              {t("company.users.addUserDescription")}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t("company.users.userInformation")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">{t("company.users.fullName")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("company.users.fullNamePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("company.users.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("company.users.emailPlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("company.users.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("company.users.passwordPlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="company-role">{t("company.users.role")}</Label>
                  <Select
                    value={companyRole}
                    onValueChange={(value) =>
                      setCompanyRole(value as CompanyUserRole)
                    }
                    disabled={isCreating}
                  >
                    <SelectTrigger id="company-role" className="w-full">
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
          <DialogFooter className="p-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={isCreating || !name.trim() || !email.trim() || !password}
            >
              {isCreating ? t("common.saving") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
