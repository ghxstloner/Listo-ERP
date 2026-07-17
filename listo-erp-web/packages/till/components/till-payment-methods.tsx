"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPaymentMethodImageUrl, useGetPaymentMethods } from "@/packages/payment-methods/api";
import { useUpdateTill } from "@/packages/till/api";
import type { Till } from "@/packages/till/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface TillPaymentMethodsProps {
  till: Till;
}

export function TillPaymentMethods({ till }: TillPaymentMethodsProps) {
  const queryClient = useQueryClient();
  const [paymentMethods, isLoading, error] = useGetPaymentMethods();
  const [selectedIds, setSelectedIds] = useState(() =>
    (till.paymentMethods ?? []).map(({ paymentMethod }) => paymentMethod.id),
  );
  const [updateTill, isUpdating, updateError] = useUpdateTill(till.id);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["tills"] });
    queryClient.invalidateQueries({ queryKey: ["tills", till.id] });
  };

  const toggleMethod = (id: number) => {
    const nextSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter((currentId) => currentId !== id)
      : [...selectedIds, id];

    updateTill({ paymentMethodIds: nextSelectedIds }, () => {
      setSelectedIds(nextSelectedIds);
      invalidate();
      showToast({ type: "success", message: "Métodos de pago actualizados." });
    });
  };

  useEffect(() => {
    if (updateError) showToast({ type: "error", message: updateError.message });
  }, [updateError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Activa los métodos de pago disponibles para esta caja.
        </p>
        {error && <p className="text-destructive text-sm">{error.message}</p>}
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-14">Imagen</TableHead>
                <TableHead>Método de pago</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Estado global</TableHead>
                <TableHead className="w-28">En esta caja</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(paymentMethods ?? []).map((method) => (
                <TableRow key={method.id}>
                  <TableCell>
                    {method.image ? <img src={getPaymentMethodImageUrl(method.image)} alt="" className="h-9 w-9 rounded object-contain" /> : <div className="flex h-9 w-9 items-center justify-center rounded bg-muted text-xs font-semibold">{method.code.slice(0, 2)}</div>}
                  </TableCell>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell className="font-mono text-xs">{method.code}</TableCell>
                  <TableCell>{method.isActive ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell><Switch checked={selectedIds.includes(method.id)} onCheckedChange={() => toggleMethod(method.id)} disabled={isUpdating} aria-label={`${selectedIds.includes(method.id) ? "Desactivar" : "Activar"} ${method.name} para esta caja`} /></TableCell>
                </TableRow>
              ))}
              {!isLoading && paymentMethods?.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No hay métodos de pago configurados.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
