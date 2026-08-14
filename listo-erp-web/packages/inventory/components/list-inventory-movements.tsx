"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import type { InventoryMovement } from "../types";
import { InventoryMovementsTable } from "./inventory-movements-table";

interface ListInventoryMovementsProps {
  movements: InventoryMovement[];
  headerAction?: React.ReactNode;
  embedded?: boolean;
}

export function ListInventoryMovements({
  movements,
  headerAction,
  embedded = false,
}: ListInventoryMovementsProps) {
  const t = useTranslation();

  const content = (
    <InventoryMovementsTable
      movements={movements ?? []}
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
