import { api, useApiMutation, useApiQuery } from "@config";
import type {
  ApiMessageResponse,
  CreateOrderRequest,
  Order,
  OrderListItem,
  OrderStatus,
  UpdateOrderRequest,
} from "./types";

export type { Order, OrderListItem, OrderStatus } from "./types";

export const useGetOrders = (filters: {
  status?: OrderStatus | "all";
  customerId?: number;
  branchIds?: number[];
  dateFrom?: string;
  dateTo?: string;
}) => {
  const params: Record<string, string | undefined> = {};
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.customerId) params.customerId = String(filters.customerId);
  if (filters.branchIds?.length) params.branchIds = filters.branchIds.join(",");
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;

  return useApiQuery<OrderListItem[]>(
    ["orders", filters.status ?? "all", filters.customerId ?? "", filters.branchIds?.join(",") ?? "", filters.dateFrom ?? "", filters.dateTo ?? ""],
    "orders",
    Object.keys(params).length > 0 ? { params } : undefined,
  );
};

export const useGetOrder = (id: number | null) =>
  useApiQuery<Order>(["orders", id], `orders/${id ?? 0}`, undefined, {
    enabled: id != null,
  });

export const useCreateOrder = () =>
  useApiMutation<ApiMessageResponse<Order>, CreateOrderRequest>("orders", "post");

export const useUpdateOrder = (id: number) =>
  useApiMutation<ApiMessageResponse<Order>, UpdateOrderRequest>(
    `orders/${id}`,
    "patch",
  );

export const useCancelOrder = () =>
  useApiMutation<ApiMessageResponse, number>(
    "orders",
    "patch",
  );

export const cancelOrder = async (id: number) =>
  api.patch<ApiMessageResponse>(`orders/${id}/cancel`);
