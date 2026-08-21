"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { SeriesForm } from "@/packages/series/components/series-form";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";

export default function NewSeriesPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("administration.series.addNewSeries"));
  }, [setTitle, t]);

  return (
    <div className="w-full p-2">
      <Button size="sm" variant="ghost" asChild>
        <Link
          href="/listoerp/company/series"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t("administration.series.title")}
        </Link>
      </Button>
      <div className="mt-2">
        <SeriesForm />
      </div>
    </div>
  );
}
