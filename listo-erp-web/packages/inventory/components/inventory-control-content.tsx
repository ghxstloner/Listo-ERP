"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import type { InventoryBalance, InventoryMovement } from "../types";
import { ListInventoryBalances } from "./list-inventory-balances";
import { ListInventoryMovements } from "./list-inventory-movements";

interface InventoryControlContentProps {
  balances: InventoryBalance[];
  movements: InventoryMovement[];
  headerAction?: React.ReactNode;
}

export function InventoryControlContent({
  balances,
  movements,
  headerAction,
}: InventoryControlContentProps) {
  const t = useTranslation();

  return (
    <Card className="w-full gap-0 p-0">
      <Tabs defaultValue="balances" className="w-full gap-0">
        <div className="px-6 pt-4">
          <TabsList>
            <TabsTrigger value="balances">
              {t("inventory.control.stockByWarehouse")}
            </TabsTrigger>
            <TabsTrigger value="movements">
              {t("inventory.control.latestMovements")}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="balances" className="mt-0 px-6 pt-3 pb-4">
          <ListInventoryBalances
            balances={balances ?? []}
            headerAction={headerAction}
            embedded
          />
        </TabsContent>
        <TabsContent value="movements" className="mt-0 px-6 pt-3 pb-4">
          <ListInventoryMovements
            movements={movements ?? []}
            headerAction={headerAction}
            embedded
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
