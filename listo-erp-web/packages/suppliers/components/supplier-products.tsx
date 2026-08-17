"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { showToast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useGetProducts } from "@/packages/product/api";
import { MoneyInput } from "@/packages/currency/components/money-input";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import type { SupplierProduct } from "../types";
import { type Column, type ColumnDef, getCoreRowModel, getPaginationRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useAddSupplierProduct, useGetSupplierProducts } from "../api";

function SortableHeader({ column, children }: { column: Column<SupplierProduct, unknown>; children: React.ReactNode }) {
  return <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={column.getToggleSortingHandler()}>{children}<ArrowUpDown className="ml-2 h-4 w-4" /></Button>;
}

export function SupplierProducts({ supplierId }: { supplierId: number }) {
  const { parseMoney, formatMoney } = useCurrency();
  const queryClient = useQueryClient();
  const [products] = useGetProducts();
  const [supplierProducts, loading] = useGetSupplierProducts(supplierId);
  const [productId, setProductId] = useState("");
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [supplierSku, setSupplierSku] = useState("");
  const [referenceCost, setReferenceCost] = useState("");
  const [addProduct, adding] = useAddSupplierProduct(supplierId);
  const [sorting, setSorting] = useState<SortingState>([]);
  const availableProducts = Array.isArray(products) ? products : products?.data ?? [];
  const selectedProduct = availableProducts.find((product) => String(product.id) === productId);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["suppliers", supplierId, "products"] });
  const add = () => {
    if (!productId) return;
    addProduct({ productId: Number(productId), supplierSku: supplierSku || undefined, referenceCost: referenceCost ? parseMoney(referenceCost) : undefined }, () => {
      setProductId(""); setSupplierSku(""); setReferenceCost(""); refresh();
      showToast({ type: "success", message: "Producto agregado al catálogo del proveedor" });
    });
  };

  const columns = useMemo<ColumnDef<SupplierProduct>[]>(() => [
    { id: "product", accessorFn: (row) => `${row.product.sku} ${row.product.name}`, header: ({ column }) => <SortableHeader column={column}>Producto</SortableHeader>, cell: ({ row }) => `${row.original.product.sku} - ${row.original.product.name}` },
    { id: "supplierSku", accessorFn: (row) => row.supplierSku ?? "", header: ({ column }) => <SortableHeader column={column}>SKU proveedor</SortableHeader>, cell: ({ row }) => row.original.supplierSku || "-" },
    { id: "referenceCost", accessorKey: "referenceCost", header: ({ column }) => <SortableHeader column={column}>Costo</SortableHeader>, cell: ({ row }) => row.original.referenceCost == null ? "-" : formatMoney(row.original.referenceCost) },
    { id: "preferred", accessorFn: (row) => row.isPreferred, header: ({ column }) => <SortableHeader column={column}>Preferido</SortableHeader>, cell: ({ row }) => row.original.isPreferred ? "Sí" : "No" },
  ], [formatMoney]);
  const table = useReactTable({ data: supplierProducts ?? [], columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } } });

  return <Card>
    <CardHeader><CardTitle>Catálogo del proveedor</CardTitle></CardHeader>
    <CardContent className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1 md:col-span-2"><Label>Producto</Label><Popover open={productPickerOpen} onOpenChange={setProductPickerOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={productPickerOpen} className="w-full justify-between font-normal">{selectedProduct ? `${selectedProduct.sku} - ${selectedProduct.name}` : "Buscar producto..."}<ChevronsUpDown className="opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start"><Command><CommandInput placeholder="Buscar por SKU o nombre..." /><CommandList><CommandEmpty>No se encontraron productos.</CommandEmpty><CommandGroup>{availableProducts.map((product) => <CommandItem key={product.id} value={`${product.sku} ${product.name}`} onSelect={() => { setProductId(String(product.id)); setProductPickerOpen(false); }}><Check className={cn("mr-2", productId === String(product.id) ? "opacity-100" : "opacity-0")} />{product.sku} - {product.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>
        <div className="space-y-1"><Label>SKU proveedor</Label><Input value={supplierSku} onChange={(event) => setSupplierSku(event.target.value)} /></div>
        <div className="space-y-1"><Label>Costo referencial</Label><MoneyInput value={referenceCost} onValueChange={setReferenceCost} /></div>
      </div>
      <Button onClick={add} disabled={!productId || adding}>Agregar producto</Button>
       <DataTable table={table} loading={loading} loadingMessage="Cargando catálogo..." emptyMessage="No hay productos asociados." />
       <DataTablePagination table={table} pageLabel="Página" previousLabel="Anterior" nextLabel="Siguiente" />
    </CardContent>
  </Card>;
}
