import { useMemo } from "react";
import { useGetHierarchyConfig } from "../api";
import type { HierarchyConfig } from "../types";

const DEFAULT_NAMES = {
  level1: "Departamento",
  level2: "Subdepartamento",
  level3: "Categoría",
  level4: "Subcategoría",
};

export interface HierarchyNames {
  level1: string;
  level2: string;
  level3: string;
  level4: string;
}

export function useHierarchyNames(companyId: number): {
  names: HierarchyNames;
  isLoading: boolean;
  error: Error | null;
} {
  const isValidCompanyId = companyId > 0 && !isNaN(companyId);
  const safeCompanyId = isValidCompanyId ? companyId : 0;
  
  const [response, isLoading, error] = useGetHierarchyConfig(safeCompanyId);

  const names = useMemo<HierarchyNames>(() => {
    if (!isValidCompanyId || !response) {
      return DEFAULT_NAMES;
    }

    const config = response as HierarchyConfig;
    
    return {
      level1: config.level1Name || DEFAULT_NAMES.level1,
      level2: config.level2Name || DEFAULT_NAMES.level2,
      level3: config.level3Name || DEFAULT_NAMES.level3,
      level4: config.level4Name || DEFAULT_NAMES.level4,
    };
  }, [response, isValidCompanyId]);

  return {
    names,
    isLoading: isValidCompanyId ? isLoading : false,
    error: isValidCompanyId ? (error as Error | null) : null,
  };
}