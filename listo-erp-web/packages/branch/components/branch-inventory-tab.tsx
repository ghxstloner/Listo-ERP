"use client";

import { PageLoading } from "@/components/page-loading";
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
import { useGetBranchInventoryBalances } from "@/packages/inventory/api";
import { MagnifyingGlass, Spinner } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

export function BranchInventoryTab({ branchId }: { branchId: number }) {
  const [search, setSearch] = useState("");
  const [balances, loading, error] = useGetBranchInventoryBalances(branchId);
  const rows = useMemo(
    () =>
      (balances ?? []).filter((balance) =>
        `${balance.product.sku} ${balance.product.name}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [balances, search],
  );
  if (loading)
    return (
      <PageLoading
        text="Cargando inventario..."
        icon={<Spinner size={32} />}
        spin
      />
    );
  if (error)
    return (
      <div className="flex min-h-[180px] items-center justify-center text-destructive">
        No se pudo cargar el inventario: {error.message}
      </div>
    );
  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <MagnifyingGlass className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por SKU o producto"
          className="pl-9"
        />
      </div>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[180px] items-center justify-center py-10 text-muted-foreground">
            La sucursal no tiene existencias.
          </CardContent>
        </Card>
      ) : (
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
              {rows.map((row) => (
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
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
