"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Globe } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();
  const [mounted] = useState(() => typeof window !== "undefined");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" suppressHydrationWarning>
          <Globe className="h-4 w-4" />
          <span className="sr-only" suppressHydrationWarning>
            {mounted ? t("theme.changeLanguage") : "Cambiar idioma"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale("es")}
          className={locale === "es" ? "bg-accent" : ""}
        >
          <span className="mr-2">🇪🇸</span>
          {mounted ? t("theme.spanish") : "Español"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("en")}
          className={locale === "en" ? "bg-accent" : ""}
        >
          <span className="mr-2">🇬🇧</span>
          {mounted ? t("theme.english") : "English"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("pt")}
          className={locale === "pt" ? "bg-accent" : ""}
        >
          <span className="mr-2">🇵🇹</span>
          {mounted ? t("theme.portuguese") : "Português"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("zh")}
          className={locale === "zh" ? "bg-accent" : ""}
        >
          <span className="mr-2">🇨🇳</span>
          {mounted ? t("theme.chinese") : "中文"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
