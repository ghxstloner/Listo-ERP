# Plan: Company Selector in Header

## Objetivo
Agregar un selector de empresa en el header (a la derecha, antes de los iconos de idioma y tema) que permita al usuario cambiar entre las empresas a las que esta asociado.

## Comportamiento
- **1 empresa**: Solo muestra el nombre de la empresa con un icono (sin dropdown)
- **2+ empresas**: Muestra un `Select` dropdown con las empresas para cambiar entre ellas
- Al cambiar de empresa: actualiza cookie, aplica tema de la nueva empresa, y recarga la pagina

## Archivos a modificar

### 1. CREAR: `listo-erp-web/components/company-selector.tsx`

Nuevo componente `CompanySelector` que:
- Usa `useGetMyCompanies()` de `packages/company-user/api.ts` para obtener las empresas del usuario
- Lee la empresa actual del cookie `selected-company`
- Si hay 1 empresa: renderiza texto plano con icono `Buildings` + nombre
- Si hay 2+ empresas: renderiza un `Select` con las empresas
- Al cambiar: llama `setApiCompanyId()`, `applyCompanyTheme()`, y `window.location.reload()`
- Muestra `Spinner` mientras carga
- Estilo compacto para caber en el header

```tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyCompanyTheme } from "@/lib/company-theme";
import { useGetMyCompanies } from "@/packages/company-user/api";
import { setApiCompanyId } from "@config";
import { Buildings, Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export function CompanySelector() {
  const router = useRouter();
  const [companies, isLoading] = useGetMyCompanies();
  const currentCompanyId =
    typeof window !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("selected-company="))
          ?.split("=")[1] ?? ""
      : "";

  if (isLoading) {
    return <Spinner size={20} className="animate-spin" />;
  }

  if (!companies || companies.length === 0) return null;

  if (companies.length === 1) {
    const company = companies[0].company;
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Buildings className="h-4 w-4" />
        <span>{company.name}</span>
      </div>
    );
  }

  return (
    <Select
      value={currentCompanyId}
      onValueChange={(newCompanyId) => {
        const companyUser = companies.find(
          (cu) => String(cu.company.id) === newCompanyId,
        );
        if (!companyUser) return;

        setApiCompanyId(String(companyUser.company.id));
        applyCompanyTheme({
          primaryColor: companyUser.company.primaryColor,
          secondaryColor: companyUser.company.secondaryColor,
        });
        window.location.reload();
      }}
    >
      <SelectTrigger className="h-8 w-auto min-w-[120px] max-w-[200px] border-none bg-transparent px-2 text-sm font-medium text-muted-foreground shadow-none hover:bg-accent/50">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Buildings className="h-4 w-4 shrink-0" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {companies.map((cu) => (
          <SelectItem key={cu.company.id} value={String(cu.company.id)}>
            {cu.company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### 2. MODIFICAR: `listo-erp-web/app/listoerp/layout.tsx`

Cambios:
1. Agregar import: `import { CompanySelector } from "@/components/company-selector";`
2. Agregar `<CompanySelector />` dentro del `<div className="ml-auto flex items-center gap-2">` antes de `<LanguageToggle />`

**Antes (lineas 379-382):**
```tsx
<div className="ml-auto flex items-center gap-2">
  <LanguageToggle />
  <ThemeToggle />
</div>
```

**Despues:**
```tsx
<div className="ml-auto flex items-center gap-2">
  <CompanySelector />
  <LanguageToggle />
  <ThemeToggle />
</div>
```

## Dependencias existentes utilizadas
- `useGetMyCompanies()` - ya existe en `packages/company-user/api.ts`
- `Select` UI - ya existe en `components/ui/select.tsx`
- `setApiCompanyId()` - ya existe en `packages/config/api.ts`
- `applyCompanyTheme()` - ya existe en `lib/company-theme.ts`
- `Buildings` icon - ya importado en el layout

## Notas
- No se necesita nuevo endpoint API
- `window.location.reload()` asegura que todos los datos se recarguen limpiamente con la nueva empresa
- El componente es compacto y sigue el estilo de los toggles existentes
