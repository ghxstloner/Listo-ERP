"use client";

import { PageLoading } from "@/components/page-loading";
import { showToast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { useGetCompany, useUpdateCompany } from "@/packages/company/api";
import { CompanyConfig } from "@/packages/company/components/company-config";
import { CompanyHierarchyConfig } from "@/packages/company/components/company-hierarchy-config";
import { CompanyRolesConfig } from "@/packages/company/components/company-roles-config";
import { CompanyUsersConfig } from "@/packages/company/components/company-users-config";
import { CompanyWarehousesConfig } from "@/packages/warehouse/components/company-warehouses-config";
import { getApiCompanyId } from "@config";
import { Spinner } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function CompanyPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const companyId = Number(getApiCompanyId());
  const [company, isLoading, error] = useGetCompany(companyId);
  const [updateCompany, isUpdating] = useUpdateCompany(companyId);

  useEffect(() => {
    setTitle(t("company.configuration"));
  }, [setTitle, t]);

  const handleUpdate = (data: Partial<NonNullable<typeof company>>) => {
    updateCompany(data, (response) => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      showToast({
        type: "success",
        message: response.message,
      });
    });
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
        <p className="text-destructive">{t("common.error")}: {error.message}</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t("company.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <Tabs defaultValue={searchParams.get("tab") ?? "general"} className="w-full">
        <TabsList>
          <TabsTrigger value="general">{t("company.generalConfiguration")}</TabsTrigger>
          <TabsTrigger value="users">{t("company.usersConfiguration")}</TabsTrigger>
          <TabsTrigger value="roles">Roles y permisos</TabsTrigger>
          <TabsTrigger value="warehouses">{t("company.warehousesConfiguration")}</TabsTrigger>
          <TabsTrigger value="hierarchy">{t("company.hierarchyConfiguration")}</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-2 w-full">
          <CompanyConfig
            company={company}
            onUpdate={handleUpdate}
            onLogoUploaded={() => queryClient.invalidateQueries({ queryKey: ["company"] })}
            isUpdating={isUpdating}
          />
        </TabsContent>
        <TabsContent value="users" className="mt-2 w-full">
          <CompanyUsersConfig companyId={companyId} />
        </TabsContent>
        <TabsContent value="roles" className="mt-2 w-full">
          <CompanyRolesConfig />
        </TabsContent>
        <TabsContent value="warehouses" className="mt-2 w-full">
          <CompanyWarehousesConfig companyId={companyId} />
        </TabsContent>
        <TabsContent value="hierarchy" className="mt-2 w-full">
          <CompanyHierarchyConfig companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
