import { useApiQuery } from "@config";
import type {
  DashboardRanking,
  DashboardSummary,
  MonthlySalesProfit,
  PaymentMethodSales,
  TopDepartment,
  TopProduct,
  WeeklySales,
} from "./types";

export const useGetDashboardSummary = () =>
  useApiQuery<DashboardSummary>(
    ["dashboard", "summary"],
    "dashboard/summary",
    undefined,
    { refetchOnWindowFocus: true },
  );

export const useGetTopProducts = () =>
  useApiQuery<TopProduct[]>(
    ["dashboard", "top-products"],
    "dashboard/top-products",
  );

export const useGetMonthlySalesProfit = () =>
  useApiQuery<MonthlySalesProfit[]>(
    ["dashboard", "monthly-sales-profit"],
    "dashboard/monthly-sales-profit",
  );

export const useGetWeeklySales = () =>
  useApiQuery<WeeklySales[]>(
    ["dashboard", "weekly-sales"],
    "dashboard/weekly-sales",
  );

export const useGetTopCustomers = () =>
  useApiQuery<DashboardRanking[]>(
    ["dashboard", "top-customers"],
    "dashboard/top-customers",
  );

export const useGetTopSellers = () =>
  useApiQuery<DashboardRanking[]>(
    ["dashboard", "top-sellers"],
    "dashboard/top-sellers",
  );

export const useGetTopDepartments = () =>
  useApiQuery<TopDepartment[]>(
    ["dashboard", "top-departments"],
    "dashboard/top-departments",
  );

export const useGetPaymentMethodSales = () =>
  useApiQuery<PaymentMethodSales[]>(
    ["dashboard", "payment-method-sales"],
    "dashboard/payment-method-sales",
  );
