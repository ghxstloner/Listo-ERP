"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { showToast } from "@/components/ui/sonner";
import { useUpdateCurrencyConfig } from "@/packages/currency/api";
import type { Currency } from "@/packages/currency/types";
import { useQueryClient } from "@tanstack/react-query";
import { DotsThreeVertical, Pencil, Power } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

type TFunction = (key: string) => string;

interface CurrencyTableProps {
  currencies: Currency[];
  onEdit: (currency: Currency) => void;
  t: TFunction;
}

function StatusPill({ isActive, t }: { isActive: boolean; t: TFunction }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isActive
        ? t("administration.currencies.active")
        : t("administration.currencies.inactive")}
    </span>
  );
}

export function CurrencyTable({ currencies, onEdit, t }: CurrencyTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const filteredCurrencies = useMemo(() => {
    const query = search.trim().toLowerCase();
    return currencies.filter((currency) => {
      const matchesSearch =
        !query ||
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query) ||
        currency.symbol.toLowerCase().includes(query);
      const matchesStatus =
        status === "all" ||
        (status === "ACTIVE" && currency.isActive) ||
        (status === "INACTIVE" && !currency.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [currencies, search, status]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredCurrencies.length / pageSize),
  );
  const currentPage = Math.min(page, pageCount - 1);
  const visibleCurrencies = filteredCurrencies.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder={t("administration.currencies.searchCurrencies")}
          className="sm:max-w-sm"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="min-w-40">
            <SelectValue placeholder={t("administration.currencies.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("administration.currencies.allStatuses")}
            </SelectItem>
            <SelectItem value="ACTIVE">
              {t("administration.currencies.active")}
            </SelectItem>
            <SelectItem value="INACTIVE">
              {t("administration.currencies.inactive")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>{t("administration.currencies.code")}</TableHead>
              <TableHead>{t("administration.currencies.symbol")}</TableHead>
              <TableHead>{t("administration.currencies.decimals")}</TableHead>
              <TableHead>{t("administration.currencies.separators")}</TableHead>
              <TableHead>{t("administration.currencies.status")}</TableHead>
              <TableHead className="w-20 text-right">
                {t("administration.currencies.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleCurrencies.length ? (
              visibleCurrencies.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell>
                    <div className="font-medium">{currency.code}</div>
                    <div className="text-muted-foreground text-sm">
                      {currency.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {currency.symbol}
                  </TableCell>
                  <TableCell>{currency.decimalPlaces}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {currency.decimalSeparator} / {currency.thousandsSeparator}
                  </TableCell>
                  <TableCell>
                    <StatusPill isActive={currency.isActive} t={t} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <CurrencyActions
                        currency={currency}
                        onEdit={onEdit}
                        t={t}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {t("administration.currencies.noCurrencies")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-sm">
          {t("common.page")} {currentPage + 1} / {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={currentPage === 0}
          >
            {t("common.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((current) => Math.min(pageCount - 1, current + 1))
            }
            disabled={currentPage >= pageCount - 1}
          >
            {t("common.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CurrencyActions({
  currency,
  onEdit,
  t,
}: {
  currency: Currency;
  onEdit: (currency: Currency) => void;
  t: TFunction;
}) {
  const queryClient = useQueryClient();
  const [updateCurrency, isUpdating, error] = useUpdateCurrencyConfig(
    currency.id,
  );
  const toggle = () => {
    updateCurrency({ isActive: !currency.isActive }, () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      showToast({
        type: "success",
        message: t("administration.currencies.currencyUpdated"),
      });
    });
  };

  useEffect(() => {
    if (error) {
      showToast({ type: "error", message: error.message || t("common.error") });
    }
  }, [error, t]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">
            {t("administration.currencies.actions")}
          </span>
          <DotsThreeVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(currency)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t("administration.currencies.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={toggle}
          disabled={isUpdating}
          className={
            currency.isActive ? "text-destructive focus:text-destructive" : ""
          }
        >
          <Power className="mr-2 h-4 w-4" />
          {currency.isActive
            ? t("administration.currencies.deactivate")
            : t("administration.currencies.activate")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
