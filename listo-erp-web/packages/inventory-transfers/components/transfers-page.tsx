"use client";
import { PageLoading } from "@/components/page-loading";
import { Input } from "@/components/ui/input";
import { MagnifyingGlass, Spinner } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useGetInventoryTransfers } from "../api";
import { CreateTransfer } from "./modals/create-transfer";
import { TransferTable } from "./transfer-table";
export function TransfersPage() {
  const [transfers, loading, error] = useGetInventoryTransfers();
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      (transfers ?? []).filter((transfer) =>
        `${transfer.sourceWarehouse.name} ${transfer.destinationBranch.name} ${transfer.items.map((item) => item.product.name).join(" ")}`
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Transferencias entre ubicaciones
          </h1>
          <p className="text-muted-foreground text-sm">
            Despache desde el almacén y confirme la recepción en la sucursal.
          </p>
        </div>
        <CreateTransfer />
      </div>
      <div className="relative max-w-sm">
        <MagnifyingGlass className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar transferencia..."
          className="pl-9"
        />
      </div>
      <TransferTable transfers={filtered} />
    </div>
  );
}
