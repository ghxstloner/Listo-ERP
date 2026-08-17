"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { MoneyInput } from "@/packages/currency/components/money-input";
import { api } from "@config";
import { useGetProductPrices } from "@/packages/product/api";
import type { Product, ProductPrice } from "@/packages/product/types";
import { Check, Pencil, Plus, Star, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type Column,
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface ProductPricesSectionProps {
  product: Product;
  costPrice: string;
  taxRate: string;
  isExempt: boolean;
  onCostFieldChange: (
    key: "costPrice" | "taxRate" | "isExempt",
    value: string | boolean,
  ) => void;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<ProductPrice, unknown>;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 px-2"
      onClick={column.getToggleSortingHandler()}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

export function ProductPricesSection({
  product,
  costPrice,
  taxRate,
  isExempt,
  onCostFieldChange,
}: ProductPricesSectionProps) {
  const { formatMoney, parseMoney } = useCurrency();
  const queryClient = useQueryClient();
  const [pricesResponse, pricesLoading] = useGetProductPrices(product.id, true);
  const [editingPrice, setEditingPrice] = useState<ProductPrice | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [defaultPriceId, setDefaultPriceId] = useState(product.defaultPriceId);
  const [saving, setSaving] = useState(false);
  const [actionPriceId, setActionPriceId] = useState<number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    setDefaultPriceId(product.defaultPriceId);
  }, [product.defaultPriceId]);

  const prices = pricesResponse?.data ?? product.prices ?? [];

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["products", product.id] }),
      queryClient.invalidateQueries({
        queryKey: ["products", product.id, "prices"],
      }),
      queryClient.invalidateQueries({ queryKey: ["products"] }),
    ]);
  };

  const resetForm = () => {
    setEditingPrice(null);
    setName("");
    setAmount("");
    setSortOrder("0");
    setIsActive(true);
  };

  const edit = (price: ProductPrice) => {
    setEditingPrice(price);
    setName(price.name);
    setAmount(String(price.amount));
    setSortOrder(String(price.sortOrder));
    setIsActive(price.isActive);
  };

  const save = async () => {
    const parsedAmount = Number(amount);
    const parsedSortOrder = Number(sortOrder);
    if (!name.trim() || !Number.isFinite(parsedAmount) || parsedAmount < 0) {
      showToast({
        type: "error",
        message: "Ingresa un nombre y un valor de precio válido.",
      });
      return;
    }
    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      showToast({
        type: "error",
        message: "El orden debe ser un entero mayor o igual a cero.",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        amount: parsedAmount,
        sortOrder: parsedSortOrder,
        isActive,
      };
      if (editingPrice) {
        await api.patch(`products/${product.id}/prices/${editingPrice.id}`, {
          body: payload,
        });
        showToast({ type: "success", message: "Precio actualizado." });
      } else {
        await api.post(`products/${product.id}/prices`, { body: payload });
        showToast({ type: "success", message: "Precio agregado." });
      }
      resetForm();
      await refresh();
    } catch (error) {
      showToast({ type: "error", message: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (price: ProductPrice) => {
    setActionPriceId(price.id);
    try {
      await api.patch(`products/${product.id}/prices/${price.id}`, {
        body: { isActive: !price.isActive },
      });
      await refresh();
    } catch (error) {
      showToast({ type: "error", message: (error as Error).message });
    } finally {
      setActionPriceId(null);
    }
  };

  const setDefault = async (price: ProductPrice) => {
    setActionPriceId(price.id);
    try {
      await api.patch(`products/${product.id}/default-price/${price.id}`);
      setDefaultPriceId(price.id);
      await refresh();
      showToast({
        type: "success",
        message: "Precio predeterminado actualizado.",
      });
    } catch (error) {
      showToast({ type: "error", message: (error as Error).message });
    } finally {
      setActionPriceId(null);
    }
  };

  const remove = async (price: ProductPrice) => {
    if (!window.confirm(`¿Eliminar el precio "${price.name}"?`)) return;
    setActionPriceId(price.id);
    try {
      await api.delete(`products/${product.id}/prices/${price.id}`);
      if (editingPrice?.id === price.id) resetForm();
      await refresh();
      showToast({ type: "success", message: "Precio eliminado." });
    } catch (error) {
      showToast({ type: "error", message: (error as Error).message });
    } finally {
      setActionPriceId(null);
    }
  };

  const columns = useMemo<ColumnDef<ProductPrice>[]>(() => {
    const parsedCostPrice = costPrice.trim() ? parseMoney(costPrice) : null;
    const cost =
      parsedCostPrice != null && Number.isFinite(parsedCostPrice)
        ? parsedCostPrice
        : null;
    const parsedTaxRate = taxRate.trim() ? Number(taxRate) / 100 : null;
    const rate =
      parsedTaxRate != null && Number.isFinite(parsedTaxRate)
        ? parsedTaxRate
        : null;
    const utility = (price: ProductPrice) =>
      cost != null && cost > 0 ? ((price.amount - cost) / cost) * 100 : null;
    const pricePlusUtility = (price: ProductPrice) =>
      cost != null ? price.amount + (price.amount - cost) : null;
    const pricePlusTax = (price: ProductPrice) =>
      isExempt
        ? price.amount
        : rate != null
          ? price.amount * (1 + rate)
          : price.amount;
    return [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Nombre</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: ({ column }) => (
          <SortableHeader column={column}>Valor</SortableHeader>
        ),
        cell: ({ row }) => formatMoney(row.original.amount),
      },
      {
        id: "utility",
        accessorFn: utility,
        header: ({ column }) => (
          <SortableHeader column={column}>Utilidad %</SortableHeader>
        ),
        cell: ({ row }) => {
          const value = utility(row.original);
          return value != null ? `${value.toFixed(2)}%` : "-";
        },
      },
      {
        id: "pricePlusUtility",
        accessorFn: pricePlusUtility,
        header: ({ column }) => (
          <SortableHeader column={column}>Precio + Utilidad</SortableHeader>
        ),
        cell: ({ row }) => {
          const value = pricePlusUtility(row.original);
          return value != null ? formatMoney(value) : "-";
        },
      },
      {
        id: "pricePlusTax",
        accessorFn: pricePlusTax,
        header: ({ column }) => (
          <SortableHeader column={column}>Precio + Impuesto</SortableHeader>
        ),
        cell: ({ row }) => formatMoney(pricePlusTax(row.original)),
      },
      {
        id: "status",
        accessorFn: (row) => row.isActive,
        header: ({ column }) => (
          <SortableHeader column={column}>Estado</SortableHeader>
        ),
        cell: ({ row }) => {
          const disabled = actionPriceId === row.original.id;
          return (
            <Switch
              checked={row.original.isActive}
              onCheckedChange={() => toggleActive(row.original)}
              disabled={disabled || defaultPriceId === row.original.id}
              aria-label={`Activar ${row.original.name}`}
            />
          );
        },
      },
      {
        id: "default",
        accessorFn: (row) => defaultPriceId === row.id,
        header: ({ column }) => (
          <SortableHeader column={column}>Predeterminado</SortableHeader>
        ),
        cell: ({ row }) => {
          const price = row.original;
          const isDefault = defaultPriceId === price.id;
          const disabled = actionPriceId === price.id;
          return isDefault ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              <Star weight="fill" /> Sí
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDefault(price)}
              disabled={disabled || !price.isActive}
            >
              Elegir
            </Button>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => {
          const price = row.original;
          const disabled = actionPriceId === price.id;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => edit(price)}
                disabled={disabled}
              >
                <Pencil />
                <span className="sr-only">Editar {price.name}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(price)}
                disabled={disabled || defaultPriceId === price.id}
              >
                <Trash className="text-destructive" />
                <span className="sr-only">Eliminar {price.name}</span>
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ];
  }, [
    actionPriceId,
    costPrice,
    defaultPriceId,
    formatMoney,
    isExempt,
    parseMoney,
    setDefault,
    taxRate,
  ]);
  const table = useReactTable({
    data: prices,
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
        <CardTitle>Precios del producto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 border-b pb-6 sm:grid-cols-3 sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="cost-price">Precio de costo</Label>
            <MoneyInput
              id="cost-price"
              value={costPrice}
              onValueChange={(value) => onCostFieldChange("costPrice", value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax-rate">Tasa de impuesto (%)</Label>
            <Input
              id="tax-rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={taxRate}
              onChange={(event) =>
                onCostFieldChange("taxRate", event.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="is-exempt">Exento de impuesto</Label>
            <div className="flex h-10 items-center">
              <Switch
                id="is-exempt"
                checked={isExempt}
                onCheckedChange={(value) =>
                  onCostFieldChange("isExempt", value)
                }
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b pb-6 sm:grid-cols-[minmax(0,1fr)_180px_110px_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="price-name">Nombre</Label>
            <Input
              id="price-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Público"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price-amount">Valor</Label>
            <Input
              id="price-amount"
              type="number"
              min="0"
              step="0.0001"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price-order">Orden</Label>
            <Input
              id="price-order"
              type="number"
              min="0"
              step="1"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={saving}
            />
            <Button onClick={save} disabled={saving}>
              {editingPrice ? <Check /> : <Plus />}
              {editingPrice ? "Guardar" : "Agregar"}
            </Button>
            {editingPrice && (
              <Button variant="ghost" onClick={resetForm} disabled={saving}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        <DataTable
          table={table}
          tableClassName="min-w-[920px]"
          className="overflow-x-auto"
          loading={pricesLoading && prices.length === 0}
          loadingMessage="Cargando precios..."
          emptyMessage="No hay precios configurados."
        />
        <DataTablePagination
          table={table}
          pageLabel="Página"
          previousLabel="Anterior"
          nextLabel="Siguiente"
        />
        <p className="text-xs text-muted-foreground">
          El precio predeterminado es el que se usa al agregar el producto en
          POS y pedidos. Las columnas Utilidad %, Precio + Utilidad y Precio +
          Impuesto se calculan automáticamente a partir del costo, el precio y
          el impuesto del producto.
        </p>
      </CardContent>
    </Card>
  );
}
