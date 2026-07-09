"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react"

export function InfoCards() {
  const t = useTranslation();

  const infoCards = [
    {
      title: t("dashboard.totalSales"),
      value: "$125,430",
      change: "+12.5%",
      trend: "up",
      icon: TrendingUp,
      bgColor: "bg-primary/10 dark:bg-primary/20",
      textColor: "text-primary",
      borderColor: "border-primary/20 dark:border-primary/30",
      iconBg: "bg-primary/20 dark:bg-primary/30",
    },
    {
      title: t("dashboard.income"),
      value: "$98,250",
      change: "+8.2%",
      trend: "up",
      icon: DollarSign,
      bgColor: "bg-success/10 dark:bg-success/20",
      textColor: "text-success",
      borderColor: "border-success/20 dark:border-success/30",
      iconBg: "bg-success/20 dark:bg-success/30",
    },
    {
      title: t("dashboard.expenses"),
      value: "$45,180",
      change: "-3.1%",
      trend: "down",
      icon: TrendingDown,
      bgColor: "bg-secondary/10 dark:bg-secondary/20",
      textColor: "text-secondary",
      borderColor: "border-secondary/20 dark:border-secondary/30",
      iconBg: "bg-secondary/20 dark:bg-secondary/30",
    },
  ]
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {infoCards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card
            key={index}
            className={cn(
              "relative overflow-hidden transition-all hover:shadow-md",
              card.bgColor,
              card.borderColor
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("text-sm font-medium", card.textColor)}>
                {card.title}
              </CardTitle>
              <div className={cn("rounded-full p-2", card.iconBg)}>
                <Icon className={cn("h-4 w-4", card.textColor)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p
                className={cn(
                  "text-xs mt-1",
                  card.trend === "up" ? "text-success" : "text-destructive"
                )}
              >
                {card.change} {t("common.sinceLastMonth")}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
