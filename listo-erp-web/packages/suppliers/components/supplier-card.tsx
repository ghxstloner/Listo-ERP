"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { encodeId } from "@/lib/hash-id";
import type { Supplier } from "@/packages/suppliers/types";
import Link from "next/link";

interface SupplierCardProps {
  supplier: Supplier;
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  const t = useTranslation();
  const href = `/listoerp/purchases/suppliers/${encodeId(supplier.id)}`;

  return (
    <Link href={href} className="block">
      <Card className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <p className="font-semibold leading-none">{supplier.name}</p>
            <p className="text-muted-foreground text-sm font-mono">{supplier.taxId}</p>
          </div>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${supplier.isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
              }`}
          >
            {supplier.isActive ? t("purchases.suppliers.active") : t("purchases.suppliers.inactive")}
          </span>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">
              <span className="font-medium">{t("purchases.suppliers.contact")}:</span> {supplier.contactName}
            </p>
            <p className="text-muted-foreground text-sm">
              <span className="font-medium">{t("purchases.suppliers.phone")}:</span> {supplier.phone}
            </p>
            <p className="text-muted-foreground text-sm truncate">
              <span className="font-medium">{t("purchases.suppliers.email")}:</span> {supplier.email}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
