"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { encodeId } from "@/lib/hash-id";
import { useGetCustomers } from "@/packages/customers/api";
import { Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { Customer } from "../types";
import { ListCustomer } from "./list-customer";
import { CreateCustomer } from "./modals/create-customer";

export function CustomersList() {
  const t = useTranslation();
  const router = useRouter();
  const [customers, isLoading, error] = useGetCustomers();

  const handleEdit = (customer: Customer) => {
    router.push(`/listoerp/ventas/clientes/${encodeId(customer.id)}`);
  };

  if (isLoading) {
    return <PageLoading text={t("common.loading")} icon={<Spinner size={32} />} spin={true} />;
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ListCustomer
        customers={customers ?? []}
        onEdit={handleEdit}
        headerAction={<CreateCustomer />}
      />
    </div>
  );
}
