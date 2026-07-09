"use client";

import { getDictionary, type Locale } from "@/lib/i18n";
import { createContext, startTransition, useContext, useEffect, useState } from "react";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dictionary: ReturnType<typeof getDictionary>;
  t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const STORAGE_KEY = "app-locale";

export function LanguageProvider({
  children,
  defaultLocale = "es",
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && (stored === "es" || stored === "en" || stored === "pt" || stored === "zh")) {
        startTransition(() => {
          setLocaleState(stored);
        });
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLocale);
    }
  };

  const dictionary = getDictionary(locale);

  const t = (path: string): string => {
    const keys = path.split(".");
    let value: unknown = dictionary;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key as keyof typeof value];
      } else {
        return path;
      }
    }

    return typeof value === "string" ? value : path;
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dictionary, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
