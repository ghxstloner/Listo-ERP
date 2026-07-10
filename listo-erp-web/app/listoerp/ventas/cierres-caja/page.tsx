"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { CashClosuresList } from "@/packages/cash-sessions/components/cash-closures-list";
import { useEffect } from "react";

export default function CashClosuresPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();

  useEffect(() => {
    setTitle(t("sales.cashClosures.title"));
  }, [setTitle, t]);

  return (
    <div className="w-full space-y-4 p-2">
      <CashClosuresList />
    </div>
  );
}
