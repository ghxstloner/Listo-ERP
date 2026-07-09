"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { usePageTitle } from "@/lib/page-title-context";
import { CreateSubCategory } from "@/packages/subcategory/components/modals/create-subcategory";
import { EditSubCategory } from "@/packages/subcategory/components/modals/edit-subcategory";
import { ListSubCategory } from "@/packages/subcategory/components/list-subcategory";
import { useGetSubCategories } from "@/packages/subcategory/api";
import type { SubCategory } from "@/packages/subcategory/types";
import { useHierarchyNames } from "@/packages/company/hooks/use-hierarchy-names";
import { getApiCompanyId } from "@config";
import { encodeId, decodeId } from "@/lib/hash-id";
import { Spinner, ArrowLeft } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SubCategoriesPageProps {
  params: Promise<{
    departmentId: string;
    subdepartmentId: string;
    categoryId: string;
  }>;
}

export default function SubCategoriesPage({ params }: SubCategoriesPageProps) {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const companyId = Number(getApiCompanyId());
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [subdepartmentId, setSubdepartmentId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [response, isLoading, error] = useGetSubCategories(categoryId ?? undefined);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const { names: hierarchyNames } = useHierarchyNames(companyId);

  // Usar el entityName del backend o el de la configuración
  const displayName = response?.meta?.entityName || hierarchyNames.level4;

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      const decodedDeptId = decodeId(resolvedParams.departmentId);
      const decodedSubdeptId = decodeId(resolvedParams.subdepartmentId);
      const decodedCategoryId = decodeId(resolvedParams.categoryId);
      if (decodedDeptId === null || decodedSubdeptId === null || decodedCategoryId === null) {
        return;
      }
      setDepartmentId(decodedDeptId);
      setSubdepartmentId(decodedSubdeptId);
      setCategoryId(decodedCategoryId);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    setTitle(displayName);
  }, [setTitle, displayName]);

  const handleEdit = (subcategory: SubCategory) => {
    setEditingSubCategory(subcategory);
  };

  if (!categoryId || isLoading) {
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
          <Link href={`/listoerp/inventory/${encodeId(departmentId!)}/subdepartments/${encodeId(subdepartmentId!)}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {hierarchyNames.level3}
          </Link>
        </Button>
      </div>
      <ListSubCategory
        subcategories={response?.data ?? []}
        categoryId={categoryId}
        onEdit={handleEdit}
        hierarchyNames={{ ...hierarchyNames, level4: displayName }}
        headerAction={<CreateSubCategory categoryId={categoryId} hierarchyNames={{ ...hierarchyNames, level4: displayName }} />}
      />
      <EditSubCategory
        editingSubCategory={editingSubCategory}
        categoryId={categoryId}
        hierarchyNames={{ ...hierarchyNames, level4: displayName }}
        onClose={() => setEditingSubCategory(null)}
      />
    </div>
  );
}
