"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { ListSeries } from "@/packages/series/components/list-series";
import { useGetSeries } from "@/packages/series/api";
import type { Series } from "@/packages/series/types";
import { Plus, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SeriesPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const router = useRouter();
  const [series, isLoading, error] = useGetSeries();

  useEffect(() => {
    setTitle(t("administration.series.title"));
  }, [setTitle, t]);

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
    <div className="w-full p-2">
      <ListSeries
        series={series ?? []}
        onEdit={handleEdit}
        headerAction={
          <Button size="sm" asChild>
            <Link href="/listoerp/administracion/series/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              {t("administration.series.addNewSeries")}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
