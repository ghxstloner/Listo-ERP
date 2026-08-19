import type { Locale } from "@/lib/i18n";

export function formatCurrentMonth(locale: Locale, date = new Date()) {
  const formatted = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toLocaleUpperCase(locale) + formatted.slice(1);
}
