import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Department } from "@/packages/department/types";
import { MagnifyingGlass } from "@phosphor-icons/react";

interface PosToolbarProps {
  departmentId?: number;
  departments: Department[];
  search: string;
  onDepartmentChange: (departmentId?: number) => void;
  onSearchChange: (search: string) => void;
}

export function PosToolbar({ departmentId, departments, search, onDepartmentChange, onSearchChange }: PosToolbarProps) {
  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
      <div className="relative max-w-xl flex-1">
        <MagnifyingGlass className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input className="h-11 pl-9" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar producto o SKU" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button size="sm" variant={departmentId === undefined ? "default" : "outline"} onClick={() => onDepartmentChange()}>
          Todos
        </Button>
        {departments.map((department) => (
          <Button key={department.id} size="sm" variant={departmentId === department.id ? "default" : "outline"} onClick={() => onDepartmentChange(department.id)}>
            {department.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
