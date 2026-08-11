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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/use-translation";
import { useGetOrders } from "@/packages/orders/api";
import type { OrderListItem, OrderStatus } from "@/packages/orders/types";
import {
  ArrowDown,
  MagnifyingGlass,
  Plus,
  Spinner,
} from "@phosphor-icons/react";
import Link from "next/link";
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

function statusClass(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
  }
}

function statusLabel(status: OrderStatus, t: (key: string) => string) {
  switch (status) {
    case "PENDING":
      return t("sales.orders.statusLabels.pending");
    case "PAID":
      return t("sales.orders.statusLabels.paid");
    case "CANCELLED":
      return t("sales.orders.statusLabels.cancelled");
    default:
      return status;
  }
}

function OrdersTable({ orders }: { orders: OrderListItem[] }) {
  const t = useTranslation();

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[180px] items-center justify-center py-10">
          <p className="text-muted-foreground">
            {t("sales.orders.noOrders")}
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
            <TableHead>{t("sales.orders.id")}</TableHead>
            <TableHead>{t("sales.orders.date")}</TableHead>
            <TableHead>{t("sales.orders.customer")}</TableHead>
            <TableHead>{t("sales.orders.seller")}</TableHead>
            <TableHead>{t("sales.orders.branch")}</TableHead>
            <TableHead>{t("sales.orders.items")}</TableHead>
            <TableHead>{t("sales.orders.total")}</TableHead>
            <TableHead>{t("sales.orders.status")}</TableHead>
            <TableHead className="text-right">
              {t("sales.orders.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">#{order.id}</TableCell>
              <TableCell>{dateTime(order.createdAt)}</TableCell>
              <TableCell>{order.customer.name}</TableCell>
              <TableCell>{order.seller.name}</TableCell>
              <TableCell>{order.branch.name}</TableCell>
              <TableCell>{order.itemsCount}</TableCell>
              <TableCell>{money(order.total)}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClass(order.status)}`}
                >
                  {statusLabel(order.status, t)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/listoerp/ventas/pedidos/${order.id}`}>
                    {t("sales.orders.view")}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function OrdersList() {
  const t = useTranslation();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const [orders, isLoading, error] = useGetOrders({
    status: statusFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      const values = [
        order.customer.name,
        order.seller.name,
        order.branch.name,
        `#${order.id}`,
      ];
      return values.some((v) => v?.toLowerCase().includes(q));
    });
  }, [orders, search]);

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
            placeholder={t("sales.orders.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
        >
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder={t("sales.orders.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("sales.orders.allStatuses")}
            </SelectItem>
            <SelectItem value="PENDING">
              {t("sales.orders.statusLabels.pending")}
            </SelectItem>
            <SelectItem value="PAID">
              {t("sales.orders.statusLabels.paid")}
            </SelectItem>
            <SelectItem value="CANCELLED">
              {t("sales.orders.statusLabels.cancelled")}
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
        <Button asChild className="ml-auto">
          <Link href="/listoerp/ventas/pedidos/nuevo">
            <Plus className="mr-2 size-4" />
            {t("sales.orders.newOrder")}
          </Link>
        </Button>
      </div>

      <OrdersTable orders={filteredOrders} />
    </div>
  );
}
