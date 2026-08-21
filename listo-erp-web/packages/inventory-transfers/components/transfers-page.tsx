"use client";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/page-loading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlass, Plus, Spinner } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGetInventoryTransfers } from "../api";
import { TransferTable } from "./transfer-table";

export function TransfersPage() {
  const router = useRouter();
  const [transfers, loading, error] = useGetInventoryTransfers();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      (transfers ?? []).filter((transfer) =>
        `${transfer.documentNumber ?? ""} ${transfer.sourceWarehouse.name} ${transfer.destinationWarehouse.name} ${transfer.createdByUser?.name ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [transfers, search],
  );

  if (loading)
    return (
      <PageLoading
        text="Cargando transferencias..."
        icon={<Spinner size={32} />}
        spin
      />
    );

  if (error)
    return (
      <div className="flex min-h-[400px] items-center justify-center text-destructive">
        No se pudieron cargar las transferencias: {error.message}
      </div>
    );

  return (
    <Card className="w-full">
      <CardContent>
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <MagnifyingGlass className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar transferencia..."
                className="pl-9"
              />
            </div>
            <div className="flex shrink-0">
              <Button
                onClick={() =>
                  router.push("/listoerp/inventory/warehouse-transfers/new")
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva transferencia
              </Button>
            </div>
          </div>
          <TransferTable transfers={filtered} />
        </div>
      </CardContent>
    </Card>
  );
}
