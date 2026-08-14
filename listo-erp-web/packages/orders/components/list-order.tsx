"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cancelOrder } from "../api";
import type { OrderListItem } from "../types";
import { OrderTable } from "./order-table";

interface ListOrderProps {
  orders: OrderListItem[];
  onView: (order: OrderListItem) => void;
  headerAction?: React.ReactNode;
}

export function ListOrder({
  orders,
  onView,
  headerAction,
}: ListOrderProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OrderListItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelClick = (order: OrderListItem) => {
    setOrderToCancel(order);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel || isCancelling) return;

    setIsCancelling(true);
    setCancellingOrderId(orderToCancel.id);

    try {
      await cancelOrder(orderToCancel.id);
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
      showToast({
        type: "success",
        message: t("sales.orders.cancelled"),
      });
      setOrderToCancel(null);
    } catch (error) {
      showToast({
        type: "error",
        message: (error as Error).message || t("common.error"),
      });
    } finally {
      setIsCancelling(false);
      setCancellingOrderId(null);
    }
  };

  return (
    <Card className="w-full">
      <CardContent>
        <OrderTable
          orders={orders ?? []}
          onView={onView}
          onCancel={handleCancelClick}
          isCancelling={isCancelling}
          cancellingOrderId={cancellingOrderId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!orderToCancel}
        onOpenChange={(open) => !open && setOrderToCancel(null)}
        onConfirm={handleConfirmCancel}
        title={t("sales.orders.confirmCancel")}
        description={t("sales.orders.confirmCancelMessage")}
        confirmText={t("sales.orders.cancel")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isCancelling && cancellingOrderId === orderToCancel?.id}
      />
    </Card>
  );
}
