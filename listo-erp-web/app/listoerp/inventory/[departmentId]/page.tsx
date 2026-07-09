"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { CreateSubDepartment } from "@/packages/subdepartment/components/modals/create-subdepartment";
import { EditSubDepartment } from "@/packages/subdepartment/components/modals/edit-subdepartment";
import { ListSubDepartment } from "@/packages/subdepartment/components/list-subdepartment";
import { useGetSubDepartments } from "@/packages/subdepartment/api";
import type { SubDepartment } from "@/packages/subdepartment/types";
import { useHierarchyNames } from "@/packages/company/hooks/use-hierarchy-names";
import { getApiCompanyId } from "@config";
import { Spinner, ArrowLeft } from "@phosphor-icons/react";
import { encodeId, decodeId } from "@/lib/hash-id";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SubDepartmentsPageProps {
  params: Promise<{
    departmentId: string;
  }>;
}

export default function SubDepartmentsPage({ params }: SubDepartmentsPageProps) {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const router = useRouter();
  const companyId = Number(getApiCompanyId());
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [response, isLoading, error] = useGetSubDepartments(departmentId ?? undefined);
  const [editingSubDepartment, setEditingSubDepartment] = useState<SubDepartment | null>(null);
  const { names: hierarchyNames } = useHierarchyNames(companyId);

  // Usar el entityName del backend o el de la configuración
  const displayName = response?.meta?.entityName || hierarchyNames.level2;

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      const decodedId = decodeId(resolvedParams.departmentId);
      if (decodedId === null) {
        return;
      }
      setDepartmentId(decodedId);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    setTitle(displayName);
  }, [setTitle, displayName]);

  const handleEdit = (subdepartment: SubDepartment) => {
    setEditingSubDepartment(subdepartment);
  };

  const handleViewChildren = (subdepartment: SubDepartment) => {
    if (departmentId) {
      router.push(`/listoerp/inventory/${encodeId(departmentId)}/subdepartments/${encodeId(subdepartment.id)}`);
    }
  };

  if (!departmentId || isLoading) {
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

  return (
    <div className="w-full p-2">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/listoerp/inventory" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {hierarchyNames.level1}
          </Link>
        </Button>
      </div>
      <ListSubDepartment
        subdepartments={response?.data ?? []}
        departmentId={departmentId}
        onEdit={handleEdit}
        onViewChildren={handleViewChildren}
        hierarchyNames={{ ...hierarchyNames, level2: displayName }}
        headerAction={<CreateSubDepartment departmentId={departmentId} hierarchyNames={{ ...hierarchyNames, level2: displayName }} />}
      />
      <EditSubDepartment
        editingSubDepartment={editingSubDepartment}
        departmentId={departmentId}
        hierarchyNames={{ ...hierarchyNames, level2: displayName }}
        onClose={() => setEditingSubDepartment(null)}
      />
    </div>
  );
}
