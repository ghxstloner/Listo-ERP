"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { showToast } from "@/components/ui/sonner";
import { useCreateCompanyRole, useUpdateCompanyRole } from "@/packages/company/api";
import type { CompanyRole, Permission } from "@/packages/company/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SECTION_LABELS: Record<string, string> = {
  dashboard: "General",
  administration: "Administración",
  inventory: "Inventario",
  purchases: "Compras",
  sales: "Ventas",
  treasury: "Tesorería",
  reports: "Reportes",
};

function groupPermissions(permissions: Permission[]) {
  return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
    const section = permission.code.split(".")[0];
    (groups[section] ??= []).push(permission);
    return groups;
  }, {});
}

export function CompanyRoleForm({ role, permissions }: { role?: CompanyRole; permissions: Permission[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [isActive, setIsActive] = useState(role?.isActive ?? true);
  const [codes, setCodes] = useState<string[]>(role?.permissions.map(({ permission }) => permission.code) ?? []);
  const [createRole, isCreating] = useCreateCompanyRole();
  const [updateRole, isUpdating] = useUpdateCompanyRole(role?.id ?? 0);
  const isSaving = isCreating || isUpdating;
  const groups = groupPermissions(permissions);

  const togglePermission = (code: string) => setCodes((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  const toggleSection = (sectionPermissions: Permission[]) => {
    const sectionCodes = sectionPermissions.map((permission) => permission.code);
    const hasAll = sectionCodes.every((code) => codes.includes(code));
    setCodes((current) => hasAll ? current.filter((code) => !sectionCodes.includes(code)) : [...new Set([...current, ...sectionCodes])]);
  };
  const save = () => {
    if (!name.trim()) {
      showToast({ type: "error", message: "El nombre del rol es obligatorio." });
      return;
    }
    const payload = { name: name.trim(), description: description.trim() || undefined, isActive, permissionCodes: codes };
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: ["access", "roles"] });
      queryClient.invalidateQueries({ queryKey: ["companies-users"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      showToast({ type: "success", message: role ? "Rol actualizado." : "Rol creado." });
      router.push("/listoerp/company?tab=roles");
    };
    if (role) updateRole(payload, onSuccess);
    else createRole(payload, onSuccess);
  };

  return <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Información del rol</CardTitle><CardDescription>Define el nombre, la descripción y el estado del rol.</CardDescription></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="role-name">Nombre</Label><Input id="role-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isSaving} autoFocus /></div>
        <div className="space-y-2"><Label htmlFor="role-description">Descripción</Label><Input id="role-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={isSaving} /></div>
        <div className="flex items-center justify-between rounded-lg border px-4 py-3 md:col-span-2"><div><Label htmlFor="role-active">Rol activo</Label><p className="text-sm text-muted-foreground">Los roles inactivos no estarán disponibles para asignar.</p></div><Switch id="role-active" checked={isActive} onCheckedChange={setIsActive} disabled={isSaving} /></div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Permisos</CardTitle><CardDescription>Selecciona los accesos que podrá usar este rol. Se han seleccionado {codes.length} permisos.</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groups).map(([section, sectionPermissions]) => {
          const selectedCount = sectionPermissions.filter((permission) => codes.includes(permission.code)).length;
          const hasAll = selectedCount === sectionPermissions.length;
          return <section key={section} className="rounded-lg border"><div className="flex flex-col gap-3 border-b bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-medium">{SECTION_LABELS[section] ?? section}</h2><p className="text-sm text-muted-foreground">{selectedCount} de {sectionPermissions.length} permisos seleccionados</p></div><Button type="button" variant="outline" size="sm" onClick={() => toggleSection(sectionPermissions)} disabled={isSaving}>{hasAll ? "Quitar todos" : "Seleccionar todos"}</Button></div><div className="grid gap-2 p-4 md:grid-cols-2">{sectionPermissions.map((permission) => { const selected = codes.includes(permission.code); return <Button key={permission.code} type="button" variant={selected ? "default" : "outline"} className="h-auto min-h-10 justify-start whitespace-normal px-3 py-2 text-left" onClick={() => togglePermission(permission.code)} disabled={isSaving}><span>{permission.name}</span>{permission.description && <span className="ml-1 text-xs opacity-70">{permission.description}</span>}</Button>; })}</div></section>;
        })}
      </CardContent>
    </Card>
    <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => router.back()} disabled={isSaving}>Cancelar</Button><Button onClick={save} disabled={isSaving || !name.trim()}>{isSaving ? "Guardando..." : "Guardar rol"}</Button></div>
  </div>;
}
