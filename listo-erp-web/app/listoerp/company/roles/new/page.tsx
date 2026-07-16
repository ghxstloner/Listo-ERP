"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { useGetPermissions } from "@/packages/company/api";
import { CompanyRoleForm } from "@/packages/company/components/company-role-form";
import { ArrowLeft, Spinner } from "@phosphor-icons/react";
import Link from "next/link";

export default function NewCompanyRolePage() {
  const [permissions, isLoading, error] = useGetPermissions();
  if (isLoading) return <PageLoading text="Cargando permisos..." icon={<Spinner size={32} />} spin />;
  if (error) return <div className="flex min-h-[400px] flex-col items-center justify-center gap-4"><p className="text-destructive">No se pudieron cargar los permisos.</p><Button variant="outline" asChild><Link href="/listoerp/company?tab=roles">Volver a empresa</Link></Button></div>;
  return <div className="w-full p-2"><Button size="sm" variant="ghost" asChild><Link href="/listoerp/company?tab=roles" className="text-muted-foreground"><ArrowLeft className="mr-1 size-4" />Roles y permisos</Link></Button><div className="mt-2"><CompanyRoleForm permissions={permissions ?? []} /></div></div>;
}
