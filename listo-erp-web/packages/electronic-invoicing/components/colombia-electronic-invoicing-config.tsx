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
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { CheckCircle, Spinner } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  useGetColombiaElectronicInvoicingConfiguration,
  useUpdateColombiaElectronicInvoicingConfiguration,
} from "../api";
import type { ElectronicInvoicingEnvironment, ElectronicInvoicingNumberingMode } from "../types";

const NUMBERING_RANGE_PATTERN = /^[A-Za-z0-9]{1,4}-[1-9]\d*$/;
const MASKED_TOKEN = "****************";

export function ColombiaElectronicInvoicingConfig() {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [configuration, isLoading, error] =
    useGetColombiaElectronicInvoicingConfiguration();
  const [updateConfiguration, isUpdating, updateError] =
    useUpdateColombiaElectronicInvoicingConfiguration();
  const [environment, setEnvironment] =
    useState<ElectronicInvoicingEnvironment>("DEMO");
  const [numberingMode, setNumberingMode] =
    useState<ElectronicInvoicingNumberingMode>("WITH_PREFIX");
  const [providerBaseUrl, setProviderBaseUrl] = useState("");
  const [numberingRange, setNumberingRange] = useState("");
  const [nextConsecutive, setNextConsecutive] = useState("");
  const [tokenEmpresa, setTokenEmpresa] = useState("");
  const [tokenPassword, setTokenPassword] = useState("");

  useEffect(() => {
    if (!configuration) return;
    setEnvironment(configuration.environment);
    setNumberingMode(configuration.numberingMode);
    setProviderBaseUrl(configuration.providerBaseUrl ?? "");
    setNumberingRange(configuration.numberingRange);
    setNextConsecutive(String(configuration.nextConsecutive));
    setTokenEmpresa(configuration.hasCredentials ? MASKED_TOKEN : "");
    setTokenPassword(configuration.hasCredentials ? MASKED_TOKEN : "");
  }, [configuration]);

  useEffect(() => {
    const requestError = error ?? updateError;
    if (!requestError) return;
    showToast({
      type: "error",
      message: requestError.message || t("common.error"),
    });
  }, [error, t, updateError]);

  const handleSave = () => {
    const next = Number(nextConsecutive);
    const hasNewTokenEmpresa =
      Boolean(tokenEmpresa.trim()) && tokenEmpresa !== MASKED_TOKEN;
    const hasNewTokenPassword =
      Boolean(tokenPassword.trim()) && tokenPassword !== MASKED_TOKEN;
    const rangeStart = Number(numberingRange.split("-")[1]);
    let hasValidProviderUrl = false;
    try {
      hasValidProviderUrl = new URL(providerBaseUrl).protocol === "https:";
    } catch {
      hasValidProviderUrl = false;
    }

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
    if (!hasValidProviderUrl) {
      showToast({
        type: "error",
        message: "Ingresa una URL HTTPS válida de TheFactory.",
      });
      return;
    }
    if (!configuration && (!hasNewTokenEmpresa || !hasNewTokenPassword)) {
      showToast({
        type: "error",
        message: t("company.electronicInvoicing.credentialsRequired"),
      });
      return;
    }
    if (hasNewTokenEmpresa !== hasNewTokenPassword) {
      showToast({
        type: "error",
        message: t("company.electronicInvoicing.credentialsPairRequired"),
      });
      return;
    }

    updateConfiguration(
      {
        environment,
        numberingMode,
        providerBaseUrl: providerBaseUrl.trim().replace(/\/$/, ""),
        rangoNumeracion: numberingRange,
        nextConsecutive: next,
        ...(hasNewTokenEmpresa && {
          tokenEmpresa: tokenEmpresa.trim(),
          tokenPassword: tokenPassword.trim(),
        }),
      },
      () => {
        setTokenEmpresa(MASKED_TOKEN);
        setTokenPassword(MASKED_TOKEN);
        queryClient.invalidateQueries({
          queryKey: ["electronic-invoicing", "configuration", "colombia"],
        });
        showToast({
          type: "success",
          message: t("company.electronicInvoicing.saved"),
        });
      },
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex min-h-48 items-center justify-center">
          <Spinner className="size-6" weight="bold" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{t("company.electronicInvoicing.colombia")}</CardTitle>
            <CardDescription className="mt-1">
              {t("company.electronicInvoicing.description")}
            </CardDescription>
          </div>
          {configuration?.hasCredentials && (
            <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle className="size-4" weight="fill" />
              {t("company.electronicInvoicing.credentialsConfigured")}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-7 pt-6">
        <section className="space-y-4">
          <div>
            <h3 className="font-medium">
              {t("company.electronicInvoicing.credentials")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("company.electronicInvoicing.credentialsHint")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="electronic-invoicing-token-company">
                {t("company.electronicInvoicing.tokenEmpresa")}
              </Label>
              <Input
                id="electronic-invoicing-token-company"
                type={tokenEmpresa === MASKED_TOKEN ? "text" : "password"}
                autoComplete="new-password"
                value={tokenEmpresa}
                onChange={(event) => setTokenEmpresa(event.target.value)}
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="electronic-invoicing-token-password">
                {t("company.electronicInvoicing.tokenPassword")}
              </Label>
              <Input
                id="electronic-invoicing-token-password"
                type={tokenPassword === MASKED_TOKEN ? "text" : "password"}
                autoComplete="new-password"
                value={tokenPassword}
                onChange={(event) => setTokenPassword(event.target.value)}
                disabled={isUpdating}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t pt-6">
          <div>
            <h3 className="font-medium">
              {t("company.electronicInvoicing.numberingRange")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("company.electronicInvoicing.numberingRangeHint")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="electronic-invoicing-environment">
                {t("company.electronicInvoicing.environment")}
              </Label>
              <Select
                value={environment}
                onValueChange={(value) => {
                  const nextEnvironment = value as ElectronicInvoicingEnvironment;
                  setEnvironment(nextEnvironment);
                  setProviderBaseUrl(
                    nextEnvironment === "DEMO"
                      ? "https://demoemision21-api.thefactoryhka.com.co"
                      : "https://emision21-api.thefactoryhka.com.co",
                  );
                }}
                disabled={isUpdating}
              >
                <SelectTrigger
                  id="electronic-invoicing-environment"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEMO">
                    {t("company.electronicInvoicing.demo")}
                  </SelectItem>
                  <SelectItem value="PRODUCTION">
                    {t("company.electronicInvoicing.production")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="electronic-invoicing-provider-url">
                URL base TheFactory
              </Label>
              <Input
                id="electronic-invoicing-provider-url"
                type="url"
                value={providerBaseUrl}
                onChange={(event) => setProviderBaseUrl(event.target.value)}
                placeholder="https://demoemision21-api.thefactoryhka.com.co"
                disabled={isUpdating}
              />
              <p className="text-xs text-muted-foreground">
                Se valida contra el ambiente y los secuenciales activos de TheFactory.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="electronic-invoicing-numbering-mode">
                Modalidad del secuencial
              </Label>
              <Select
                value={numberingMode}
                onValueChange={(value) =>
                  setNumberingMode(value as ElectronicInvoicingNumberingMode)
                }
                disabled={isUpdating}
              >
                <SelectTrigger id="electronic-invoicing-numbering-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WITH_PREFIX">Manual con prefijo</SelectItem>
                  <SelectItem value="WITHOUT_PREFIX">Manual sin prefijo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="electronic-invoicing-range">
                {t("company.electronicInvoicing.numberingRange")}
              </Label>
              <Input
                id="electronic-invoicing-range"
                value={numberingRange}
                onChange={(event) =>
                  setNumberingRange(event.target.value.toUpperCase())
                }
                placeholder="DEMO-1"
                maxLength={20}
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="electronic-invoicing-next-consecutive">
                {t("company.electronicInvoicing.nextConsecutive")}
              </Label>
              <Input
                id="electronic-invoicing-next-consecutive"
                type="number"
                min={1}
                step={1}
                value={nextConsecutive}
                onChange={(event) => setNextConsecutive(event.target.value)}
                disabled={isUpdating}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end border-t pt-5">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
