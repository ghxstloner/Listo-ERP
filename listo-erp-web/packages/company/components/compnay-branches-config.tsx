"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { useGetBranchesByCompany } from "@/packages/branch/api";
import { ListBranch } from "@/packages/branch/components/list-branch";
import { CreateBranch } from "@/packages/branch/components/modals/create-branch";
import type { Branch } from "@/packages/branch/types";
import { Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

interface CompanyBranchesConfigProps {
  companyId: number;
}

export function CompanyBranchesConfig({ companyId }: CompanyBranchesConfigProps) {
  const t = useTranslation();
  const router = useRouter();
  const [branches, isLoading, error] = useGetBranchesByCompany(companyId);

  const handleEdit = (branch: Branch) => {
    router.push(`/listoerp/company/branches/${branch.id}`);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">
          {t("common.error")}: {error.message}
        </p>
      </div>
    );
  }

  const companyBranches =
    branches?.filter((b) => b.companyId === companyId) ?? branches ?? [];

  return (
    <ListBranch
      branches={companyBranches}
      companyId={companyId}
      onEdit={handleEdit}
      headerAction={<CreateBranch companyId={companyId} />}
    />
  );
}
