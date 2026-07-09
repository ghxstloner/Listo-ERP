export interface CompanyTheme {
  primaryColor: string;
  secondaryColor: string;
}

export const DEFAULT_THEME: CompanyTheme = {
  primaryColor: '#ff6600',
  secondaryColor: '#180900',
};

function isColorLight(hex: string): boolean {
  const color = hex.replace('#', '');
  
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
}

function getForegroundColor(backgroundColor: string): string {
  return isColorLight(backgroundColor) ? '#000000' : '#ffffff';
}

function isValidHexColor(color: string): boolean {
  return /^#?[0-9A-Fa-f]{6}$/.test(color);
}

function normalizeHexColor(color: string): string {
  if (!color) return '';
  return color.startsWith('#') ? color : `#${color}`;
}

export function applyCompanyTheme(
  theme: Partial<CompanyTheme> | null,
  element: HTMLElement = document.documentElement
): void {
  const primaryColor = normalizeHexColor(theme?.primaryColor || '') || DEFAULT_THEME.primaryColor;
  const secondaryColor = normalizeHexColor(theme?.secondaryColor || '') || DEFAULT_THEME.secondaryColor;

  const validPrimary = isValidHexColor(primaryColor) ? primaryColor : DEFAULT_THEME.primaryColor;
  const validSecondary = isValidHexColor(secondaryColor) ? secondaryColor : DEFAULT_THEME.secondaryColor;

  element.style.setProperty('--company-primary', validPrimary);
  element.style.setProperty('--company-primary-foreground', getForegroundColor(validPrimary));

  element.style.setProperty('--company-secondary', validSecondary);
  element.style.setProperty('--company-secondary-foreground', getForegroundColor(validSecondary));
}

export function resetToDefaultTheme(element: HTMLElement = document.documentElement): void {
  element.style.removeProperty('--company-primary');
  element.style.removeProperty('--company-primary-foreground');
  element.style.removeProperty('--company-secondary');
  element.style.removeProperty('--company-secondary-foreground');
}

export function getCurrentTheme(element: HTMLElement = document.documentElement): CompanyTheme {
  const computedStyle = getComputedStyle(element);
  
  return {
    primaryColor: computedStyle.getPropertyValue('--company-primary').trim() || DEFAULT_THEME.primaryColor,
    secondaryColor: computedStyle.getPropertyValue('--company-secondary').trim() || DEFAULT_THEME.secondaryColor,
  };
}
