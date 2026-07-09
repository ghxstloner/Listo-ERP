"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useTranslation } from "@/hooks/use-translation"
import { Cell, Pie, PieChart } from "recharts"

export function PieChartComponent() {
  const t = useTranslation();

  const chartConfig = {
    productos: {
      label: t("dashboard.products"),
      color: "var(--color-primary)",
    },
    servicios: {
      label: t("dashboard.services"),
      color: "var(--color-secondary)",
    },
    otros: {
      label: t("dashboard.others"),
      color: "var(--color-success)",
    },
  }

  const chartData = [
    { id: "productos", name: t("dashboard.products"), value: 400 },
    { id: "servicios", name: t("dashboard.services"), value: 300 },
    { id: "otros", name: t("dashboard.others"), value: 200 },
  ]
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {chartData.map((entry, index) => {
            const configKey = entry.id as keyof typeof chartConfig
            const color = chartConfig[configKey]?.color || "var(--color-primary)"
            return (
              <Cell
                key={`cell-${index}`}
                fill={color}
              />
            )
          })}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
