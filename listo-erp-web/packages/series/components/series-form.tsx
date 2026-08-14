"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useCreateSeries, useUpdateSeries } from "@/packages/series/api";
import { SERIES_MODULES, type SeriesModule } from "@/packages/series/constants";
import type { Series } from "@/packages/series/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SeriesFormProps {
  series?: Series;
}

export function SeriesForm({ series }: SeriesFormProps) {
  const t = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState(series?.description ?? "");
  const [format, setFormat] = useState(series?.format ?? "");
  const [consecutive, setConsecutive] = useState(series?.consecutive ?? 1);
  const [module, setModule] = useState<SeriesModule>(
    series?.module ?? SERIES_MODULES[0],
  );
  const [isActive, setIsActive] = useState(series?.isActive ?? true);
  const [createSeries, isCreating] = useCreateSeries();
  const [updateSeries, isUpdating] = useUpdateSeries(series?.id ?? 0);
  const isSaving = isCreating || isUpdating;

  const save = () => {
    if (!description.trim()) {
      showToast({
        type: "error",
        message: t("administration.series.validation.descriptionRequired"),
      });
      return;
    }
    if (!format.trim()) {
      showToast({
        type: "error",
        message: t("administration.series.validation.formatRequired"),
      });
      return;
    }
    if (consecutive < 1) {
      showToast({
        type: "error",
        message: t("administration.series.validation.consecutiveMin"),
      });
      return;
    }
    const payload = {
      description: description.trim(),
      format: format.trim(),
      consecutive,
      module,
      isActive,
    };
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      showToast({
        type: "success",
        message: series
          ? t("administration.series.seriesUpdated")
          : t("administration.series.seriesCreated"),
      });
      router.push("/listoerp/company/series");
    };
    if (series) updateSeries(payload, onSuccess);
    else createSeries(payload, onSuccess);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("administration.series.seriesInformation")}</CardTitle>
          <CardDescription>
            {t("administration.series.seriesInformationDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="series-description">
              {t("administration.series.description")}
            </Label>
            <Input
              id="series-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isSaving}
              autoFocus
              placeholder={t("administration.series.descriptionPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="series-format">
              {t("administration.series.format")}
            </Label>
            <Input
              id="series-format"
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              disabled={isSaving}
              placeholder={t("administration.series.formatPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="series-consecutive">
              {t("administration.series.consecutive")}
            </Label>
            <Input
              id="series-consecutive"
              type="number"
              min={1}
              value={consecutive}
              onChange={(event) => setConsecutive(Number(event.target.value))}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("administration.series.module")}</Label>
            <Select
              value={module}
              onValueChange={(value) => setModule(value as SeriesModule)}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("administration.series.selectModule")}
                />
              </SelectTrigger>
              <SelectContent>
                {SERIES_MODULES.map((mod) => (
                  <SelectItem key={mod} value={mod}>
                    {t(`administration.series.modules.${mod.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3 md:col-span-2">
            <div>
              <Label htmlFor="series-active">
                {t("administration.series.active")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("administration.series.activeDescription")}
              </p>
            </div>
            <Switch
              id="series-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isSaving}
        >
          {t("common.cancel")}
        </Button>
        <Button
          onClick={save}
          disabled={isSaving || !description.trim() || !format.trim()}
        >
          {isSaving
            ? t("common.saving")
            : t("administration.series.saveSeries")}
        </Button>
      </div>
    </div>
  );
}
