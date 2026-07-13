"use client";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetWarehouse } from "@/packages/warehouse/api";
import { WarehouseBranchesTab } from "@/packages/warehouse/components/warehouse-branches-tab";
import { WarehouseConfigForm } from "@/packages/warehouse/components/warehouse-config-form";
import { WarehouseInventoryTab } from "@/packages/warehouse/components/warehouse-inventory-tab";
import { ArrowLeft, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
export default function WarehouseDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [warehouse, loading, error] = useGetWarehouse(
    Number.isNaN(id) ? 0 : id,
  );
  if (loading)
    return (
      <PageLoading
        text="Cargando almacén..."
        icon={<Spinner size={32} />}
        spin
      />
    );
  if (error || !warehouse)
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">No se pudo cargar el almacén.</p>
        <Button variant="outline" asChild>
          <Link href="/listoerp/company">Volver a empresa</Link>
        </Button>
      </div>
    );
  return (
    <div className="w-full p-2">
      <Tabs defaultValue="general">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" asChild>
            <Link href="/listoerp/company" className="text-muted-foreground">
              <ArrowLeft className="mr-1 size-4" />
              Almacenes
            </Link>
          </Button>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="branches">Sucursales asignadas</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="general" className="mt-2">
          <WarehouseConfigForm warehouse={warehouse} />
        </TabsContent>
        <TabsContent value="inventory" className="mt-2">
          <WarehouseInventoryTab warehouseId={warehouse.id} />
        </TabsContent>
        <TabsContent value="branches" className="mt-2">
          <WarehouseBranchesTab warehouseId={warehouse.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
