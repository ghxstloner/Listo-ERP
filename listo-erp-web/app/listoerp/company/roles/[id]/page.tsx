"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { useGetCompanyRoles, useGetPermissions } from "@/packages/company/api";
import { CompanyRoleForm } from "@/packages/company/components/company-role-form";
import { ArrowLeft, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CompanyRoleDetailPage() {
  const params = useParams();
  const roleId = Number(params.id);
  const [roles, loadingRoles, rolesError] = useGetCompanyRoles();
  const [permissions, loadingPermissions, permissionsError] = useGetPermissions();
  if (loadingRoles || loadingPermissions) return <PageLoading text="Cargando rol..." icon={<Spinner size={32} />} spin />;
  const role = roles?.find((item) => item.id === roleId);
  if (rolesError || permissionsError || !role) return <div className="flex min-h-[400px] flex-col items-center justify-center gap-4"><p className="text-destructive">No se pudo cargar el rol.</p><Button variant="outline" asChild><Link href="/listoerp/company?tab=roles">Volver a empresa</Link></Button></div>;
  return <div className="w-full p-2"><Button size="sm" variant="ghost" asChild><Link href="/listoerp/company?tab=roles" className="text-muted-foreground"><ArrowLeft className="mr-1 size-4" />Roles y permisos</Link></Button><div className="mt-2"><CompanyRoleForm role={role} permissions={permissions ?? []} /></div></div>;
}
