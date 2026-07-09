"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useTranslation } from "@/hooks/use-translation"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

export function LineChartComponent() {
  const t = useTranslation();

  const chartData = [
    { mes: t("dashboard.months.jan"), ingresos: 400, gastos: 240 },
    { mes: t("dashboard.months.feb"), ingresos: 300, gastos: 139 },
    { mes: t("dashboard.months.mar"), ingresos: 200, gastos: 980 },
    { mes: t("dashboard.months.apr"), ingresos: 278, gastos: 390 },
    { mes: t("dashboard.months.mayShort"), ingresos: 189, gastos: 480 },
    { mes: t("dashboard.months.jun"), ingresos: 239, gastos: 380 },
  ]

  const chartConfig = {
    ingresos: {
      label: t("dashboard.income"),
      color: "var(--color-primary)",
    },
    gastos: {
      label: t("dashboard.expenses"),
      color: "var(--color-secondary)",
    },
  }
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="ingresos"
          type="monotone"
          stroke="var(--color-ingresos)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="gastos"
          type="monotone"
          stroke="var(--color-secondary)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
