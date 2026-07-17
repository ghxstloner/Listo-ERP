"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { encodeId } from "@/lib/hash-id";
import type { Till } from "@/packages/till/types";
import Link from "next/link";

interface TillCardProps {
  till: Till;
}

export function TillCard({ till }: TillCardProps) {
  const t = useTranslation();
  const href = `/listoerp/company/tills/${encodeId(till.id)}`;

  return (
    <Link href={href} className="block">
      <Card className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <p className="font-semibold leading-none">{till.tillName}</p>
            <p className="text-muted-foreground text-sm font-mono">
              {till.tillCode}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              till.isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {till.isActive
              ? t("company.tills.active")
              : t("company.tills.inactive")}
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {t("company.tills.branch")}: {till.branch?.name ?? "-"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
