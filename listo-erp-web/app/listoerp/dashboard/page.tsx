"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageTitle } from "@/lib/page-title-context";
import { useTranslation } from "@/hooks/use-translation";
import { AreaChartComponent } from "@/packages/dashboard/components/area-chart";
import { InfoCards } from "@/packages/dashboard/components/info-cards";
import { LineChartComponent } from "@/packages/dashboard/components/line-chart";
import { PieChartComponent } from "@/packages/dashboard/components/pie-chart";
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
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader className="border-b">
            <CardTitle>{t("dashboard.monthlySales")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChartComponent />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>{t("dashboard.salesDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartComponent />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("dashboard.incomeVsExpenses")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChartComponent />
        </CardContent>
      </Card>
    </div>
  )
}