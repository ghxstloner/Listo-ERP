"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MoneyInput } from "@/packages/currency/components/money-input";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { useGetTaxes } from "@/packages/company/api";
import { Plus, Trash } from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable, DataTablePagination } from "@/components/data-table";

export interface PendingPrice {
  _key: number;
  name: string;
  amount: number;
  sortOrder: number;
  isActive: boolean;
}

interface CreatePricesSectionProps {
  productType?: "PRODUCT" | "SERVICE";
  costPrice: string;
  taxId: number | null;
  isExempt: boolean;
  onFieldChange: (
    key: "costPrice" | "taxId" | "isExempt",
    value: string | boolean | number | null,
  ) => void;
  extraPrices: PendingPrice[];
  onExtraPricesChange: (prices: PendingPrice[]) => void;
}

let _keyCounter = 1;
function nextKey() {
  return _keyCounter++;
}

type EditingCell = { key: number; field: "name" | "amount" } | null;

function InlineNameCell({
  price,
  onCommit,
}: {
  price: PendingPrice;
  onCommit: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(price.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== price.name) onCommit(trimmed || price.name);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(price.name); setEditing(false); }
        }}
        className="h-7 min-w-[120px] px-2 py-0 text-sm"
      />
    );
  }

  return (
    <span
      className="cursor-text rounded px-1 py-0.5 hover:bg-muted font-medium"
      onClick={() => { setDraft(price.name); setEditing(true); }}
      title="Click para editar"
    >
      {price.name || <span className="text-muted-foreground italic">sin nombre</span>}
    </span>
  );
}

function InlineAmountCell({
  price,
  onCommit,
  formatMoney,
  parseMoney,
}: {
  price: PendingPrice;
  onCommit: (value: number) => void;
  formatMoney: (v: number) => string;
  parseMoney: (v: string) => number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(price.amount));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const parsed = parseMoney(draft);
    const value = Number.isFinite(parsed) && parsed >= 0 ? parsed : price.amount;
    if (value !== price.amount) onCommit(value);
    setDraft(String(value));
  };

  if (editing) {
    return (
      <MoneyInput
        ref={inputRef}
        value={draft}
        onValueChange={setDraft}
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(String(price.amount)); setEditing(false); }
        }}
        className="h-7 w-[110px] px-2 py-0 text-sm"
      />
    );
  }

  return (
    <span
      className="cursor-text rounded px-1 py-0.5 hover:bg-muted tabular-nums"
      onClick={() => { setDraft(String(price.amount)); setEditing(true); }}
      title="Click para editar"
    >
      {formatMoney(price.amount)}
    </span>
  );
}

export function CreatePricesSection({
  productType = "PRODUCT",
  costPrice,
  taxId,
  isExempt,
  onFieldChange,
  extraPrices,
  onExtraPricesChange,
}: CreatePricesSectionProps) {
  const isService = productType === "SERVICE";
  const { formatMoney, parseMoney } = useCurrency();
  const [sorting, setSorting] = useState<SortingState>([]);

  const addPrice = () => {
    const nextIndex = extraPrices.length + 1;
    const newPrice: PendingPrice = {
      _key: nextKey(),
      name: `Precio ${nextIndex}`,
      amount: 0,
      sortOrder: extraPrices.length,
      isActive: true,
    };
    onExtraPricesChange([...extraPrices, newPrice]);
  };

  const updatePrice = (key: number, patch: Partial<PendingPrice>) => {
    onExtraPricesChange(
      extraPrices.map((p) => (p._key === key ? { ...p, ...patch } : p)),
    );
  };

  const removePrice = (key: number) => {
    onExtraPricesChange(extraPrices.filter((p) => p._key !== key));
  };

  const [taxesData] = useGetTaxes();
  const taxes = taxesData || [];
  
  const parsedCostPrice = costPrice.trim() ? parseMoney(costPrice) : null;
  const cost =
    parsedCostPrice != null && Number.isFinite(parsedCostPrice) ? parsedCostPrice : null;
  const selectedTax = taxes.find((t) => t.id === taxId);
  const numRate = selectedTax ? Number(selectedTax.rate) : null;
  const rate =
    numRate != null && Number.isFinite(numRate)
      ? numRate > 1
        ? numRate / 100
        : numRate
      : null;

  const utility = (amt: number) =>
    cost != null && cost > 0 ? ((amt - cost) / cost) * 100 : null;
  const pricePlusTax = (amt: number) =>
    isExempt ? amt : rate != null ? amt * (1 + rate) : amt;

  const columns = useMemo<ColumnDef<PendingPrice>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <InlineNameCell
            price={row.original}
            onCommit={(value) => updatePrice(row.original._key, { name: value })}
          />
        ),
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: "Valor",
        cell: ({ row }) => (
          <InlineAmountCell
            price={row.original}
            onCommit={(value) => updatePrice(row.original._key, { amount: value })}
            formatMoney={formatMoney}
            parseMoney={parseMoney}
          />
        ),
      },
      ...(!isService
        ? [
            {
              id: "utility",
              accessorFn: (row: PendingPrice) => utility(row.amount),
              header: "Utilidad %",
              cell: ({ row }: { row: { original: PendingPrice } }) => {
                const val = utility(row.original.amount);
                return val != null ? `${val.toFixed(2)}%` : "-";
              },
            },
          ]
        : []),
      {
        id: "pricePlusTax",
        accessorFn: (row: PendingPrice) => pricePlusTax(row.amount),
        header: "Precio + Impuesto",
        cell: ({ row }: { row: { original: PendingPrice } }) =>
          formatMoney(pricePlusTax(row.original.amount)),
      },
      {
        id: "status",
        accessorFn: (row) => row.isActive,
        header: "Activo",
        cell: ({ row }) => (
          <Switch
            checked={row.original.isActive}
            onCheckedChange={(v) => updatePrice(row.original._key, { isActive: v })}
            aria-label={`Activar ${row.original.name}`}
          />
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acciones</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removePrice(row.original._key)}
            >
              <Trash className="text-destructive" />
              <span className="sr-only">Eliminar {row.original.name}</span>
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [extraPrices, cost, rate, isExempt, formatMoney, parseMoney],
  );

  const table = useReactTable({
    data: extraPrices,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Precios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`grid gap-4 border-b pb-6 sm:items-end ${isService ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          {!isService && (
            <div className="space-y-2">
              <Label htmlFor="create-cost-price">Precio de costo</Label>
              <MoneyInput
                id="create-cost-price"
                value={costPrice}
                onValueChange={(v) => onFieldChange("costPrice", v)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="create-tax-id">Impuesto</Label>
            <Select
              value={taxId ? String(taxId) : "none"}
              onValueChange={(v) => onFieldChange("taxId", v === "none" ? null : Number(v))}
            >
              <SelectTrigger id="create-tax-id">
                <SelectValue placeholder="Sin impuesto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin impuesto</SelectItem>
                {taxes.map((tax) => (
                  <SelectItem key={tax.id} value={String(tax.id)}>
                    {tax.name} ({(Number(tax.rate) > 1 ? Number(tax.rate) : Number(tax.rate) * 100).toFixed(2)}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-is-exempt">Exento de impuesto</Label>
            <div className="flex h-10 items-center">
              <Switch
                id="create-is-exempt"
                checked={isExempt}
                onCheckedChange={(v) => onFieldChange("isExempt", v)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Click en el nombre o valor de un precio para editarlo directamente.
          </p>
          <Button type="button" size="sm" onClick={addPrice}>
            <Plus className="mr-1 h-4 w-4" />
            Agregar precio
          </Button>
        </div>

        <DataTable
          table={table}
          tableClassName="min-w-[620px]"
          className="overflow-x-auto"
          emptyMessage="No hay precios. Haz click en 'Agregar precio' para crear uno."
        />
        {extraPrices.length > 10 && (
          <DataTablePagination
            table={table}
            pageLabel="Página"
            previousLabel="Anterior"
            nextLabel="Siguiente"
          />
        )}
      </CardContent>
    </Card>
  );
}

export function getDefaultKeyFromPrices(extraPrices: PendingPrice[], defaultKey: number | null) {
  if (defaultKey === null || defaultKey === 0) return null;
  return extraPrices.find((p) => p._key === defaultKey) ?? null;
}
