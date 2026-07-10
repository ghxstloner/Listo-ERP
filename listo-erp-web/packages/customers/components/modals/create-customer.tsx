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
import { useCreateCustomer } from "@/packages/customers/api";
import type { CreateCustomerRequest } from "@/packages/customers/types";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function CreateCustomer() {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [taxDocumentType, setTaxDocumentType] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [createCustomer, isCreating, createError] = useCreateCustomer();

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
    setTaxDocumentType("");
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

  const handleCreateCustomer = () => {
    if (!name.trim()) {
      showToast({
        type: "error",
        message: t("sales.customers.validation.nameRequired"),
      });
      return;
    }

    const request: CreateCustomerRequest = {
      name: name.trim(),
      taxDocumentType: taxDocumentType.trim() || undefined,
      taxId: taxId.trim() || undefined,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      contactName: contactName.trim() || undefined,
      isActive,
    };

    createCustomer(request, () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      handleClose();
      showToast({
        type: "success",
        message: t("sales.customers.customerAdded"),
      });
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {t("sales.customers.addNewCustomer")}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("sales.customers.addNewCustomer")}</DialogTitle>
            <DialogDescription>{t("sales.customers.addCustomerDescription")}</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-3 px-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t("sales.customers.customerInformation")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customer-name">{t("sales.customers.name")}</Label>
                  <Input
                    id="customer-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("sales.customers.namePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-taxDocumentType">{t("sales.customers.taxDocumentType")}</Label>
                  <Input
                    id="customer-taxDocumentType"
                    value={taxDocumentType}
                    onChange={(e) => setTaxDocumentType(e.target.value)}
                    placeholder={t("sales.customers.taxDocumentTypePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-taxId">{t("sales.customers.taxId")}</Label>
                  <Input
                    id="customer-taxId"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder={t("sales.customers.taxIdPlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-contactName">{t("sales.customers.contactName")}</Label>
                  <Input
                    id="customer-contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t("sales.customers.contactNamePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">{t("sales.customers.phone")}</Label>
                  <Input
                    id="customer-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("sales.customers.phonePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">{t("sales.customers.email")}</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("sales.customers.emailPlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-address">{t("sales.customers.address")}</Label>
                  <Input
                    id="customer-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("sales.customers.addressPlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-status">{t("sales.customers.status")}</Label>
                  <Select
                    value={isActive ? "ACTIVE" : "INACTIVE"}
                    onValueChange={(value) => setIsActive(value === "ACTIVE")}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="customer-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">{t("sales.customers.active")}</SelectItem>
                      <SelectItem value="INACTIVE">{t("sales.customers.inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4">
            <Button variant="outline" onClick={handleClose} disabled={isCreating}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateCustomer} disabled={isCreating || !name.trim()}>
              {isCreating ? t("common.saving") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
