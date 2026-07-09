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
import { createForgotPasswordSchema } from '@/lib/validator/forgot-password';
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useState } from 'react';
import { useForgotPassword } from '../api';

interface FieldErrors {
  email?: string;
}

interface ForgotPasswordFormProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

export function ForgotPasswordForm({ onBack, onSuccess }: ForgotPasswordFormProps) {
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [forgotPassword, isLoading, error] = useForgotPassword();

  useEffect(() => {
    if (error) {
      showToast({
        type: "error",
        message: error.message || t("auth.forgotPasswordError"),
      });
    }
  }, [error, t]);

  const handleSubmit = () => {
    const schema = createForgotPasswordSchema(t);
    const result = schema.safeParse({ email });

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
    forgotPassword({ email }, (response) => {
      showToast({
        type: "success",
        message: response.message || t("auth.forgotPasswordSuccess"),
      });
      onSuccess(email);
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
          <CardTitle>{t("auth.forgotPasswordTitle")}</CardTitle>
          <CardDescription>
            {t("auth.forgotPasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">{t("auth.email")}</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>
              )}
            </Field>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading} 
                className="w-full inline-flex items-center justify-center gap-2"
              >
                {isLoading ? t("common.sending") : t("auth.sendCode")}
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
