"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { SeriesList } from "@/packages/series/components/series-list";
import { Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";

export default function SeriesPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("administration.series.title"));
  }, [setTitle, t]);

  return (
    <div className="w-full p-2">
      <SeriesList
        headerAction={
          <Button size="sm" asChild>
            <Link href="/listoerp/company/series/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("administration.series.addNewSeries")}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
