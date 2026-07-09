"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useGetHierarchyConfig, useUpdateHierarchyConfig } from "../api";
import type { HierarchyConfig, UpdateHierarchyConfigRequest } from "../types";

interface CompanyHierarchyConfigProps {
  companyId: number;
}

const DEFAULT_NAMES = {
  level1: "Departamento",
  level2: "Subdepartamento",
  level3: "Categoría",
  level4: "Subcategoría",
};

export function CompanyHierarchyConfig({ companyId }: CompanyHierarchyConfigProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [config, isLoading, error] = useGetHierarchyConfig(companyId);
  const [updateConfig, isUpdating] = useUpdateHierarchyConfig(companyId);

  const [level1Name, setLevel1Name] = useState(DEFAULT_NAMES.level1);
  const [level2Name, setLevel2Name] = useState(DEFAULT_NAMES.level2);
  const [level3Name, setLevel3Name] = useState(DEFAULT_NAMES.level3);
  const [level4Name, setLevel4Name] = useState(DEFAULT_NAMES.level4);

  useEffect(() => {
    if (config) {
      setLevel1Name(config.level1Name || DEFAULT_NAMES.level1);
      setLevel2Name(config.level2Name || DEFAULT_NAMES.level2);
      setLevel3Name(config.level3Name || DEFAULT_NAMES.level3);
      setLevel4Name(config.level4Name || DEFAULT_NAMES.level4);
    }
  }, [config]);

  useEffect(() => {
    if (error) {
      showToast({
        type: "error",
        message: (error as Error).message || t("common.error"),
      });
    }
  }, [error, t]);

  const handleSave = () => {
    if (!level1Name.trim() || !level2Name.trim() || !level3Name.trim() || !level4Name.trim()) {
      showToast({
        type: "error",
        message: t("company.hierarchy.validation.required"),
      });
      return;
    }

    if (
      level1Name.length > 50 ||
      level2Name.length > 50 ||
      level3Name.length > 50 ||
      level4Name.length > 50
    ) {
      showToast({
        type: "error",
        message: t("company.hierarchy.validation.maxLength"),
      });
      return;
    }

    const request: UpdateHierarchyConfigRequest = {
      level1Name: level1Name.trim(),
      level2Name: level2Name.trim(),
      level3Name: level3Name.trim(),
      level4Name: level4Name.trim(),
    };

    updateConfig(request, () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchy-config", companyId] });
      showToast({
        type: "success",
        message: t("company.hierarchy.updated"),
      });
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-[200px]">
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("company.hierarchyConfiguration")}</CardTitle>
      </CardHeader>
      <CardContent className="w-full">
        <div className="space-y-6">
          <p className="text-muted-foreground">
            {t("company.hierarchy.description")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="level1Name">{t("company.hierarchy.level1Name")}</Label>
              <Input
                id="level1Name"
                value={level1Name}
                onChange={(e) => setLevel1Name(e.target.value)}
                placeholder={t("company.hierarchy.level1Placeholder")}
                maxLength={50}
                disabled={isUpdating}
              />
              <p className="text-xs text-muted-foreground">
                {level1Name.length}/50
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level2Name">{t("company.hierarchy.level2Name")}</Label>
              <Input
                id="level2Name"
                value={level2Name}
                onChange={(e) => setLevel2Name(e.target.value)}
                placeholder={t("company.hierarchy.level2Placeholder")}
                maxLength={50}
                disabled={isUpdating}
              />
              <p className="text-xs text-muted-foreground">
                {level2Name.length}/50
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level3Name">{t("company.hierarchy.level3Name")}</Label>
              <Input
                id="level3Name"
                value={level3Name}
                onChange={(e) => setLevel3Name(e.target.value)}
                placeholder={t("company.hierarchy.level3Placeholder")}
                maxLength={50}
                disabled={isUpdating}
              />
              <p className="text-xs text-muted-foreground">
                {level3Name.length}/50
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level4Name">{t("company.hierarchy.level4Name")}</Label>
              <Input
                id="level4Name"
                value={level4Name}
                onChange={(e) => setLevel4Name(e.target.value)}
                placeholder={t("company.hierarchy.level4Placeholder")}
                maxLength={50}
                disabled={isUpdating}
              />
              <p className="text-xs text-muted-foreground">
                {level4Name.length}/50
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={
                isUpdating ||
                !level1Name.trim() ||
                !level2Name.trim() ||
                !level3Name.trim() ||
                !level4Name.trim()
              }
            >
              {isUpdating ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
