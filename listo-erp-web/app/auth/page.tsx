"use client";

import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslation } from "@/hooks/use-translation";
import { ForgotPasswordForm } from "@/packages/auth/components/forgot-password-form";
import { LoginForm } from "@/packages/auth/components/login-form";
import { ResetPasswordForm } from "@/packages/auth/components/reset-password-form";
import Image from "next/image";
import { useState } from "react";

type AuthStep = 'login' | 'forgot-password' | 'reset-password';

export default function AuthPage() {
  const t = useTranslation();
  const [step, setStep] = useState<AuthStep>('login');
  const [resetEmail, setResetEmail] = useState('');

  const handleForgotPassword = () => {
    setStep('forgot-password');
  };

  const handleBackToLogin = () => {
    setStep('login');
    setResetEmail('');
  };

  const handleForgotPasswordSuccess = (email: string) => {
    setResetEmail(email);
    setStep('reset-password');
  };

  const handleResetPasswordSuccess = () => {
    setStep('login');
    setResetEmail('');
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative flex flex-col items-center justify-center p-6 md:p-10 bg-background">
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
        <div className="w-full max-w-sm">
          {step === 'login' && (
            <LoginForm onForgotPassword={handleForgotPassword} />
          )}
          {step === 'forgot-password' && (
            <ForgotPasswordForm 
              onBack={handleBackToLogin}
              onSuccess={handleForgotPasswordSuccess}
            />
          )}
          {step === 'reset-password' && (
            <ResetPasswordForm 
              email={resetEmail}
              onBack={handleBackToLogin}
              onSuccess={handleResetPasswordSuccess}
            />
          )}
        </div>
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-xs text-muted-foreground">
            {t("auth.copyright")}
          </p>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src="/login.jpg"
          alt={t("auth.backgroundImage")}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-20 text-primary-foreground">
          <Image
            src="/logo.png"
            alt="Listo ERP Express"
            width={180}
            height={60}
            className="mb-8"
          />
          <blockquote className="space-y-6">
            <p className="text-3xl leading-relaxed font-semibold">
              &ldquo;{t("auth.testimonial")}&rdquo;
            </p>
            <footer className="text-base text-primary-foreground/80">
              <span className="font-semibold">{t("auth.testimonialAuthor")}</span>, {t("auth.testimonialRole")}
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}