"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useUpdateTill } from "@/packages/till/api";
import type { Till, UpdateTillRequest } from "@/packages/till/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

const CODE_LENGTH = 6;
const CODE_REGEX = /^[A-Z0-9]{6}$/;

interface TillConfigFormProps {
  till: Till;
  tillId: number;
}

export function TillConfigForm({ till, tillId }: TillConfigFormProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [updateTill, isUpdating, updateError] = useUpdateTill(tillId);
  const [name, setName] = useState(() => till.tillName ?? "");
  const [code, setCode] = useState(() => till.tillCode ?? "");
  const [isActive, setIsActive] = useState(() => till.isActive ?? true);

  useEffect(() => {
    if (updateError) {
      showToast({
        type: "error",
        message: (updateError as Error).message || t("common.error"),
      });
    }
  }, [updateError, t]);

  const handleCodeChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
    setCode(upper);
  };

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      showToast({
        type: "error",
        message: t("company.tills.validation.nameRequired"),
      });
      return;
    }
    if (!code.trim()) {
      showToast({
        type: "error",
        message: t("company.tills.validation.codeRequired"),
      });
      return;
    }
    if (!CODE_REGEX.test(code)) {
      showToast({
        type: "error",
        message: t("company.tills.validation.codeFormat"),
      });
      return;
    }

    const request: UpdateTillRequest = {
      tillName: name.trim(),
      tillCode: code,
      isActive,
    };

    updateTill(request, () => {
      queryClient.invalidateQueries({ queryKey: ["tills"] });
      queryClient.invalidateQueries({ queryKey: ["tills", tillId] });
      showToast({
        type: "success",
        message: t("company.tills.tillUpdated"),
      });
    });
  }, [tillId, name, code, isActive, updateTill, queryClient, t]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("company.tills.tillInformation")}</CardTitle>
      </CardHeader>
      <CardContent className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="edit-till-name">{t("company.tills.name")}</Label>
            <Input
              id="edit-till-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("company.tills.name")}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-till-code">{t("company.tills.code")}</Label>
            <Input
              id="edit-till-code"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder={t("company.tills.codePlaceholder")}
              disabled={isUpdating}
              maxLength={CODE_LENGTH}
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-2 ">
            <Label>{t("company.tills.status")}</Label>
            <Select
              value={isActive ? "ACTIVE" : "INACTIVE"}
              onValueChange={(v) => setIsActive(v === "ACTIVE")}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t("company.tills.active")}</SelectItem>
                <SelectItem value="INACTIVE">{t("company.tills.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2 text-sm text-muted-foreground">
            {t("company.tills.branch")}: {till.branch?.name ?? "-"} ({till.branch?.branchCode ?? "-"})
          </div>
        </div>
        <div className="flex justify-end pt-6 mt-6 border-t">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? t("common.saving") : t("company.saveChanges")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
