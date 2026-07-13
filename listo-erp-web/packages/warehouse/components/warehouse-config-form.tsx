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
import { useUpdateWarehouse } from "@/packages/warehouse/api";
import type { Warehouse } from "@/packages/warehouse/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
export function WarehouseConfigForm({ warehouse }: { warehouse: Warehouse }) {
  const qc = useQueryClient();
  const [name, setName] = useState(warehouse.name);
  const [code, setCode] = useState(warehouse.code);
  const [address, setAddress] = useState(warehouse.address ?? "");
  const [isActive, setIsActive] = useState(warehouse.isActive);
  const [update, saving, error] = useUpdateWarehouse(warehouse.id);
  useEffect(() => {
    if (error) showToast({ type: "error", message: error.message });
  }, [error]);
  const save = () => {
    if (!name.trim() || !code.trim()) return;
    update(
      {
        name: name.trim(),
        code: code.trim(),
        address: address.trim(),
        isActive,
      },
      () => {
        qc.invalidateQueries({ queryKey: ["warehouses"] });
        qc.invalidateQueries({ queryKey: ["warehouses", warehouse.id] });
        showToast({
          type: "success",
          message: "Almacén actualizado exitosamente.",
        });
      },
    );
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del almacén</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="warehouse-name">Nombre</Label>
            <Input
              id="warehouse-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warehouse-code">Código</Label>
            <Input
              id="warehouse-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={isActive ? "ACTIVE" : "INACTIVE"}
              onValueChange={(value) => setIsActive(value === "ACTIVE")}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="warehouse-address">Dirección</Label>
            <Input
              id="warehouse-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
        <div className="flex justify-end border-t pt-6">
          <Button
            onClick={save}
            disabled={saving || !name.trim() || !code.trim()}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
