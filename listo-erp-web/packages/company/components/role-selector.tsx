"use client";

import { Button } from "@/components/ui/button";
import type { CompanyRole } from "../types";

interface RoleSelectorProps {
  roles: CompanyRole[];
  value: number[];
  onChange: (roleIds: number[]) => void;
  disabled?: boolean;
}

export function RoleSelector({ roles, value, onChange, disabled }: RoleSelectorProps) {
  const activeRoles = roles.filter((role) => role.isActive);

  if (activeRoles.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay roles activos. Crea uno en la pestaña Roles y permisos.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeRoles.map((role) => {
        const selected = value.includes(role.id);
        return (
          <Button
            key={role.id}
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            disabled={disabled}
            onClick={() => onChange(selected ? value.filter((id) => id !== role.id) : [...value, role.id])}
          >
            {role.name}
          </Button>
        );
      })}
    </div>
  );
}
