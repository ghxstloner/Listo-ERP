"use client"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/hooks/use-translation"
import { useCurrency } from "@/packages/currency/components/currency-provider"
import { useGetMonthlySalesProfit } from "../api"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

export function MonthlySalesProfitChart() {
  const t = useTranslation()
  const { formatMoney } = useCurrency()
  const [data, isLoading, error] = useGetMonthlySalesProfit()

  const chartConfig = {
    sales: {
      label: t("dashboard.sales"),
      color: "var(--color-primary)",
    },
    profit: {
      label: t("dashboard.profit"),
      color: "var(--color-success)",
    },
  }

  const chartData = (data ?? []).map((item) => ({
    ...item,
    label: new Date(`${item.month}-01T12:00:00`).toLocaleDateString(undefined, {
      month: "short",
    }),
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{t("dashboard.monthlySalesProfit")}</CardTitle>
        <CardDescription>{t("dashboard.lastTwelveMonths")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : error ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-destructive">
            {t("dashboard.summaryError")}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            {t("dashboard.noData")}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[320px] w-full">
            <AreaChart data={chartData} margin={{ left: 8, right: 12, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatMoney(Number(value))}
                width={76}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatMoney(Number(value))}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="sales"
                type="monotone"
                fill="var(--color-sales)"
                fillOpacity={0.18}
                stroke="var(--color-sales)"
                strokeWidth={2}
              />
              <Area
                dataKey="profit"
                type="monotone"
                fill="var(--color-profit)"
                fillOpacity={0.16}
                stroke="var(--color-profit)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
