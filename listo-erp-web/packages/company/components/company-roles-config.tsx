"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { api } from "@config";
import { useGetCompanyRoles } from "../api";
import type { CompanyRole } from "../types";
import { Plus } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CompanyRoleTable } from "./company-role-table";

export function CompanyRolesConfig() {
  const queryClient = useQueryClient();
  const [roles, loadingRoles, rolesError] = useGetCompanyRoles();
  const router = useRouter();
  const deleteRole = useMutation({ mutationFn: (roleId: number) => api.delete<{ message: string }>(`access/roles/${roleId}`) });

  if (loadingRoles) return <Card><CardContent className="py-8 text-center text-muted-foreground">Cargando roles...</CardContent></Card>;
  if (rolesError) return <Card><CardContent className="py-8 text-destructive">No se pudieron cargar los roles: {rolesError.message}</CardContent></Card>;

  const remove = (role: CompanyRole) => {
    if (!window.confirm(`¿Eliminar el rol ${role.name}?`)) return;
    deleteRole.mutate(role.id, { onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access", "roles"] });
      queryClient.invalidateQueries({ queryKey: ["companies-users"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      showToast({ type: "success", message: "Rol eliminado." });
    }});
  };

  return <Card>
    <CardHeader><CardTitle>Roles y permisos</CardTitle><CardDescription>Crea roles propios de esta empresa y define los accesos que pueden usar.</CardDescription></CardHeader>
    <CardContent><CompanyRoleTable roles={roles ?? []} onEdit={(role) => router.push(`/listoerp/company/roles/${role.id}`)} onDelete={remove} isDeleting={deleteRole.isPending} deletingRoleId={deleteRole.variables ?? null} action={<Button size="sm" onClick={() => router.push("/listoerp/company/roles/new")}><Plus className="mr-2 size-4" />Nuevo rol</Button>} /></CardContent>
  </Card>;
}
