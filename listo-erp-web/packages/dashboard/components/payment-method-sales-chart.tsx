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
import { useGetPaymentMethodSales } from "../api"
import { DASHBOARD_BAR_COLORS } from "../chart-colors"
import { formatCurrentMonth } from "../format"
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts"

export function PaymentMethodSalesChart() {
  const t = useTranslation()
  const { locale } = useLanguage()
  const { formatMoney } = useCurrency()
  const [data, isLoading, error] = useGetPaymentMethodSales()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{t("dashboard.paymentMethodSales")}</CardTitle>
        <CardDescription className="shrink-0 text-right">
          {formatCurrentMonth(locale)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : error ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-destructive">
            {t("dashboard.summaryError")}
          </div>
        ) : !data?.length ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            {t("dashboard.noData")}
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
            <BarChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 24 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={52}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatMoney(Number(value))}
                width={76}
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
                radius={[4, 4, 0, 0]}
                barSize={36}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`${entry.id}-${index}`}
                    fill={DASHBOARD_BAR_COLORS[index % DASHBOARD_BAR_COLORS.length]}
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
