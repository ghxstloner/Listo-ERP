"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { CreateCategory } from "@/packages/category/components/modals/create-category";
import { EditCategory } from "@/packages/category/components/modals/edit-category";
import { ListCategory } from "@/packages/category/components/list-category";
import { useGetCategories } from "@/packages/category/api";
import type { Category } from "@/packages/category/types";
import { useHierarchyNames } from "@/packages/company/hooks/use-hierarchy-names";
import { getApiCompanyId } from "@config";
import { Spinner, ArrowLeft } from "@phosphor-icons/react";
import { encodeId, decodeId } from "@/lib/hash-id";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CategoriesPageProps {
  params: Promise<{
    departmentId: string;
    subdepartmentId: string;
  }>;
}

export default function CategoriesPage({ params }: CategoriesPageProps) {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const router = useRouter();
  const companyId = Number(getApiCompanyId());
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [subdepartmentId, setSubdepartmentId] = useState<number | null>(null);
  const [response, isLoading, error] = useGetCategories(subdepartmentId ?? undefined);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { names: hierarchyNames } = useHierarchyNames(companyId);

  // Usar el entityName del backend o el de la configuración
  const displayName = response?.meta?.entityName || hierarchyNames.level3;

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      const decodedDeptId = decodeId(resolvedParams.departmentId);
      const decodedSubdeptId = decodeId(resolvedParams.subdepartmentId);
      if (decodedDeptId === null || decodedSubdeptId === null) {
        return;
      }
      setDepartmentId(decodedDeptId);
      setSubdepartmentId(decodedSubdeptId);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    setTitle(displayName);
  }, [setTitle, displayName]);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  const handleViewChildren = (category: Category) => {
    if (departmentId && subdepartmentId) {
      router.push(`/listoerp/inventory/${encodeId(departmentId)}/subdepartments/${encodeId(subdepartmentId)}/categories/${encodeId(category.id)}`);
    }
  };

  if (!subdepartmentId || isLoading) {
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
          <Link href={`/listoerp/inventory/${encodeId(departmentId!)}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {hierarchyNames.level2}
          </Link>
        </Button>
      </div>
      <ListCategory
        categories={response?.data ?? []}
        subdepartmentId={subdepartmentId}
        onEdit={handleEdit}
        onViewChildren={handleViewChildren}
        hierarchyNames={{ ...hierarchyNames, level3: displayName }}
        headerAction={<CreateCategory subdepartmentId={subdepartmentId} hierarchyNames={{ ...hierarchyNames, level3: displayName }} />}
      />
      <EditCategory
        editingCategory={editingCategory}
        subdepartmentId={subdepartmentId}
        hierarchyNames={{ ...hierarchyNames, level3: displayName }}
        onClose={() => setEditingCategory(null)}
      />
    </div>
  );
}
