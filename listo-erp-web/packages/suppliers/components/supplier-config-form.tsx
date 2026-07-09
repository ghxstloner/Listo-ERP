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
import { useUpdateSupplier } from "@/packages/suppliers/api";
import type { Supplier, UpdateSupplierRequest } from "@/packages/suppliers/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

interface SupplierConfigFormProps {
  supplier: Supplier;
  supplierId: number;
}

export function SupplierConfigForm({ supplier, supplierId }: SupplierConfigFormProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [updateSupplier, isUpdating, updateError] = useUpdateSupplier(supplierId);
  const [name, setName] = useState(() => supplier.name ?? "");
  const [taxId, setTaxId] = useState(() => supplier.taxId ?? "");
  const [address, setAddress] = useState(() => supplier.address ?? "");
  const [phone, setPhone] = useState(() => supplier.phone ?? "");
  const [email, setEmail] = useState(() => supplier.email ?? "");
  const [contactName, setContactName] = useState(() => supplier.contactName ?? "");
  const [isActive, setIsActive] = useState(() => supplier.isActive ?? true);

  useEffect(() => {
    if (updateError) {
      showToast({
        type: "error",
        message: (updateError as Error).message || t("common.error"),
      });
    }
  }, [updateError, t]);

  const handleSave = useCallback(() => {
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

    const request: UpdateSupplierRequest = {
      name: name.trim(),
      taxId: taxId.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      contactName: contactName.trim(),
      isActive,
    };

    updateSupplier(request, () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers", supplierId] });
      showToast({
        type: "success",
        message: t("purchases.suppliers.supplierUpdated"),
      });
    });
  }, [supplierId, name, taxId, address, phone, email, contactName, isActive, updateSupplier, queryClient, t]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("purchases.suppliers.supplierInformation")}</CardTitle>
      </CardHeader>
      <CardContent className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="edit-name">{t("purchases.suppliers.name")}</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("purchases.suppliers.namePlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-taxId">{t("purchases.suppliers.taxId")}</Label>
            <Input
              id="edit-taxId"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder={t("purchases.suppliers.taxIdPlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-contactName">{t("purchases.suppliers.contactName")}</Label>
            <Input
              id="edit-contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder={t("purchases.suppliers.contactNamePlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">{t("purchases.suppliers.phone")}</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("purchases.suppliers.phonePlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">{t("purchases.suppliers.email")}</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("purchases.suppliers.emailPlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="edit-address">{t("purchases.suppliers.address")}</Label>
            <Input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("purchases.suppliers.addressPlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("purchases.suppliers.status")}</Label>
            <Select
              value={isActive ? "ACTIVE" : "INACTIVE"}
              onValueChange={(v) => setIsActive(v === "ACTIVE")}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t("purchases.suppliers.active")}</SelectItem>
                <SelectItem value="INACTIVE">{t("purchases.suppliers.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2 text-sm text-muted-foreground">
            {t("purchases.suppliers.createdAt")}: {new Date(supplier.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex justify-end pt-6 mt-6 border-t">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? t("common.saving") : t("company.saveChanges")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
