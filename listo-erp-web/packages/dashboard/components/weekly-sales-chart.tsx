"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/hooks/use-translation"
import { useCurrency } from "@/packages/currency/components/currency-provider"
import { useGetWeeklySales } from "../api"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

export function WeeklySalesChart() {
  const t = useTranslation()
  const { formatMoney } = useCurrency()
  const [data, isLoading, error] = useGetWeeklySales()
  const dayLabels = [
    t("dashboard.days.monday"),
    t("dashboard.days.tuesday"),
    t("dashboard.days.wednesday"),
    t("dashboard.days.thursday"),
    t("dashboard.days.friday"),
    t("dashboard.days.saturday"),
    t("dashboard.days.sunday"),
  ]

  const chartData = (data ?? []).map((item) => ({
    ...item,
    label: dayLabels[item.day - 1] ?? item.day,
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{t("dashboard.weeklySales")}</CardTitle>
        <CardDescription>{t("dashboard.thisWeek")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : error ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-destructive">
            {t("dashboard.summaryError")}
          </div>
        ) : (
          <ChartContainer
            config={{
              sales: {
                label: t("dashboard.sales"),
                color: "var(--color-primary)",
              },
            }}
            className="h-[320px] w-full"
          >
            <LineChart data={chartData} margin={{ left: 8, right: 12, top: 8 }}>
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
              <Line
                dataKey="sales"
                type="monotone"
                stroke="var(--color-sales)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-sales)" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
