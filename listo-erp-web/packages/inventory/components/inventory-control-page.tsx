"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetInventoryBalances, useGetInventoryMovements } from "../api";
import { CreateInventoryEntryDialog } from "./create-inventory-entry-dialog";

export function InventoryControlPage() {
  const t = useTranslation();
  const [balances, loadingBalances] = useGetInventoryBalances();
  const [movements, loadingMovements] = useGetInventoryMovements();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateInventoryEntryDialog />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("inventory.control.stockByWarehouse")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventory.control.warehouse")}</TableHead>
                  <TableHead>{t("inventory.control.product")}</TableHead>
                  <TableHead className="text-right">
                    {t("inventory.control.currentStock")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingBalances ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      {t("inventory.control.loadingStock")}
                    </TableCell>
                  </TableRow>
                ) : !balances?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {t("inventory.control.noStock")}
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
            <CardTitle>{t("inventory.control.latestMovements")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventory.control.date")}</TableHead>
                  <TableHead>{t("inventory.control.type")}</TableHead>
                  <TableHead>{t("inventory.control.product")}</TableHead>
                  <TableHead>{t("inventory.control.location")}</TableHead>
                  <TableHead className="text-right">
                    {t("inventory.control.quantity")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingMovements ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {t("inventory.control.loadingMovements")}
                    </TableCell>
                  </TableRow>
                ) : !movements?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {t("inventory.control.noMovements")}
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => {
                    const location = `${movement.warehouse.code} - ${movement.warehouse.name}`;
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {t(
                            `inventory.control.${movement.type === "PURCHASE_RECEIPT" ? "purchase" : movement.type === "MANUAL_ENTRY" ? "generalEntry" : movement.type === "INVENTORY_ADJUSTMENT" ? "adjustment" : movement.type === "TRANSFER_IN" ? "transferIn" : movement.type === "TRANSFER_OUT" ? "transferOut" : movement.type}`,
                          )}
                        </TableCell>
                        <TableCell>
                          {movement.product.sku} - {movement.product.name}
                        </TableCell>
                        <TableCell>{location}</TableCell>
                        <TableCell className="text-right">
                          {movement.quantity > 0 ? "+" : ""}
                          {movement.quantity}
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
    </div>
  );
}
