"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/packages/currency/components/currency-provider"
import { useGetDashboardSummary } from "../api"
import { Banknote, FileText, Package, UserRoundPlus } from "lucide-react"

export function InfoCards() {
  const t = useTranslation();
  const { formatMoney } = useCurrency();
  const [summary, isLoading, error] = useGetDashboardSummary();

  const infoCards = [
    {
      title: t("dashboard.productsSoldToday"),
      value: summary?.productsSoldToday.toLocaleString() ?? "-",
      icon: Package,
      accentColor: "border-l-primary",
      textColor: "text-primary",
      iconBg: "bg-primary/10 dark:bg-primary/20",
    },
    {
      title: t("dashboard.salesToday"),
      value: summary ? formatMoney(summary.salesToday) : "-",
      icon: Banknote,
      accentColor: "border-l-info",
      textColor: "text-info",
      iconBg: "bg-info/10 dark:bg-info/20",
    },
    {
      title: t("dashboard.newCustomersThisMonth"),
      value: summary?.newCustomersThisMonth.toLocaleString() ?? "-",
      icon: UserRoundPlus,
      accentColor: "border-l-warning",
      textColor: "text-warning",
      iconBg: "bg-warning/10 dark:bg-warning/20",
    },
    {
      title: t("dashboard.pendingInvoices"),
      value: summary?.pendingInvoices.toLocaleString() ?? "-",
      icon: FileText,
      accentColor: "border-l-destructive",
      textColor: "text-destructive",
      iconBg: "bg-destructive/10 dark:bg-destructive/20",
    },
  ]
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {infoCards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.title}
            className={cn(
              "min-h-[92px] flex-row items-center gap-4 overflow-hidden rounded-xl border border-border border-l-4 bg-card px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
              card.accentColor,
            )}
          >
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full",
                card.iconBg,
              )}
            >
              <Icon className={cn("size-5", card.textColor)} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {card.title}
              </p>
              <div className="mt-1 flex min-h-8 items-center text-2xl font-bold leading-none tracking-tight text-foreground">
                {isLoading ? <Skeleton className="h-8 w-24" /> : card.value}
              </div>
              {error && (
                <p className="mt-1 text-[11px] text-destructive">
                  {t("dashboard.summaryError")}
                </p>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
