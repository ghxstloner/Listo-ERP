"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { showToast } from "@/components/ui/sonner";
import { useCreateTax, useUpdateTax } from "@/packages/company/api";
import type { Tax } from "@/packages/company/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompanyTaxForm({ tax }: { tax?: Tax }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState(tax?.name ?? "");
  const [ratePercentage, setRatePercentage] = useState<number | string>(
    tax
      ? Number(tax.rate) > 1
        ? Number(tax.rate)
        : Number(tax.rate) * 100
      : "",
  );
  const [isActive, setIsActive] = useState(tax?.isActive ?? true);

  const [createTax, isCreating] = useCreateTax();
  const [updateTax, isUpdating] = useUpdateTax(tax?.id ?? 0);
  const isSaving = isCreating || isUpdating;

  const save = () => {
    if (!name.trim()) {
      showToast({ type: "error", message: "El nombre del impuesto es obligatorio." });
      return;
    }

    const rateNumber = parseFloat(String(ratePercentage));
    if (isNaN(rateNumber) || rateNumber < 0) {
      showToast({ type: "error", message: "La tasa debe ser mayor o igual a 0." });
      return;
    }

    const payload = {
      name: name.trim(),
      rate: rateNumber / 100,
      isActive,
    };

    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
      showToast({
        type: "success",
        message: tax ? "Impuesto actualizado correctamente." : "Impuesto creado correctamente.",
      });
      router.push("/listoerp/company?tab=taxes");
    };

    if (tax) {
      updateTax(payload, onSuccess);
    } else {
      createTax(payload, onSuccess);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del impuesto</CardTitle>
          <CardDescription>
            Configura el nombre, la tasa porcentual y el estado del impuesto.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tax-name">Nombre</Label>
            <Input
              id="tax-name"
              placeholder="Ej. ITBMS 7%, IVA 19%"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSaving}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax-rate">Tasa (%)</Label>
            <Input
              id="tax-rate"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej. 7"
              value={ratePercentage}
              onChange={(event) => setRatePercentage(event.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3 md:col-span-2">
            <div>
              <Label htmlFor="tax-active">Impuesto activo</Label>
              <p className="text-sm text-muted-foreground">
                Los impuestos inactivos no estarán disponibles para asignar a productos o servicios.
              </p>
            </div>
            <Switch
              id="tax-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/listoerp/company?tab=taxes")}
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button onClick={save} disabled={isSaving || !name.trim()}>
          {isSaving ? "Guardando..." : "Guardar impuesto"}
        </Button>
      </div>
    </div>
  );
}
