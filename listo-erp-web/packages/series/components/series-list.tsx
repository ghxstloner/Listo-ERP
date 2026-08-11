"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useGetSeries } from "../api";
import type { Series } from "../types";
import { ListSeries } from "./list-series";

export function SeriesList() {
  const t = useTranslation();
  const router = useRouter();
  const [series, isLoading, error] = useGetSeries();

  const handleEdit = (series: Series) => {
    router.push(`/listoerp/administracion/series/${series.id}`);
  };

  if (isLoading) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
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
    <ListSeries
      series={series ?? []}
      onEdit={handleEdit}
    />
  );
}
