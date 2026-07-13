"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetWarehouseInventoryBalances } from "@/packages/inventory/api";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
export function WarehouseInventoryTab({
  warehouseId,
}: {
  warehouseId: number;
}) {
  const [search, setSearch] = useState("");
  const [balances, loading, error] =
    useGetWarehouseInventoryBalances(warehouseId);
  const rows = useMemo(
    () =>
      (balances ?? []).filter((b) =>
        `${b.product.sku} ${b.product.name}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [balances, search],
  );
  if (error)
    return (
      <p className="text-destructive">
        No se pudo cargar el inventario: {error.message}
      </p>
    );
  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <MagnifyingGlass className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por SKU o producto"
        />
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Existencia</TableHead>
              <TableHead>Actualizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Cargando inventario...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  El almacén no tiene existencias.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.product.sku}
                  </TableCell>
                  <TableCell>{row.product.name}</TableCell>
                  <TableCell>{row.product.unit ?? "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {row.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(row.updatedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
