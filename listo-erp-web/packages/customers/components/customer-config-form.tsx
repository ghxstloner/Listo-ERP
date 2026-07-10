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
import { useUpdateCustomer } from "@/packages/customers/api";
import type { Customer, UpdateCustomerRequest } from "@/packages/customers/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

interface CustomerConfigFormProps {
  customer: Customer;
  customerId: number;
}

export function CustomerConfigForm({ customer, customerId }: CustomerConfigFormProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [updateCustomer, isUpdating, updateError] = useUpdateCustomer(customerId);
  const [name, setName] = useState(() => customer.name ?? "");
  const [taxDocumentType, setTaxDocumentType] = useState(() => customer.taxDocumentType ?? "");
  const [taxId, setTaxId] = useState(() => customer.taxId ?? "");
  const [address, setAddress] = useState(() => customer.address ?? "");
  const [phone, setPhone] = useState(() => customer.phone ?? "");
  const [email, setEmail] = useState(() => customer.email ?? "");
  const [contactName, setContactName] = useState(() => customer.contactName ?? "");
  const [isActive, setIsActive] = useState(() => customer.isActive ?? true);

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
        message: t("sales.customers.validation.nameRequired"),
      });
      return;
    }

    const request: UpdateCustomerRequest = {
      name: name.trim(),
      taxDocumentType: taxDocumentType.trim() || undefined,
      taxId: taxId.trim() || undefined,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      contactName: contactName.trim() || undefined,
      isActive,
    };

    updateCustomer(request, () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", customerId] });
      showToast({
        type: "success",
        message: t("sales.customers.customerUpdated"),
      });
    });
  }, [customerId, name, taxDocumentType, taxId, address, phone, email, contactName, isActive, updateCustomer, queryClient, t]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("sales.customers.customerInformation")}</CardTitle>
      </CardHeader>
      <CardContent className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="edit-customer-name">{t("sales.customers.name")}</Label>
            <Input
              id="edit-customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("sales.customers.namePlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-customer-taxDocumentType">{t("sales.customers.taxDocumentType")}</Label>
            <Input
              id="edit-customer-taxDocumentType"
              value={taxDocumentType}
              onChange={(e) => setTaxDocumentType(e.target.value)}
              placeholder={t("sales.customers.taxDocumentTypePlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-customer-taxId">{t("sales.customers.taxId")}</Label>
            <Input
              id="edit-customer-taxId"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder={t("sales.customers.taxIdPlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-customer-contactName">{t("sales.customers.contactName")}</Label>
            <Input
              id="edit-customer-contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder={t("sales.customers.contactNamePlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-customer-phone">{t("sales.customers.phone")}</Label>
            <Input
              id="edit-customer-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("sales.customers.phonePlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-customer-email">{t("sales.customers.email")}</Label>
            <Input
              id="edit-customer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("sales.customers.emailPlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-customer-address">{t("sales.customers.address")}</Label>
            <Input
              id="edit-customer-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("sales.customers.addressPlaceholder")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("sales.customers.status")}</Label>
            <Select
              value={isActive ? "ACTIVE" : "INACTIVE"}
              onValueChange={(value) => setIsActive(value === "ACTIVE")}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t("sales.customers.active")}</SelectItem>
                <SelectItem value="INACTIVE">{t("sales.customers.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2 text-sm text-muted-foreground">
            {t("sales.customers.createdAt")}: {new Date(customer.createdAt).toLocaleDateString()}
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
