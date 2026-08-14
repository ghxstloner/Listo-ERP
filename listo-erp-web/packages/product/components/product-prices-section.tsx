"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { api } from "@config";
import { useGetProductPrices } from "@/packages/product/api";
import type { Product, ProductPrice } from "@/packages/product/types";
import { Check, Pencil, Plus, Star, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface ProductPricesSectionProps {
  product: Product;
}

export function ProductPricesSection({ product }: ProductPricesSectionProps) {
  const { formatMoney } = useCurrency();
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
      showToast({ type: "error", message: "El orden debe ser un entero mayor o igual a cero." });
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
      showToast({ type: "success", message: "Precio predeterminado actualizado." });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Precios del producto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_180px_110px_auto] sm:items-end">
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
            <Switch checked={isActive} onCheckedChange={setIsActive} disabled={saving} />
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

        <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Predeterminado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricesLoading && prices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    Cargando precios...
                  </TableCell>
                </TableRow>
              ) : prices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    No hay precios configurados.
                  </TableCell>
                </TableRow>
              ) : (
                prices.map((price) => {
                  const isDefault = defaultPriceId === price.id;
                  const disabled = actionPriceId === price.id;
                  return (
                    <TableRow key={price.id}>
                      <TableCell className="font-medium">{price.name}</TableCell>
                      <TableCell>{formatMoney(price.amount)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={price.isActive}
                          onCheckedChange={() => toggleActive(price)}
                          disabled={disabled || isDefault}
                          aria-label={`Activar ${price.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        {isDefault ? (
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
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => edit(price)} disabled={disabled}>
                            <Pencil />
                            <span className="sr-only">Editar {price.name}</span>
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => remove(price)} disabled={disabled || isDefault}>
                            <Trash className="text-destructive" />
                            <span className="sr-only">Eliminar {price.name}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          El precio predeterminado es el que se usa al agregar el producto en POS y pedidos.
        </p>
      </CardContent>
    </Card>
  );
}
