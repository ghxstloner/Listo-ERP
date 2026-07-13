"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetInventoryBalances, useGetInventoryMovements } from "../api";

export function InventoryControlPage() {
  const [balances, loadingBalances] = useGetInventoryBalances();
  const [movements, loadingMovements] = useGetInventoryMovements();

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Existencias por almacén</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Almacén</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Existencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingBalances ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Cargando existencias...
                  </TableCell>
                </TableRow>
              ) : !balances?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay existencias en almacenes.
                  </TableCell>
                </TableRow>
              ) : (
                balances.map((balance) => (
                  <TableRow key={balance.id}>
                    <TableCell>{balance.warehouse.code}</TableCell>
                    <TableCell>
                      {balance.product.sku} - {balance.product.name}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {balance.quantity}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Últimos movimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingMovements ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Cargando movimientos...
                  </TableCell>
                </TableRow>
              ) : !movements?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay movimientos.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => {
                  const location = movement.warehouse
                    ? `${movement.warehouse.code} - ${movement.warehouse.name}`
                    : movement.branch
                      ? `${movement.branch.branchCode ?? ""} - ${movement.branch.name}`
                      : "-";
                  return (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {new Date(movement.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {movement.product.sku} - {movement.product.name}
                      </TableCell>
                      <TableCell>{location}</TableCell>
                      <TableCell className="text-right">
                        +{movement.quantity}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
