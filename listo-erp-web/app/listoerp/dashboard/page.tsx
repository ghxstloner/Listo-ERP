"use client";

import { usePageTitle } from "@/lib/page-title-context";
import { useTranslation } from "@/hooks/use-translation";
import { InfoCards } from "@/packages/dashboard/components/info-cards";
import { MonthlySalesProfitChart } from "@/packages/dashboard/components/monthly-sales-profit-chart";
import { PaymentMethodSalesChart } from "@/packages/dashboard/components/payment-method-sales-chart";
import { TopCustomersChart, TopDepartmentsChart, TopSellersChart } from "@/packages/dashboard/components/ranking-bar-charts";
import { TopProductsTable } from "@/packages/dashboard/components/top-products-table";
import { WeeklySalesChart } from "@/packages/dashboard/components/weekly-sales-chart";
import { useEffect } from "react";

export default function DashboardPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("dashboard.title"));
  }, [setTitle, t]);

  return (
    <div className="space-y-6 p-2">
      <InfoCards />
      <TopProductsTable />
      <MonthlySalesProfitChart />
      <WeeklySalesChart />
      <PaymentMethodSalesChart />
      <div className="grid gap-6 xl:grid-cols-3">
        <TopCustomersChart />
        <TopSellersChart />
        <TopDepartmentsChart />
      </div>
    </div>
  )
}
