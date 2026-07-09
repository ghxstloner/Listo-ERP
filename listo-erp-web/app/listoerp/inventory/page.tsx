"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { CreateDepartment } from "@/packages/department/components/modals/create-department";
import { EditDepartment } from "@/packages/department/components/modals/edit-department";
import { ListDepartment } from "@/packages/department/components/list-department";
import { useGetDepartments } from "@/packages/department/api";
import type { Department } from "@/packages/department/types";
import { useHierarchyNames } from "@/packages/company/hooks/use-hierarchy-names";
import { getApiCompanyId } from "@config";
import { Spinner } from "@phosphor-icons/react";
import { encodeId } from "@/lib/hash-id";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DepartmentsPage() {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const router = useRouter();
  const companyId = Number(getApiCompanyId());
  const [response, isLoading, error] = useGetDepartments();
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { names: hierarchyNames } = useHierarchyNames(companyId);

  // Usar el entityName del backend o el de la configuración
  const displayName = response?.meta?.entityName || hierarchyNames.level1;

  useEffect(() => {
    setTitle(displayName);
  }, [setTitle, displayName]);

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
  };

  const handleViewChildren = (department: Department) => {
    router.push(`/listoerp/inventory/${encodeId(department.id)}`);
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
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <ListDepartment
        departments={response?.data ?? []}
        companyId={companyId}
        onEdit={handleEdit}
        onViewChildren={handleViewChildren}
        hierarchyNames={{ ...hierarchyNames, level1: displayName }}
        headerAction={<CreateDepartment companyId={companyId} hierarchyNames={{ ...hierarchyNames, level1: displayName }} />}
      />
      <EditDepartment
        editingDepartment={editingDepartment}
        companyId={companyId}
        hierarchyNames={{ ...hierarchyNames, level1: displayName }}
        onClose={() => setEditingDepartment(null)}
      />
    </div>
  );
}
