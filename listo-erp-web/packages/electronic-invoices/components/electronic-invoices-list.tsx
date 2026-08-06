"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/use-translation";
import { downloadElectronicInvoiceReceipt, useGetSales } from "@/packages/pos/api";
import type { ElectronicInvoiceStatus, SaleListItem } from "@/packages/pos/types";
import { ArrowDown, DownloadSimple, MagnifyingGlass, Spinner } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

function money(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function dateTime(value: string) {
  return new Date(value).toLocaleString();
}

function statusClass(status: ElectronicInvoiceStatus) {
  switch (status) {
    case "ACCEPTED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "PENDING":
    case "PROCESSING":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "REJECTED":
    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
  }
}

function statusLabel(status: ElectronicInvoiceStatus, t: (key: string) => string) {
  switch (status) {
    case "ACCEPTED":
      return t("sales.electronicInvoices.statusLabels.accepted");
    case "PENDING":
      return t("sales.electronicInvoices.statusLabels.pending");
    case "PROCESSING":
      return t("sales.electronicInvoices.statusLabels.processing");
    case "REJECTED":
      return t("sales.electronicInvoices.statusLabels.rejected");
    case "FAILED":
      return t("sales.electronicInvoices.statusLabels.failed");
    default:
      return status;
  }
}

function DownloadReceiptButton({ sale }: { sale: SaleListItem }) {
  const t = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadElectronicInvoiceReceipt(sale.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${sale.electronicInvoice?.consecutive ?? "factura"}-recibo.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast({
        type: "error",
        message: t("sales.electronicInvoices.downloadError"),
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDownload}
      disabled={downloading}
    >
      {downloading ? (
        <Spinner className="size-4 animate-spin" />
      ) : (
        <DownloadSimple className="size-4" />
      )}
      {t("sales.electronicInvoices.downloadReceipt")}
    </Button>
  );
}

function SalesTable({ sales }: { sales: SaleListItem[] }) {
  const t = useTranslation();

  if (sales.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[180px] items-center justify-center py-10">
          <p className="text-muted-foreground">
            {t("sales.electronicInvoices.noSales")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("sales.electronicInvoices.consecutive")}</TableHead>
            <TableHead>{t("sales.electronicInvoices.date")}</TableHead>
            <TableHead>{t("sales.electronicInvoices.customer")}</TableHead>
            <TableHead>{t("sales.electronicInvoices.seller")}</TableHead>
            <TableHead>{t("sales.electronicInvoices.total")}</TableHead>
            <TableHead>{t("sales.electronicInvoices.status")}</TableHead>
            <TableHead className="text-right">
              {t("sales.electronicInvoices.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">
                {sale.electronicInvoice?.consecutive ?? "-"}
              </TableCell>
              <TableCell>{dateTime(sale.createdAt)}</TableCell>
              <TableCell>{sale.customer.name}</TableCell>
              <TableCell>{sale.seller.name}</TableCell>
              <TableCell>{money(sale.total)}</TableCell>
              <TableCell>
                {sale.electronicInvoice ? (
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClass(sale.electronicInvoice.status)}`}
                  >
                    {statusLabel(sale.electronicInvoice.status, t)}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {sale.electronicInvoice?.canDownload ? (
                  <DownloadReceiptButton sale={sale} />
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function ElectronicInvoicesList() {
  const t = useTranslation();
  const [statusFilter, setStatusFilter] = useState<ElectronicInvoiceStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const [sales, isLoading, error] = useGetSales({
    status: statusFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((sale) => {
      const values = [
        sale.customer.name,
        sale.seller.name,
        sale.electronicInvoice?.consecutive,
      ];
      return values.some((v) => v?.toLowerCase().includes(q));
    });
  }, [sales, search]);

  if (isLoading) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <MagnifyingGlass
            className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            weight="bold"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("sales.electronicInvoices.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ElectronicInvoiceStatus | "all")}
        >
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder={t("sales.electronicInvoices.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("sales.electronicInvoices.allStatuses")}
            </SelectItem>
            <SelectItem value="ACCEPTED">
              {t("sales.electronicInvoices.statusLabels.accepted")}
            </SelectItem>
            <SelectItem value="PENDING">
              {t("sales.electronicInvoices.statusLabels.pending")}
            </SelectItem>
            <SelectItem value="PROCESSING">
              {t("sales.electronicInvoices.statusLabels.processing")}
            </SelectItem>
            <SelectItem value="REJECTED">
              {t("sales.electronicInvoices.statusLabels.rejected")}
            </SelectItem>
            <SelectItem value="FAILED">
              {t("sales.electronicInvoices.statusLabels.failed")}
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[150px]"
          />
          <ArrowDown className="text-muted-foreground size-4 -rotate-90" />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[150px]"
          />
        </div>
      </div>

      <SalesTable sales={filteredSales} />
    </div>
  );
}
