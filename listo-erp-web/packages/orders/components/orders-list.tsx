"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useGetOrders } from "../api";
import type { OrderListItem, OrderStatus } from "../types";
import { ListOrder } from "./list-order";

interface OrdersListProps {
  headerAction?: React.ReactNode;
}

export function OrdersList({ headerAction }: OrdersListProps) {
  const t = useTranslation();
  const router = useRouter();
  const [orders, isLoading, error] = useGetOrders({
    status: "all" as OrderStatus | "all",
  });

  const handleView = (order: OrderListItem) => {
    router.push(`/listoerp/ventas/pedidos/${order.id}`);
  };

  if (isLoading) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <ListOrder
      orders={orders ?? []}
      onView={handleView}
      headerAction={headerAction}
    />
  );
}
