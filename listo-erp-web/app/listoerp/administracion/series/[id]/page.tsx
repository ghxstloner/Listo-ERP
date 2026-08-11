"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { useGetSeriesById } from "@/packages/series/api";
import { SeriesForm } from "@/packages/series/components/series-form";
import { ArrowLeft, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function SeriesEditPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const params = useParams();
  const seriesId = Number(params.id);
  const [series, isLoading, error] = useGetSeriesById(seriesId);

  useEffect(() => {
    if (series) {
      setTitle(series.description);
    }
  }, [setTitle, series]);

  if (isLoading) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  if (error || !series) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">
          {t("common.error")}:{" "}
          {(error as Error)?.message ?? t("administration.series.seriesNotFound")}
        </p>
        <Button variant="outline" asChild>
          <Link href="/listoerp/administracion/series">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("administration.series.title")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/listoerp/administracion/series"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("administration.series.title")}
          </Link>
        </Button>
      </div>
      <div className="mt-2">
        <SeriesForm key={series.id} series={series} />
      </div>
    </div>
  );
}
