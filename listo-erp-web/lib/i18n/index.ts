import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { pt } from "./dictionaries/pt";
import { zh } from "./dictionaries/zh";
import type { Dictionary, Locale } from "./types";

export const dictionaries: Record<Locale, Dictionary> = {
  es,
  en,
  pt,
  zh,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function getTranslation(
  dictionary: Dictionary,
  path: string
): string {
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
}

export type { Dictionary, Locale } from "./types";
