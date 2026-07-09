"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { useGetCompany } from "@/packages/company/api";
import { getApiCompanyId } from "@/packages/config";
import { Spinner } from "@phosphor-icons/react";
import { redirect } from "next/navigation";

export default function Home() {
  const t = useTranslation();
  const [company, isLoading, error] = useGetCompany(Number(getApiCompanyId()));
  if (isLoading) return <PageLoading text={t("common.loading")} icon={<Spinner size={32} />} spin={true} />;
  if (error) return <div>{t("common.error")}: {error.message}</div>;
  if (!company) return <div>{t("company.notFound")}</div>;

  redirect("/listoerp/dashboard");

  return (
    <div>
      <h1>{company?.name}</h1>
    </div>
  );
}
