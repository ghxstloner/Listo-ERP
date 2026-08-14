"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import type { InventoryBalance } from "../types";
import { InventoryBalancesTable } from "./inventory-balances-table";

interface ListInventoryBalancesProps {
  balances: InventoryBalance[];
  headerAction?: React.ReactNode;
  embedded?: boolean;
}

export function ListInventoryBalances({
  balances,
  headerAction,
  embedded = false,
}: ListInventoryBalancesProps) {
  const t = useTranslation();

  const content = (
    <InventoryBalancesTable
      balances={balances ?? []}
      t={t}
      embedded={embedded}
      action={headerAction}
    />
  );

  if (embedded) {
    return content;
  }

  return (
    <Card className="w-full">
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
