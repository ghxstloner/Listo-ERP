"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Category } from "@/packages/category/types";
import type { Department } from "@/packages/department/types";
import type { SubCategory } from "@/packages/subcategory/types";
import type { SubDepartment } from "@/packages/subdepartment/types";
import { Check, ChevronsUpDown } from "lucide-react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";

type HierarchyItem = Department | SubDepartment | Category | SubCategory;

interface SearchSelectProps<T extends HierarchyItem> {
  items: T[];
  label: string;
  placeholder: string;
  selectedId?: number;
  disabled?: boolean;
  onChange: (id?: number) => void;
}

function SearchSelect<T extends HierarchyItem>({
  items,
  label,
  placeholder,
  selectedId,
  disabled,
  onChange,
}: SearchSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selectedItem = items.find((item) => item.id === selectedId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          disabled={disabled}
          className="h-11 w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selectedItem && "text-muted-foreground")}>{selectedItem?.name ?? placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No se encontraron opciones.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={`todos ${label}`}
                onSelect={() => {
                  onChange();
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 size-4", selectedId === undefined ? "opacity-100" : "opacity-0")} />
                Todos
              </CommandItem>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.code} ${item.name}`}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-4", selectedId === item.id ? "opacity-100" : "opacity-0")} />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface PosToolbarProps {
  departmentId?: number;
  departments: Department[];
  subdepartmentId?: number;
  subdepartments: SubDepartment[];
  categoryId?: number;
  categories: Category[];
  subcategoryId?: number;
  subcategories: SubCategory[];
  search: string;
  onDepartmentChange: (departmentId?: number) => void;
  onSubdepartmentChange: (subdepartmentId?: number) => void;
  onCategoryChange: (categoryId?: number) => void;
  onSubcategoryChange: (subcategoryId?: number) => void;
  onSearchChange: (search: string) => void;
}

export function PosToolbar({
  departmentId,
  departments,
  subdepartmentId,
  subdepartments,
  categoryId,
  categories,
  subcategoryId,
  subcategories,
  search,
  onDepartmentChange,
  onSubdepartmentChange,
  onCategoryChange,
  onSubcategoryChange,
  onSearchChange,
}: PosToolbarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
      <div className="relative min-w-64 flex-1">
        <MagnifyingGlass className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input className="h-11 pl-9" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar producto o SKU" />
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        <div className="w-full sm:w-52"><SearchSelect label="Departamento" placeholder="Todos los departamentos" items={departments} selectedId={departmentId} onChange={onDepartmentChange} /></div>
        {departmentId && subdepartments.length > 0 && <div className="w-full sm:w-52"><SearchSelect label="Subdepartamento" placeholder="Todos los subdepartamentos" items={subdepartments} selectedId={subdepartmentId} onChange={onSubdepartmentChange} /></div>}
        {subdepartmentId && categories.length > 0 && <div className="w-full sm:w-52"><SearchSelect label="Categoría" placeholder="Todas las categorías" items={categories} selectedId={categoryId} onChange={onCategoryChange} /></div>}
        {categoryId && subcategories.length > 0 && <div className="w-full sm:w-52"><SearchSelect label="Subcategoría" placeholder="Todas las subcategorías" items={subcategories} selectedId={subcategoryId} onChange={onSubcategoryChange} /></div>}
      </div>
    </div>
  );
}
