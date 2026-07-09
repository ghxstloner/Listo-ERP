"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useTranslation } from "@/hooks/use-translation"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

export function AreaChartComponent() {
  const t = useTranslation();

  const chartData = [
    { month: t("dashboard.months.january"), ventas: 186 },
    { month: t("dashboard.months.february"), ventas: 305 },
    { month: t("dashboard.months.march"), ventas: 237 },
    { month: t("dashboard.months.april"), ventas: 273 },
    { month: t("dashboard.months.may"), ventas: 209 },
    { month: t("dashboard.months.june"), ventas: 214 },
  ]

  const chartConfig = {
    ventas: {
      label: t("dashboard.sales"),
      color: "var(--color-primary)",
    },
  }
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <AreaChart
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="ventas"
          type="natural"
          fill="var(--color-primary)"
          fillOpacity={0.4}
          stroke="var(--color-primary)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
