"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { SeriesForm } from "@/packages/series/components/series-form";
import { useEffect } from "react";

export default function NewSeriesPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("administration.series.addNewSeries"));
  }, [setTitle, t]);

  return (
    <div className="w-full p-2">
      <SeriesForm />
    </div>
  );
}
