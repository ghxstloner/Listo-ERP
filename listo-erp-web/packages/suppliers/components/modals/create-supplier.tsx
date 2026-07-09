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
import { useCreateSupplier } from "@/packages/suppliers/api";
import type { CreateSupplierRequest } from "@/packages/suppliers/types";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function CreateSupplier() {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [createSupplier, isCreating, createError] = useCreateSupplier();

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
    setTaxId("");
    setAddress("");
    setPhone("");
    setEmail("");
    setContactName("");
    setIsActive(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  const handleCreateSupplier = () => {
    if (!name.trim()) {
      showToast({
        type: "error",
        message: t("purchases.suppliers.validation.nameRequired"),
      });
      return;
    }

    if (!taxId.trim()) {
      showToast({
        type: "error",
        message: t("purchases.suppliers.validation.taxIdRequired"),
      });
      return;
    }

    if (!address.trim()) {
      showToast({
        type: "error",
        message: t("purchases.suppliers.validation.addressRequired"),
      });
      return;
    }

    if (!phone.trim()) {
      showToast({
        type: "error",
        message: t("purchases.suppliers.validation.phoneRequired"),
      });
      return;
    }

    if (!email.trim()) {
      showToast({
        type: "error",
        message: t("purchases.suppliers.validation.emailRequired"),
      });
      return;
    }

    if (!contactName.trim()) {
      showToast({
        type: "error",
        message: t("purchases.suppliers.validation.contactNameRequired"),
      });
      return;
    }

    const request: CreateSupplierRequest = {
      name: name.trim(),
      taxId: taxId.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      contactName: contactName.trim(),
      isActive,
    };

    createSupplier(request, () => {
      queryClient.invalidateQueries({
        queryKey: ["suppliers"],
      });
      handleClose();
      showToast({
        type: "success",
        message: t("purchases.suppliers.supplierAdded"),
      });
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {t("purchases.suppliers.addNewSupplier")}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("purchases.suppliers.addNewSupplier")}</DialogTitle>
            <DialogDescription>
              {t("purchases.suppliers.addSupplierDescription")}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("purchases.suppliers.supplierInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">{t("purchases.suppliers.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("purchases.suppliers.namePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">{t("purchases.suppliers.taxId")}</Label>
                  <Input
                    id="taxId"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder={t("purchases.suppliers.taxIdPlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">{t("purchases.suppliers.contactName")}</Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t("purchases.suppliers.contactNamePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("purchases.suppliers.phone")}</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("purchases.suppliers.phonePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("purchases.suppliers.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("purchases.suppliers.emailPlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("purchases.suppliers.address")}</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("purchases.suppliers.addressPlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{t("purchases.suppliers.status")}</Label>
                  <Select
                    value={isActive ? "ACTIVE" : "INACTIVE"}
                    onValueChange={(value) => setIsActive(value === "ACTIVE")}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">
                        {t("purchases.suppliers.active")}
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        {t("purchases.suppliers.inactive")}
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
              onClick={handleCreateSupplier}
              disabled={
                isCreating || !name.trim() || !taxId.trim() || !address.trim() || !phone.trim() || !email.trim() || !contactName.trim()
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
