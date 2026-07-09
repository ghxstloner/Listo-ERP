'use client';

import { useEffect } from 'react';
import { applyCompanyTheme, resetToDefaultTheme, type CompanyTheme } from './company-theme';

export function useCompanyTheme(theme: Partial<CompanyTheme> | null): void {
  useEffect(() => {
    if (theme) {
      applyCompanyTheme(theme);
    } else {
      resetToDefaultTheme();
    }

    return () => {
      if (theme) {
        resetToDefaultTheme();
      }
    };
  }, [theme?.primaryColor, theme?.secondaryColor]);
}
