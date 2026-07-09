"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { useGetCompanyUsersByCompany } from "@/packages/company-user/api";
import { ListCompanyUser } from "@/packages/company-user/components/list-company-user";
import { CreateCompanyUser } from "@/packages/company-user/components/modals/create-company-user";
import { EditCompanyUser } from "@/packages/company-user/components/modals/edit-company-user";
import type { CompanyUserWithUser } from "@/packages/company-user/types";
import { Spinner } from "@phosphor-icons/react";
import { useState } from "react";

interface CompanyUsersConfigProps {
  companyId: number;
}

export function CompanyUsersConfig({ companyId }: CompanyUsersConfigProps) {
  const t = useTranslation();
  const [users, isLoading, error] = useGetCompanyUsersByCompany(companyId);
  const [editingUser, setEditingUser] = useState<CompanyUserWithUser | null>(null);

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

  return (
    <>
      <ListCompanyUser
        users={users || []}
        companyId={companyId}
        onEdit={setEditingUser}
        headerAction={
          <CreateCompanyUser companyId={companyId} />
        }
      />
      <EditCompanyUser
        editingUser={editingUser}
        companyId={companyId}
        onClose={() => setEditingUser(null)}
      />
    </>
  );
}
