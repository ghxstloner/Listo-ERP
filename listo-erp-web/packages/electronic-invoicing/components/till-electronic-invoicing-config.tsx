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
import {
  useGetTillColombiaElectronicInvoicingConfiguration,
  useUpdateTillColombiaElectronicInvoicingConfiguration,
} from "@/packages/electronic-invoicing/api";
import type { ElectronicInvoicingNumberingMode } from "@/packages/electronic-invoicing/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

const NUMBERING_RANGE_PATTERN = /^[A-Za-z0-9]{1,4}-[1-9]\d*$/;

interface TillElectronicInvoicingConfigProps {
  tillId: number;
}

export function TillElectronicInvoicingConfig({
  tillId,
}: TillElectronicInvoicingConfigProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [configuration, isLoading, error] =
    useGetTillColombiaElectronicInvoicingConfiguration(tillId);
  const [updateConfiguration, isUpdating, updateError] =
    useUpdateTillColombiaElectronicInvoicingConfiguration(tillId);
  const [numberingMode, setNumberingMode] =
    useState<ElectronicInvoicingNumberingMode>("WITH_PREFIX");
  const [numberingRange, setNumberingRange] = useState("");
  const [nextConsecutive, setNextConsecutive] = useState("");

  useEffect(() => {
    if (!configuration) return;
    setNumberingMode(configuration.numberingMode);
    setNumberingRange(configuration.numberingRange);
    setNextConsecutive(String(configuration.nextConsecutive));
  }, [configuration]);

  useEffect(() => {
    const requestError = error ?? updateError;
    if (!requestError) return;
    showToast({
      type: "error",
      message: requestError.message || t("common.error"),
    });
  }, [error, t, updateError]);

  const handleSave = useCallback(() => {
    const next = Number(nextConsecutive);
    const rangeStart = Number(numberingRange.split("-")[1]);

    if (
      !NUMBERING_RANGE_PATTERN.test(numberingRange) ||
      !Number.isInteger(next) ||
      next < rangeStart
    ) {
      showToast({
        type: "error",
        message: t("company.electronicInvoicing.invalidNumbering"),
      });
      return;
    }

    updateConfiguration(
      {
        numberingMode,
        rangoNumeracion: numberingRange,
        nextConsecutive: next,
      },
      () => {
        queryClient.invalidateQueries({
          queryKey: ["electronic-invoicing", "till", tillId, "colombia"],
        });
        showToast({
          type: "success",
          message: t("company.electronicInvoicing.tillSaved"),
        });
      },
    );
  }, [tillId, numberingMode, numberingRange, nextConsecutive, updateConfiguration, queryClient, t]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex min-h-32 items-center justify-center">
          <span className="text-sm text-muted-foreground">
            {t("common.loading")}
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {t("company.electronicInvoicing.tillNumbering")}
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="till-ei-numbering-mode">
              {t("company.electronicInvoicing.numberingMode")}
            </Label>
            <Select
              value={numberingMode}
              onValueChange={(value) =>
                setNumberingMode(value as ElectronicInvoicingNumberingMode)
              }
              disabled={isUpdating}
            >
              <SelectTrigger id="till-ei-numbering-mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WITH_PREFIX">Manual con prefijo</SelectItem>
                <SelectItem value="WITHOUT_PREFIX">Manual sin prefijo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="till-ei-range">
              {t("company.electronicInvoicing.numberingRange")}
            </Label>
            <Input
              id="till-ei-range"
              value={numberingRange}
              onChange={(event) =>
                setNumberingRange(event.target.value.toUpperCase())
              }
              placeholder="A1-1"
              maxLength={20}
              disabled={isUpdating}
            />
            <p className="text-xs text-muted-foreground">
              {t("company.electronicInvoicing.numberingRangeHint")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="till-ei-next-consecutive">
              {t("company.electronicInvoicing.nextConsecutive")}
            </Label>
            <Input
              id="till-ei-next-consecutive"
              type="number"
              min={1}
              step={1}
              value={nextConsecutive}
              onChange={(event) => setNextConsecutive(event.target.value)}
              disabled={isUpdating}
            />
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
