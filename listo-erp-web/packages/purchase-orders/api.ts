import { useApiMutation, useApiQuery } from "@config";
import type { CreatePurchaseOrderRequest, PurchaseOrder } from "./types";
export const useGetPurchaseOrders = () => useApiQuery<PurchaseOrder[]>(["purchase-orders"], "purchase-orders");
export const useCreatePurchaseOrder = () => useApiMutation<PurchaseOrder, CreatePurchaseOrderRequest>("purchase-orders", "post");
export const useReceivePurchaseOrder = (id: number) => useApiMutation<PurchaseOrder, void>(`purchase-orders/${id}/receive`, "patch");
export const useCancelPurchaseOrder = (id: number) => useApiMutation<PurchaseOrder, void>(`purchase-orders/${id}/cancel`, "patch");
