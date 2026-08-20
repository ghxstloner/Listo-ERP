"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { MoneyInput } from "@/packages/currency/components/money-input";
import { api } from "@config";
import { useGetProductPrices, useUpdateProduct } from "@/packages/product/api";
import type { Product, ProductPrice } from "@/packages/product/types";
import { Plus, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetTaxes } from "@/packages/company/api";
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
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

function InlineNameCell({
  price,
  onCommit,
}: {
  price: ProductPrice;
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
    if (trimmed && trimmed !== price.name) onCommit(trimmed);
    else setDraft(price.name);
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
  price: ProductPrice;
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

export interface ProductPricesSectionRef {
  save: () => void;
  saving: boolean;
}

export const ProductPricesSection = forwardRef<ProductPricesSectionRef, { product: Product }>(
  function ProductPricesSection({ product }, ref) {
  const { formatMoney, parseMoney } = useCurrency();
  const queryClient = useQueryClient();
  const isService = product.productType === "SERVICE";

  const [costPrice, setCostPrice] = useState(
    product.costPrice != null ? String(product.costPrice) : "",
  );
  const [taxId, setTaxId] = useState<number | null>(product.taxId);
  const [isExempt, setIsExempt] = useState(product.isExempt);
  const [updateProduct, updatingProduct] = useUpdateProduct(product.id);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [actionPriceId, setActionPriceId] = useState<number | null>(null);

  const [pricesResponse, pricesLoading] = useGetProductPrices(product.id, true);
  const [taxesData] = useGetTaxes();
  const taxes = taxesData || [];
  const prices = pricesResponse?.data ?? product.prices ?? [];

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["products", product.id] }),
      queryClient.invalidateQueries({ queryKey: ["products", product.id, "prices"] }),
      queryClient.invalidateQueries({ queryKey: ["products"] }),
    ]);
  };

  const saveCostFields = () => {
    updateProduct(
      {
        costPrice: costPrice.trim() ? parseMoney(costPrice) : null,
        taxId: taxId,
        isExempt,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["products", product.id] });
        showToast({ type: "success", message: "Información de precios actualizada." });
      },
    );
  };

  useImperativeHandle(ref, () => ({ save: saveCostFields, saving: updatingProduct }), [saveCostFields, updatingProduct]);

  const addPrice = async () => {
    try {
      const nextIndex = prices.length + 1;
      await api.post(`products/${product.id}/prices`, {
        body: {
          name: `Precio ${nextIndex}`,
          amount: 0,
          sortOrder: prices.length,
          isActive: true,
        },
      });
      await refresh();
    } catch (error) {
      showToast({ type: "error", message: (error as Error).message });
    }
  };

  const updatePrice = async (price: ProductPrice, patch: Partial<Pick<ProductPrice, "name" | "amount" | "isActive">>) => {
    setActionPriceId(price.id);
    try {
      await api.patch(`products/${product.id}/prices/${price.id}`, { body: patch });
      await refresh();
    } catch (error) {
      showToast({ type: "error", message: (error as Error).message });
    } finally {
      setActionPriceId(null);
    }
  };

  const [priceToDelete, setPriceToDelete] = useState<ProductPrice | null>(null);

  const handleConfirmDelete = async () => {
    if (!priceToDelete) return;
    setActionPriceId(priceToDelete.id);
    try {
      await api.delete(`products/${product.id}/prices/${priceToDelete.id}`);
      await refresh();
      showToast({ type: "success", message: "Precio eliminado." });
      setPriceToDelete(null);
    } catch (error) {
      showToast({ type: "error", message: (error as Error).message });
    } finally {
      setActionPriceId(null);
    }
  };

  const parsedCostPrice = costPrice.trim() ? parseMoney(costPrice) : null;
  const cost = parsedCostPrice != null && Number.isFinite(parsedCostPrice) ? parsedCostPrice : null;
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

  const columns = useMemo<ColumnDef<ProductPrice>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <InlineNameCell
            price={row.original}
            onCommit={(value) => updatePrice(row.original, { name: value })}
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
            onCommit={(value) => updatePrice(row.original, { amount: value })}
            formatMoney={formatMoney}
            parseMoney={parseMoney}
          />
        ),
      },
      ...(!isService
        ? [
            {
              id: "utility",
              accessorFn: (row: ProductPrice) => utility(row.amount),
              header: "Utilidad %",
              cell: ({ row }: { row: { original: ProductPrice } }) => {
                const val = utility(row.original.amount);
                return val != null ? `${val.toFixed(2)}%` : "-";
              },
            },
          ]
        : []),
      {
        id: "pricePlusTax",
        accessorFn: (row: ProductPrice) => pricePlusTax(row.amount),
        header: "Precio + Impuesto",
        cell: ({ row }: { row: { original: ProductPrice } }) =>
          formatMoney(pricePlusTax(row.original.amount)),
      },
      {
        id: "status",
        accessorFn: (row) => row.isActive,
        header: "Activo",
        cell: ({ row }) => (
          <Switch
            checked={row.original.isActive}
            onCheckedChange={(v) => updatePrice(row.original, { isActive: v })}
            disabled={actionPriceId === row.original.id}
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
              onClick={() => setPriceToDelete(row.original)}
              disabled={actionPriceId === row.original.id}
            >
              <Trash className="text-destructive" />
              <span className="sr-only">Eliminar {row.original.name}</span>
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actionPriceId, cost, rate, isExempt, formatMoney, parseMoney, prices],
  );

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
        <CardTitle>Precios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isService && (
          <div className="grid gap-4 border-b pb-6 sm:grid-cols-3 sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="cost-price">Precio de costo</Label>
              <MoneyInput
                id="cost-price"
                value={costPrice}
                onValueChange={setCostPrice}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-id">Impuesto</Label>
              <Select
                value={taxId ? String(taxId) : "none"}
                onValueChange={(v) => setTaxId(v === "none" ? null : Number(v))}
              >
                <SelectTrigger id="tax-id" className="w-full">
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
              <Label htmlFor="is-exempt">Exento de impuesto</Label>
              <div className="flex h-10 items-center">
                <Switch
                  id="is-exempt"
                  checked={isExempt}
                  onCheckedChange={setIsExempt}
                />
              </div>
            </div>
          </div>
        )}

        {isService && (
          <div className="grid gap-4 border-b pb-6 sm:grid-cols-2 sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="tax-id">Impuesto</Label>
              <Select
                value={taxId ? String(taxId) : "none"}
                onValueChange={(v) => setTaxId(v === "none" ? null : Number(v))}
              >
                <SelectTrigger id="tax-id">
                  <SelectValue placeholder="Sin impuesto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin impuesto</SelectItem>
                  {taxes.map((tax) => (
                    <SelectItem key={tax.id} value={String(tax.id)}>
                      {tax.name} ({(tax.rate * 100).toFixed(2)}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="is-exempt">Exento de impuesto</Label>
              <div className="flex h-10 items-center">
                <Switch
                  id="is-exempt"
                  checked={isExempt}
                  onCheckedChange={setIsExempt}
                />
              </div>
            </div>
          </div>
        )}

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
          loading={pricesLoading && prices.length === 0}
          loadingMessage="Cargando precios..."
          emptyMessage="No hay precios. Haz click en 'Agregar precio' para crear uno."
        />
        {prices.length > 10 && (
          <DataTablePagination
            table={table}
            pageLabel="Página"
            previousLabel="Anterior"
            nextLabel="Siguiente"
          />
        )}

        <ConfirmDialog
          open={!!priceToDelete}
          onOpenChange={(open) => !open && setPriceToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Eliminar precio"
          description={`¿Estás seguro de que deseas eliminar el precio "${priceToDelete?.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          severity="destructive"
          isLoading={actionPriceId === priceToDelete?.id}
        />
      </CardContent>
    </Card>
  );
});
