import { useLanguage } from "@/components/providers/language-provider";

export function useTranslation() {
  const { t } = useLanguage();
  return t;
}
