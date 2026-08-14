export const SERIES_MODULES = ["ORDERS"] as const;
export type SeriesModule = (typeof SERIES_MODULES)[number];

export function formatSeriesNumber(format: string, consecutive: number): string {
  const match = format.match(/\{(0+)\}/);
  if (!match) {
    return `${format}${consecutive}`;
  }
  const padding = match[1].length;
  const padded = String(consecutive).padStart(padding, "0");
  return format.replace(match[0], padded);
}
