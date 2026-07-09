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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { createResetPasswordSchema } from '@/lib/validator/reset-password';
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useState } from 'react';
import { useResetPassword } from '../api';

interface FieldErrors {
  code?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface ResetPasswordFormProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function ResetPasswordForm({ email, onBack, onSuccess }: ResetPasswordFormProps) {
  const t = useTranslation();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [resetPassword, isLoading, error] = useResetPassword();

  useEffect(() => {
    if (error) {
      showToast({
        type: "error",
        message: error.message || t("auth.resetPasswordError"),
      });
    }
  }, [error, t]);

  const handleSubmit = () => {
    const schema = createResetPasswordSchema(t);
    const result = schema.safeParse({ code, newPassword, confirmPassword });

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
    resetPassword({ code, newPassword, confirmPassword }, (response) => {
      showToast({
        type: "success",
        message: response.message || t("auth.resetPasswordSuccess"),
      });
      onSuccess();
    });
  };

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
          <CardTitle>{t("auth.resetPasswordTitle")}</CardTitle>
          <CardDescription>
            {t("auth.resetPasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">{t("auth.verificationCode")}</FieldLabel>
              <Input
                id="code"
                type="text"
                placeholder={t("auth.codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                aria-invalid={!!fieldErrors.code}
              />
              {fieldErrors.code && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.code}</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="newPassword">{t("auth.newPassword")}</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                placeholder={t("auth.newPasswordPlaceholder")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                aria-invalid={!!fieldErrors.newPassword}
              />
              {fieldErrors.newPassword && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.newPassword}</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">{t("auth.confirmPassword")}</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("auth.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={!!fieldErrors.confirmPassword}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </Field>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading} 
                className="w-full inline-flex items-center justify-center gap-2"
              >
                {isLoading ? t("common.resetting") : t("auth.resetPassword")}
                <ArrowRight className="w-3 h-3 translate-y-px" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3 h-3" />
                {t("auth.backToLogin")}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
