"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { useGetBranch } from "@/packages/branch/api";
import { BranchConfigForm } from "@/packages/branch/components/branch-config-form";
import { BranchWarehousesTab } from "@/packages/branch/components/branch-warehouses-tab";
import { ArrowLeft, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function BranchEditPage() {
  const t = useTranslation();
  const params = useParams();
  const idParam = params.id as string;
  const branchId = idParam ? Number(idParam) : NaN;

  const [branch, isLoading, error] = useGetBranch(Number.isNaN(branchId) ? 0 : branchId);

  if (idParam === undefined || Number.isNaN(branchId)) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("company.branches.noBranches")}</p>
        <Button variant="outline" asChild>
          <Link href="/listoerp/company/branches">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("navigation.branchesConfiguration")}
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  if (error || !branch) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">
          {t("common.error")}: {(error as Error)?.message ?? t("company.branches.noBranches")}
        </p>
        <Button variant="outline" asChild>
          <Link href="/listoerp/company/branches">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("navigation.branchesConfiguration")}
          </Link>
        </Button>
      </div>
    );
  }

  const companyId = branch.companyId;

  return (
    <div className="w-full p-2">
      <Tabs defaultValue="general" className="w-full">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/listoerp/company/branches"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("navigation.branchesConfiguration")}
            </Link>
          </Button>
          <TabsList>
            <TabsTrigger value="general">{t("company.generalConfiguration")}</TabsTrigger>
            <TabsTrigger value="warehouses">{t("company.branches.assignedWarehouses")}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="general" className="mt-2 w-full">
          <BranchConfigForm
            key={branch.id}
            branch={branch}
            companyId={companyId}
          />
        </TabsContent>
        <TabsContent value="warehouses" className="mt-2 w-full">
          <BranchWarehousesTab branchId={branch.id} companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
