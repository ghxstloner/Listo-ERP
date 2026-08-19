"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslation } from "@/hooks/use-translation"
import { useLanguage } from "@/components/providers/language-provider"
import { useCurrency } from "@/packages/currency/components/currency-provider"
import { useGetTopProducts } from "../api"
import { formatCurrentMonth } from "../format"

export function TopProductsTable() {
  const t = useTranslation()
  const { locale } = useLanguage()
  const { formatMoney } = useCurrency()
  const [products, isLoading, error] = useGetTopProducts()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{t("dashboard.topProducts")}</CardTitle>
        <CardDescription className="shrink-0 text-right">
          {formatCurrentMonth(locale)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dashboard.productCode")}</TableHead>
              <TableHead>{t("dashboard.productName")}</TableHead>
              <TableHead className="text-right">{t("dashboard.unitPrice")}</TableHead>
              <TableHead className="text-right">{t("dashboard.quantitySold")}</TableHead>
              <TableHead className="text-right">{t("dashboard.totalAmount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 5 }, (_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && error && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-destructive">
                  {t("dashboard.summaryError")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && products?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  {t("dashboard.noData")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              !error &&
              products?.map((product) => (
                <TableRow key={product.productId}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {product.sku}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(product.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatMoney(product.total)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
