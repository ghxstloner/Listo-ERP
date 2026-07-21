"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { getApiCompanyId } from "@config";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGetCompany } from "@/packages/company/api";
import { useGetCountries } from "@/packages/country/api";
import { useCreateCustomer, useUpdateCustomer } from "../api";
import type { CreateCustomerRequest, Customer } from "../types";

interface CustomerFormProps {
  customer?: Customer;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const companyId = Number(getApiCompanyId());
  const [company] = useGetCompany(companyId);
  const [countries] = useGetCountries();
  const [createCustomer, isCreating, createError] = useCreateCustomer();
  const [updateCustomer, isUpdating, updateError] = useUpdateCustomer(
    customer?.id ?? 0,
  );
  const [name, setName] = useState(customer?.name ?? "");
  const [taxDocumentType, setTaxDocumentType] = useState(
    customer?.taxDocumentType ?? "",
  );
  const [taxId, setTaxId] = useState(customer?.taxId ?? "");
  const [isActive, setIsActive] = useState(customer?.isActive ?? true);
  const [isFinalConsumer, setIsFinalConsumer] = useState(
    customer?.isFinalConsumer ?? false,
  );
  const [fiscalPersonType, setFiscalPersonType] = useState(
    customer?.fiscalPersonType ?? "",
  );
  const [taxCheckDigit, setTaxCheckDigit] = useState(
    customer?.taxCheckDigit ?? "",
  );

  const isSaving = isCreating || isUpdating;
  const companyCountry = countries?.find(
    (country) => country.id === company?.countryId,
  );
  const isColombia = companyCountry?.code === "CO";
  const taxDocumentTypes = companyCountry?.taxDocumentTypes ?? [];
  const selectedDocumentType = taxDocumentTypes.find(
    (documentType) => documentType.code === taxDocumentType,
  );

  useEffect(() => {
    const error = createError ?? updateError;
    if (error)
      showToast({
        type: "error",
        message: error.message || "No se pudo guardar el cliente.",
      });
  }, [createError, updateError]);

  const validate = () => {
    if (!name.trim()) {
      showToast({
        type: "error",
        message: "El nombre del cliente es obligatorio.",
      });
      return false;
    }
    if (!isColombia || isFinalConsumer) return true;
    const missingFields = [
      !fiscalPersonType && "tipo de persona",
      !taxDocumentType.trim() && "tipo de identificación",
      !taxId.trim() && "número de documento",
    ].filter(Boolean);
    if (missingFields.length > 0) {
      showToast({
        type: "error",
        message: `Completa para facturación Colombia: ${missingFields.join(", ")}.`,
      });
      return false;
    }
    if (
      selectedDocumentType?.hasCheckDigit &&
      !/^\d$/.test(taxCheckDigit.trim())
    ) {
      showToast({
        type: "error",
        message: "El NIT requiere un dígito de verificación válido.",
      });
      return false;
    }
    return true;
  };

  const handleFinalConsumerChange = (checked: boolean) => {
    setIsFinalConsumer(checked);
    if (checked && !name.trim()) setName("Consumidor Final");
  };

  const handleSave = () => {
    if (!validate()) return;
    const request: CreateCustomerRequest = {
      name: name.trim(),
      isFinalConsumer,
      ...(isFinalConsumer
        ? {}
        : {
            taxDocumentType: taxDocumentType.trim() || undefined,
            taxId: taxId.trim() || undefined,
            fiscalPersonType,
            ...(selectedDocumentType?.hasCheckDigit && {
              taxCheckDigit: taxCheckDigit.trim(),
            }),
          }),
      isActive,
    };
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (customer)
        queryClient.invalidateQueries({ queryKey: ["customers", customer.id] });
      showToast({
        type: "success",
        message: customer
          ? "Cliente actualizado correctamente."
          : "Cliente creado correctamente.",
      });
      if (!customer) router.push("/listoerp/ventas/clientes");
    };
    if (customer) updateCustomer(request, onSuccess);
    else createCustomer(request, onSuccess);
  };

  return (
    <div className="w-full space-y-4 p-2">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{customer ? "Editar cliente" : "Nuevo cliente"}</CardTitle>
          <CardDescription>
            Administra los datos mínimos para facturación electrónica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-2">
            <Label htmlFor="customer-name">Nombre o razón social</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSaving}
            />
          </section>

          {isColombia && (
            <section className="space-y-4 border-t pt-6">
              <div>
                <h2 className="font-medium">Información fiscal Colombia</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Solo se solicitan los datos obligatorios para emitir.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="customer-final-consumer">
                    Consumidor Final
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Úsalo solo cuando el comprador no solicita factura a su
                    nombre.
                  </p>
                </div>
                <Switch
                  id="customer-final-consumer"
                  checked={isFinalConsumer}
                  onCheckedChange={handleFinalConsumerChange}
                  disabled={isSaving}
                />
              </div>
              {!isFinalConsumer && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="customer-person-type">
                      Tipo de persona
                    </Label>
                    <Select
                      value={fiscalPersonType}
                      onValueChange={setFiscalPersonType}
                      disabled={isSaving}
                    >
                      <SelectTrigger
                        id="customer-person-type"
                        className="w-full"
                      >
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Jurídica</SelectItem>
                        <SelectItem value="2">Natural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-document-type">
                      Tipo de identificación
                    </Label>
                    <Select
                      value={taxDocumentType}
                      onValueChange={(value) => {
                        setTaxDocumentType(value);
                        if (
                          !taxDocumentTypes.find(
                            (documentType) => documentType.code === value,
                          )?.hasCheckDigit
                        )
                          setTaxCheckDigit("");
                      }}
                      disabled={isSaving || taxDocumentTypes.length === 0}
                    >
                      <SelectTrigger
                        id="customer-document-type"
                        className="w-full"
                      >
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {taxDocumentTypes.map((documentType) => (
                          <SelectItem
                            key={documentType.code}
                            value={documentType.code}
                          >
                            {documentType.code} - {documentType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-tax-id">Número de documento</Label>
                    <Input
                      id="customer-tax-id"
                      value={taxId}
                      onChange={(event) => setTaxId(event.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  {selectedDocumentType?.hasCheckDigit && (
                    <div className="space-y-2">
                      <Label htmlFor="customer-check-digit">DV para NIT</Label>
                      <Input
                        id="customer-check-digit"
                        inputMode="numeric"
                        maxLength={1}
                        value={taxCheckDigit}
                        onChange={(event) =>
                          setTaxCheckDigit(event.target.value)
                        }
                        disabled={isSaving}
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="flex items-center justify-between border-t pt-6">
            <div>
              <Label htmlFor="customer-active">Cliente activo</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Los clientes inactivos no estarán disponibles en el POS.
              </p>
            </div>
            <Switch
              id="customer-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSaving}
            />
          </section>
          <div className="flex justify-end gap-2 border-t pt-6">
            <Button variant="outline" asChild disabled={isSaving}>
              <Link href="/listoerp/ventas/clientes">Cancelar</Link>
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? "Guardando..."
                : customer
                  ? "Guardar cambios"
                  : "Crear cliente"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
