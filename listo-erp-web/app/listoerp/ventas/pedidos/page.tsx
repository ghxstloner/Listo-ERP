"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { OrdersList } from "@/packages/orders/components/orders-list";
import { Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";

export default function OrdersPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("sales.orders.title"));
  }, [setTitle, t]);

  return (
    <div className="w-full p-2">
      <OrdersList
        headerAction={
          <Button size="sm" asChild>
            <Link href="/listoerp/ventas/pedidos/nuevo">
              <Plus className="mr-2 size-4" />
              {t("sales.orders.newOrder")}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
