"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { showToast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useGetProducts } from "@/packages/product/api";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useAddSupplierProduct, useGetSupplierProducts } from "../api";

export function SupplierProducts({ supplierId }: { supplierId: number }) {
  const queryClient = useQueryClient();
  const [products] = useGetProducts();
  const [supplierProducts, loading] = useGetSupplierProducts(supplierId);
  const [productId, setProductId] = useState("");
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [supplierSku, setSupplierSku] = useState("");
  const [referenceCost, setReferenceCost] = useState("");
  const [addProduct, adding] = useAddSupplierProduct(supplierId);
  const availableProducts = Array.isArray(products) ? products : products?.data ?? [];
  const selectedProduct = availableProducts.find((product) => String(product.id) === productId);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["suppliers", supplierId, "products"] });
  const add = () => {
    if (!productId) return;
    addProduct({ productId: Number(productId), supplierSku: supplierSku || undefined, referenceCost: referenceCost ? Number(referenceCost) : undefined }, () => {
      setProductId(""); setSupplierSku(""); setReferenceCost(""); refresh();
      showToast({ type: "success", message: "Producto agregado al catálogo del proveedor" });
    });
  };

  return <Card>
    <CardHeader><CardTitle>Catálogo del proveedor</CardTitle></CardHeader>
    <CardContent className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1 md:col-span-2"><Label>Producto</Label><Popover open={productPickerOpen} onOpenChange={setProductPickerOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={productPickerOpen} className="w-full justify-between font-normal">{selectedProduct ? `${selectedProduct.sku} - ${selectedProduct.name}` : "Buscar producto..."}<ChevronsUpDown className="opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start"><Command><CommandInput placeholder="Buscar por SKU o nombre..." /><CommandList><CommandEmpty>No se encontraron productos.</CommandEmpty><CommandGroup>{availableProducts.map((product) => <CommandItem key={product.id} value={`${product.sku} ${product.name}`} onSelect={() => { setProductId(String(product.id)); setProductPickerOpen(false); }}><Check className={cn("mr-2", productId === String(product.id) ? "opacity-100" : "opacity-0")} />{product.sku} - {product.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>
        <div className="space-y-1"><Label>SKU proveedor</Label><Input value={supplierSku} onChange={(event) => setSupplierSku(event.target.value)} /></div>
        <div className="space-y-1"><Label>Costo referencial</Label><Input type="number" min="0" step="0.0001" value={referenceCost} onChange={(event) => setReferenceCost(event.target.value)} /></div>
      </div>
      <Button onClick={add} disabled={!productId || adding}>Agregar producto</Button>
      <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/50 text-left"><tr><th className="p-3">Producto</th><th className="p-3">SKU proveedor</th><th className="p-3">Costo</th><th className="p-3">Preferido</th></tr></thead><tbody>{loading ? <tr><td className="p-4" colSpan={4}>Cargando catálogo...</td></tr> : supplierProducts?.map((item) => <tr key={item.id} className="border-t"><td className="p-3">{item.product.sku} - {item.product.name}</td><td className="p-3">{item.supplierSku || "-"}</td><td className="p-3">{item.referenceCost ?? "-"}</td><td className="p-3">{item.isPreferred ? "Sí" : "No"}</td></tr>)}</tbody></table></div>
    </CardContent>
  </Card>;
}
