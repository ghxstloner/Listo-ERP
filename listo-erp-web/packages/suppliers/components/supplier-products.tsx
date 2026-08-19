"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { showToast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useGetProducts } from "@/packages/product/api";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import type { SupplierProduct } from "../types";
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
import { useMemo, useState } from "react";
import { useAddSupplierProduct, useGetSupplierProducts } from "../api";

function SortableHeader({
  column,
  children,
}: {
  column: Column<SupplierProduct, unknown>;
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

export function SupplierProducts({ supplierId }: { supplierId: number }) {
  const queryClient = useQueryClient();
  const [products] = useGetProducts({ productType: "PRODUCT" });
  const [supplierProducts, loading] = useGetSupplierProducts(supplierId);
  const [productId, setProductId] = useState("");
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [addProduct, adding] = useAddSupplierProduct(supplierId);
  const [sorting, setSorting] = useState<SortingState>([]);
  const allProducts = Array.isArray(products)
    ? products
    : (products?.data ?? []);
  const associatedProductIds = new Set(
    (supplierProducts ?? []).map((item) => item.productId),
  );
  const availableProducts = allProducts.filter(
    (product) => !associatedProductIds.has(product.id),
  );
  const selectedProduct = availableProducts.find(
    (product) => String(product.id) === productId,
  );

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["suppliers", supplierId, "products"],
    });
  const add = () => {
    if (!productId) return;
    addProduct({ productId: Number(productId) }, () => {
      setProductId("");
      refresh();
      showToast({
        type: "success",
        message: "Producto agregado al catálogo del proveedor",
      });
    });
  };

  const columns = useMemo<ColumnDef<SupplierProduct>[]>(
    () => [
      {
        id: "product",
        accessorFn: (row) => `${row.product.sku} ${row.product.name}`,
        header: ({ column }) => (
          <SortableHeader column={column}>Producto</SortableHeader>
        ),
        cell: ({ row }) =>
          `${row.original.product.sku} - ${row.original.product.name}`,
      },
    ],
    [],
  );
  const table = useReactTable({
    data: supplierProducts ?? [],
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
        <CardTitle>Catálogo del proveedor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1 md:col-span-2">
            <Label>Producto</Label>
            <Popover
              open={productPickerOpen}
              onOpenChange={setProductPickerOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productPickerOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedProduct
                    ? `${selectedProduct.sku} - ${selectedProduct.name}`
                    : "Buscar producto..."}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Buscar por SKU o nombre..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron productos.</CommandEmpty>
                    <CommandGroup>
                      {availableProducts.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={`${product.sku} ${product.name}`}
                          onSelect={() => {
                            setProductId(String(product.id));
                            setProductPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2",
                              productId === String(product.id)
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {product.sku} - {product.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button onClick={add} disabled={!productId || adding}>
          Agregar producto
        </Button>
        <DataTable
          table={table}
          loading={loading}
          loadingMessage="Cargando catálogo..."
          emptyMessage="No hay productos asociados."
        />
        <DataTablePagination
          table={table}
          pageLabel="Página"
          previousLabel="Anterior"
          nextLabel="Siguiente"
        />
      </CardContent>
    </Card>
  );
}
