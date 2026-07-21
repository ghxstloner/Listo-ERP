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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { applyCompanyTheme } from '@/lib/company-theme';
import { createLoginSchema } from '@/lib/validator/login';
import { setApiCompanyId, setApiPermissions, setApiToken, setApiUserInfo } from "@config";
import { ArrowRight } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { useLogin } from '../api';
import { SelectCompany } from './select-company';


type Step = 'credentials' | 'select-company';

interface FieldErrors {
  identifier?: string;
  password?: string;
}

interface LoginFormProps {
  onForgotPassword: () => void;
}

export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const t = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [login, isLoading, error, loginData] = useLogin();

  useEffect(() => {
    if (error) {
      showToast({
        type: "error",
        message: error.message || t("auth.loginError"),
      });
    }
  }, [error, t]);

  const handleLogin = () => {
    const schema = createLoginSchema(t);
    const result = schema.safeParse({ identifier, password });

    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof FieldErrors;
        errors[field] = err.message;
      });
      setFieldErrors(errors);

      const firstError = result.error.issues[0];
      if (firstError) {
        showToast({
          type: "error",
          message: firstError.message,
        });
      }
      return;
    }

    setFieldErrors({});
    login({ identifier, password }, (response) => {
      setApiToken(response.access_token);
      setApiUserInfo(response.user);

      showToast({
        type: "success",
        message: t("auth.loginSuccess"),
      });

      if (response.companies.length === 1) {
        const company = response.companies[0];
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
      } else if (response.companies.length > 1) {
        setStep('select-company');
      }
    });
  };

  if (step === 'select-company' && loginData) {
    return <SelectCompany companies={loginData.companies} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center mb-4">
        <Image
          src="/logo.png"
          alt="Listo ERP Express"
          width={350}
          height={60}
          priority
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.welcomeBack")}</CardTitle>
          <CardDescription>
            {t("auth.loginDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="identifier">{t("auth.identifier")}</FieldLabel>
              <Input
                id="identifier"
                autoComplete="username"
                placeholder={t("auth.identifierPlaceholder")}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                aria-invalid={!!fieldErrors.identifier}
              />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-primary bg-transparent border-none cursor-pointer"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldErrors.password}
              />
            </Field>
            <Field>
              <Button onClick={handleLogin} disabled={isLoading} className="w-full inline-flex items-center justify-center gap-2">
                {isLoading ? t("common.loggingIn") : t("auth.login")}
                <ArrowRight className="w-3 h-3 translate-y-px" />
              </Button>
              <FieldDescription className="text-center text-xs">
                {t("auth.acceptTerms")}{" "}
                <a href="#" className="underline underline-offset-2 hover:text-primary">
                  {t("auth.termsOfService")}
                </a>{" "}
                {t("auth.andOur")}{" "}
                <a href="#" className="underline underline-offset-2 hover:text-primary">
                  {t("auth.privacyPolicy")}
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
