'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { applyCompanyTheme } from '@/lib/company-theme';
import { setApiCompanyId, setApiPermissions } from "@config";
import { useRouter } from "next/navigation";
import { useState } from 'react';
import { LoginResponse } from '../types';

interface SelectCompanyProps {
  companies: LoginResponse['companies'];
}

export function SelectCompany({ companies }: SelectCompanyProps) {
  const t = useTranslation();
  const router = useRouter();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  const handleContinue = () => {
    const company = companies.find((c) => String(c.id) === selectedCompanyId);
    if (!company) {
      showToast({
        type: "error",
        message: t("auth.selectCompany"),
      });
      return;
    }

    setApiCompanyId(String(company.id));
    setApiPermissions(company.permissions);

    applyCompanyTheme({
      primaryColor: company.primaryColor,
      secondaryColor: company.secondaryColor,
    });

    showToast({
      type: "success",
      message: `${t("auth.welcomeToCompany")} ${company.name}`,
    });

    router.push('/listoerp/dashboard');
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.selectCompany")}</CardTitle>
          <CardDescription>
            {t("auth.selectCompanyDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("auth.selectCompanyPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleContinue} disabled={!selectedCompanyId}>
              {t("common.continue")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
