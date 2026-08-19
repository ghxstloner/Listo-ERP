"use client"

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/hooks/use-translation"
import { useLanguage } from "@/components/providers/language-provider"
import { useCurrency } from "@/packages/currency/components/currency-provider"
import {
  useGetTopCustomers,
  useGetTopDepartments,
  useGetTopSellers,
} from "../api"
import { DASHBOARD_BAR_COLORS } from "../chart-colors"
import type { DashboardRanking, TopDepartment } from "../types"
import { formatCurrentMonth } from "../format"
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts"

function RankingChart({
  data,
  isLoading,
  error,
  title,
  color,
}: {
  data: DashboardRanking[] | TopDepartment[] | undefined
  isLoading: boolean
  error: Error | null
  title: string
  color: string
}) {
  const t = useTranslation()
  const { locale } = useLanguage()
  const { formatMoney } = useCurrency()
  const barColors = [
    color,
    ...DASHBOARD_BAR_COLORS.filter((barColor) => barColor !== color),
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="shrink-0 text-right">
          {formatCurrentMonth(locale)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : error ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-destructive">
            {t("dashboard.summaryError")}
          </div>
        ) : !data?.length ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            {t("dashboard.noData")}
          </div>
        ) : (
          <ChartContainer
            config={{
              sales: {
                label: t("dashboard.sales"),
                color,
              },
            }}
            className="h-[280px] w-full"
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 4, right: 12, top: 8, bottom: 8 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatMoney(Number(value))}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatMoney(Number(value))}
                  />
                }
              />
              <Bar
                dataKey="sales"
                radius={[0, 4, 4, 0]}
                barSize={24}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`${entry.id}-${index}`}
                    fill={barColors[index % barColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function TopCustomersChart() {
  const t = useTranslation()
  const [data, isLoading, error] = useGetTopCustomers()

  return (
    <RankingChart
      data={data}
      isLoading={isLoading}
      error={error}
      title={t("dashboard.topCustomers")}
      color="var(--color-primary)"
    />
  )
}

export function TopSellersChart() {
  const t = useTranslation()
  const [data, isLoading, error] = useGetTopSellers()

  return (
    <RankingChart
      data={data}
      isLoading={isLoading}
      error={error}
      title={t("dashboard.topSellers")}
      color="var(--color-success)"
    />
  )
}

export function TopDepartmentsChart() {
  const t = useTranslation()
  const [data, isLoading, error] = useGetTopDepartments()

  return (
    <RankingChart
      data={data}
      isLoading={isLoading}
      error={error}
      title={t("dashboard.topDepartments")}
      color="var(--color-secondary)"
    />
  )
}
