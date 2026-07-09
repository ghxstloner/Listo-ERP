"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { useGetCompany } from "@/packages/company/api";
import { CompanyBranchesConfig } from "@/packages/company/components/compnay-branches-config";
import { getApiCompanyId } from "@config";
import { Spinner } from "@phosphor-icons/react";
import { useEffect } from "react";

export default function BranchesPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const companyId = Number(getApiCompanyId());
  const [company, isLoading, error] = useGetCompany(companyId);

  useEffect(() => {
    setTitle(t("navigation.branchesConfiguration"));
  }, [setTitle, t]);

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

  if (!company) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">{t("company.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <CompanyBranchesConfig companyId={companyId} />
    </div>
  );
}
